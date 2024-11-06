FROM python:3.8-slim AS cloudmapper

LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

EXPOSE 8000
WORKDIR /opt/cloudmapper
ENV AWS_DEFAULT_REGION=us-east-1

RUN apt-get update -y
RUN apt-get install -y build-essential autoconf automake libtool python3-tk jq awscli
RUN apt-get install -y bash

# Upgrade pip to the latest version
RUN pip install --upgrade pip

COPY . /opt/cloudmapper

# Specify a compatible numpy version if necessary
RUN pip install -r requirements.txt

RUN bash
