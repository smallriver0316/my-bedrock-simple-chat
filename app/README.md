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
# install packages
pipenv install

# launch virtual env
pipenv shell
```

## How to run on local env

Note:
It is necessary to setup your AWS environment and deploy DynamoDB table before running this script.

```bash
streamlit run run.py

  You can now view your Streamlit app in your browser.

  Local URL: http://localhost:8501
  Network URL: http://172.19.90.73:8501
```

## How to run on docker container

```bash
# build
docker build -t simple-br-app-image .
# run
docker run -p 8501:8501 simple-br-app-image
```
