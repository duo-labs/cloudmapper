#!/bin/sh

if [ "$accountname" != "demo" ] 
then
	./collect_data.sh --account $accountname
else
	cp config.json.demo config.json
fi
pipenv run python cloudmapper.py prepare --account $accountname
pipenv run python cloudmapper.py serve --public
