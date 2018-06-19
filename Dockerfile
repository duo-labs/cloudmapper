FROM python:alpine AS cloudmapper

LABEL maintainer="https://github.com/ngerstle/"
LABEL Project="https://github.com/duo-labs/cloudmapper"

# Required parameters: ACCOUNT, AWS_DEFAULT_REGION, AWS_REGION
# Running with aws-vault: $ aws-vault --debug exec <my_role> --server

EXPOSE 8000
WORKDIR /opt/cloudmapper
ENV ACCOUNT=$ACCOUNT
ENV AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
ENV AWS_REGION=$AWS_REGION

RUN apk --no-cache --virtual build-dependencies add \
autoconf \
automake \
libtool \
python-dev \
jq \
g++ \
make \
freetype-dev

# clone the repo && Install pre-reqs for pyjq
COPY . /opt/cloudmapper

RUN pip install pipenv && pipenv --two && PIP_NO_BUILD_ISOLATION=false pipenv install
RUN chmod +x entrypoint.sh && touch config.json


CMD ["sh","entrypoint.sh"]

