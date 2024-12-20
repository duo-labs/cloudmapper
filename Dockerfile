FROM python:3.9-slim as cloudmapper

LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

EXPOSE 8000
WORKDIR /opt/cloudmapper
ENV AWS_DEFAULT_REGION=us-east-1 

RUN apt-get update -y

RUN apt-get install -y \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    autoconf \
    automake \
    libtool \
    python3-tk \
    jq \
    bash \
    awscli

COPY . /opt/cloudmapper
RUN pip install -r requirements.txt

RUN bash
