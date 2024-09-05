import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MyBedrockSimpleChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext('stage') || 'dev';

    const table = new dynamodb.TableV2(this, `Table-${stage}`, {
      tableName: `MyBedrockSimpleChat_Table_${stage}`,
      partitionKey: { name: 'UserId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SessionId', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    // example resource
    // const queue = new sqs.Queue(this, 'MyBedrockSimpleChatQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
