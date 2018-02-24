FROM python:alpine AS cloudmapper

LABEL maintainer="https://github.com/fernandomiguel/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

# Build with:   $ docker build --tag cloudmapper .
# Run with:     $ docker run --rm -it -e ACCOUNT=<my_account> -v $PWD/config.json:/cloudmapper/config.json -e AWS_DEFAULT_REGION -e AWS_REGION -p80:8000 --name cloudmapper cloudmapper

EXPOSE 8000
WORKDIR /cloudmapper
ENV ACCOUNT=$ACCOUNT
ENV AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
ENV AWS_REGION=$AWS_REGION

CMD python cloudmapper.py gather --account-name $ACCOUNT && \
    python cloudmapper.py prepare --account-name $ACCOUNT &&\
    python cloudmapper.py serve

RUN apk --no-cache --virtual build-dependencies add \
    git \
    autoconf \
    automake \
    libtool \
    python-dev \
    jq \
    g++ \
    make

# clone the repo && Install pre-reqs for pyjq
RUN git clone https://github.com/duo-labs/cloudmapper.git /cloudmapper &&\
    touch config.json &&\
    pip install -r requirements.txt
