FROM python:3.7-slim as cloudmapper

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

EXPOSE 8000
WORKDIR /opt/cloudmapper
ENV AWS_DEFAULT_REGION=eu-central-1

RUN apt-get update -y
RUN apt-get install -y build-essential autoconf automake libtool python3.7-dev python3-tk jq awscli
RUN apt-get install -y bash

COPY . /opt/cloudmapper
RUN pip install -r requirements.txt

RUN python cloudmapper.py configure add-account --config-file config.json --name hn --id 255382753382
RUN python cloudmapper.py collect --account hn
RUN python cloudmapper.py report --account hn
RUN python cloudmapper.py prepare --account hn

#replace this with service start
RUN bash
