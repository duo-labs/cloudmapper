FROM python:3.7-slim as cloudmapper

ENV TERM=xterm-256color
ENV DEBIAN_FRONTEND=noninteractive
LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

EXPOSE 8000
RUN mkdir -p /opt/cloudmapper
WORKDIR /opt/cloudmapper

COPY ./Pipfile /opt/cloudmapper/Pipfile
RUN apt-get update -yq && \
  apt-get install -y build-essential autoconf automake libtool python3.7-dev python3-tk jq awscli bash bash-completion iproute2 curl procps && \
  pip3 install pipenv pipfile pyjq six netaddr pyaml policyuniverse boto3 jinja2 && \
  pipenv install --skip-lock

COPY ./entrypoint.sh /usr/bin/entrypoint.sh
COPY . /opt/cloudmapper

ENTRYPOINT entrypoint.sh
