#!/bin/sh

if [ "$ACCOUNT" != "demo" ] 
then
  pipenv run python cloudmapper.py gather --account-name $ACCOUNT
else
	cp config.json.demo config.json
fi
pipenv run python cloudmapper.py prepare --account-name $ACCOUNT
pipenv run python cloudmapper.py webserver --public

