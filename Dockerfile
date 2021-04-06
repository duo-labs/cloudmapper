FROM python:3.7-slim as cloudmapper

LABEL Project="https://github.com/Zoomdata/cloudmapper"

EXPOSE 8000
WORKDIR /opt/cloudmapper

RUN apt-get update -y \
 && apt-get install -y \
    bash \
    build-essential \
    autoconf \
    automake \
    libtool \
    python3.7-dev \
    python3-tk \
    jq \
 && apt-get auto-remove -y \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . /opt/cloudmapper

VOLUME /opt/cloudmapper/account-data
VOLUME /opt/cloudmapper/web/account-data
CMD [ "/opt/cloudmapper/docker-entrypoint.sh" ]