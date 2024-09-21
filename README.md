# my-bedrock-simple-chat

Chat interface powered by bedrock

## This is CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## How to prepare

```bash
$ node -v
v22.7.0

$ cdk --version
2.159.1

$ npm install
```

## How to deploy

Create ECR repository before deploying app.

```bash
# setting environment variables is necessary at every time
export AWS_PROFILE=<Your target profile>
export CDK_DEPLOY_ACCOUNT=<Your account id>
export CDK_DEPLOY_REGION=<Your target region>

# get IP address
curl ipinfo.io/ip

cdk synth
cdk bootstrap

cdk deploy -c stage=<deployment stage> -c myIp=<Your IP address>/32 -c repositoryName=<ECR repository name> -c modelId=<Bedrock model ID>
```
