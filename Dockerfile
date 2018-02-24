FROM python:alpine AS cloudmapper

LABEL maintainer="https://github.com/fernandomiguel/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

# Build with:   $ docker build --tag cloudmapper .
# Run with:     $ docker run -it -p80:8000 --name cloudmapper cloudmapper

EXPOSE 8000
WORKDIR /cloudmapper

# ARG
# ENV key=value

RUN apk --no-cache --virtual build-dependencies add \
    git \
    autoconf \
    automake \
    libtool \
    python-dev \
    jq

# clone the repo
RUN git clone https://github.com/duo-labs/cloudmapper.git /cloudmapper

# Install pre-reqs for pyjq
RUN pip install -r requirements.txt