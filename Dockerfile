FROM python:3.7-slim as cloudmapper

LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

EXPOSE 8000

ARG AWS_DEFAULT_REGION=us-east-1

RUN apt-get update -y
RUN apt-get install -y build-essential autoconf automake libtool python3.7-dev python3-tk jq awscli
RUN apt-get install -y bash

COPY requirements.txt .
RUN pip install -r requirements.txt
