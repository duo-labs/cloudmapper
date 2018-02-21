FROM debian:9-slim 

RUN apt-get update && apt-get install -y autoconf automake libtool git gcc gawk jq python-dev python-pip awscli 
RUN pip install pipenv

WORKDIR /opt/cloudmapper
COPY . /opt/cloudmapper
RUN pipenv --two && pipenv install
RUN chmod +x entrypoint.sh

CMD ["sh","entrypoint.sh"]
