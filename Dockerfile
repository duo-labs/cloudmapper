FROM python:3.7.1

RUN apt-get update && apt-get install -y autoconf \ 
  automake \
  libtool \
  python3-dev \
  python3-tk \
  jq \
  awscli \
  nano \
  git \
  build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python3 get-pip.py && \
    pip3 install pipenv 

RUN git clone https://github.com/duo-labs/cloudmapper.git && \
    cd cloudmapper/ && \
    pipenv install --skip-lock --system --deploy --ignore-pipfile --dev

EXPOSE 8000
WORKDIR /cloudmapper

CMD pipenv shell
