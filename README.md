# my-bedrock-simple-chat

Chat application powered by bedrock inspired by <https://qiita.com/minorun365/items/84bef6f06e450a310a6a>.

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

### Enable a LLM model in Bedrock

Login AWS console and open Bedrock console.

Make a model you want to use enabled and keep the model ID.

### Upload container image to ECR

Open AWS ECR console and create a repository.

Build a docker image of application and upload it to the repository as following.

```bash
cd app
# build app image
docker build -t simple-br-app-image .

# upload the image to ECR
## These commands can be seen on your repository page in ECR console.
aws ecr get-login-password --region <your region> | docker login --username AWS --password-stdin <your account>.dkr.ecr.<your region>.amazonaws.com

docker build -t <your repository name> .

docker tag <your repository name>:latest <your account>.dkr.ecr.<your region>.amazonaws.com/<your repository name>:latest

docker push <your account>.dkr.ecr.<your region>.amazonaws.com/<your repository name>:latest
```

### Deploy infrastructure

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
