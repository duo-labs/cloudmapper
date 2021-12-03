FROM python:3.7-slim AS cloudmapper
LABEL maintainer="https://github.com/0xdabbad00/"
LABEL Project="https://github.com/duo-labs/cloudmapper"
EXPOSE 8000
RUN apt-get update && apt-get install --assume-yes \
	autoconf \
	build-essential \
	libtool \
	python3-tk \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /opt/cloudmapper
COPY requirements.txt .
RUN pip install --requirement requirements.txt
COPY . .
CMD ["bash"]