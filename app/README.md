# Chat UI of my-bedrock-simple-chat

## Environment

```bash
$ python -V
Python 3.12.5

$ pipenv --version
pipenv, version 2024.0.1
```

## How to setup

```bash
# launch virtual env
pipenv shell

# install packages
pipenv install

# (close virtual env)
deactivate
```

## How to run on local env

Note:
It is necessary to setup your AWS environment and deploy DynamoDB table before running this script.

```bash
TABLE_NAME=<your_dynamodb_table_name> streamlit run run.py

  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8501
  Network URL: http://172.19.90.73:8501
```

## How to run on docker container

```bash
# build
docker build -t simple-br-app-image .
# run (on local PC)
docker run -p 8501:8501 \
           -e AWS_ACCESS_KEY_ID=<your_access_key_id> \
           -e AWS_SECRET_ACCESS_KEY=<your_secret_access_key>
           -e AWS_DEFAULT_REGION=<your_region>
           -e TABLE_NAME=<your_dynamodb_table_name>
           simple-br-app-image
```

## How to upload image to ECR

Create ECR repository.
You can confirm push command on AWS console like below.

```bash
aws ecr get-login-password --region <your region> | docker login --username AWS --password-stdin <your account>.dkr.ecr.<your region>.amazonaws.com

docker build -t <your repository name> .

docker tag <your repository name>:latest 449395013922.dkr.ecr.<your region>.amazonaws.com/<your repository name>:latest

docker push <your account>.dkr.ecr.<your region>.amazonaws.com/<your repository name>:latest
```
