#!/bin/sh

if [ "$accountname" != "demo" ] 
then
  pipenv run python cloudmapper.py gather --account-name $ACCOUNT
else
	cp config.json.demo config.json
fi
pipenv run python cloudmapper.py prepare --account $accountname
pipenv run python cloudmapper.py serve --public

