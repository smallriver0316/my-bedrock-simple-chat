import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { assert } from 'console';

export class MyBedrockSimpleChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext('stage') || 'dev';
    const myIp = this.node.tryGetContext('myIp');
    const repoName = this.node.tryGetContext('repositoryName');
    assert(repoName, 'You must specify ECR repository name!');
    const imageTag = this.node.tryGetContext('imageTag') || 'latest';
    const modelId = this.node.tryGetContext('modelId')
    assert(modelId, 'You must specify Bedrock model ID');

    // DynamoDB
    const table = new dynamodb.TableV2(this, `Table-${stage}`, {
      tableName: `MyBedrockSimpleChat_Table_${stage}`,
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SessionId', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC
    const vpc = new ec2.Vpc(this, `Vpc-${stage}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addGatewayEndpoint(`DynamoDbEndpoint-${stage}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    vpc.addInterfaceEndpoint(`EcrEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addGatewayEndpoint(`S3Endpoint-${stage}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    vpc.addInterfaceEndpoint(`EcrDockerEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint(`CloudwatchEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    vpc.addInterfaceEndpoint(`BedrockEndpoint-${stage}`, {
      service: ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // security group for ALB
    const sgForAlb = new ec2.SecurityGroup(this, `AlbSecurityGroup-${stage}`, {
      vpc,
      description: "Security group for ALB",
    });
    sgForAlb.addIngressRule(
      myIp === undefined ? ec2.Peer.anyIpv4() : ec2.Peer.ipv4(myIp),
      ec2.Port.HTTP
    );

    const sgForApp = new ec2.SecurityGroup(this, `AppSecurityGroup-${stage}`, {
      vpc,
      description: "Security group for Fargate instance",
      allowAllOutbound: true,
    });
    sgForApp.connections.allowFrom(sgForAlb, ec2.Port.tcp(80), 'Allow ALB access');

    // ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, `ALB-${stage}`, {
      vpc,
      internetFacing: true,
      securityGroup: sgForAlb,
    });

    const listener = lb.addListener(`AlbListener-${stage}`, {
      port: 80,
      open: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup-${stage}`, {
      vpc,
      port: 8501,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        healthyHttpCodes: '200',
      }
    });

    listener.addTargetGroups(`AlbTarget-${stage}`, {
      targetGroups: [targetGroup],
    });

    // IAM Role
    const taskRole = new iam.Role(this, `TaskRole-${stage}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
        'dynamodb:ConditionCheckItem',
        'dynamodb:PutItem',
        'dynamodb:DescribeTable',
        'dynamodb:GetItem',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
      ],
      resources: [ table.tableArn ],
    }));
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:*'
      ],
      resources: ['*'],
    }));

    // ECS

    // cluster
    const cluster = new ecs.Cluster(this, `Cluster-${stage}`, {
      vpc
    });

    // task definition
    const taskDef = new ecs.FargateTaskDefinition(this, `TaskDef-${stage}`, {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole,
    });

    const repository = ecr.Repository.fromRepositoryName(this, `Repository-${stage}`, repoName);

    const container = taskDef.addContainer(`Container-${stage}`, {
      image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
      containerName: 'my-bdr-simple-app',
      environment: {
        'TABLE_NAME': table.tableName,
        'MODEL': modelId,
      },
    });
    container.addPortMappings({
      containerPort: 8501,
      hostPort: 8501,
    });

    const service = new ecs.FargateService(this, `Service-${stage}`, {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [sgForApp]
    });
    service.attachToApplicationTargetGroup(targetGroup);
  }
}
