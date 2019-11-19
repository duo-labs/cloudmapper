export all
SHELL := /usr/bin/env bash

define LINE
===================================================
endef


setup:
	pip install pipenv
	pipenv install --dev --skip-lock
test:
	pipenv run -- bash tests/scripts/unit_tests.sh

build:
	docker-compose build cloudmapper

run:build cloudmapper

cloudmapper:build
	docker-compose up -d cloudmapper
	docker-compose logs cloudmapper
	@echo "Check Cloudmapper on http://localhost:8000"
	@echo $(LINE)

collect:cloudmapper
	docker-compose exec cloudmapper pipenv run python cloudmapper.py collect
	@echo "starting to collect data"
	@echo $(LINE)

prepare:cloudmapper
	docker-compose exec cloudmapper entrypoint.sh prepare
	@echo "preparing collected data"
	@echo $(LINE)

report:cloudmapper
	docker-compose exec cloudmapper entrypoint.sh everything
	@echo "producting a report for collected data"
	@echo $(LINE)

clean:
	docker-compose kill
	docker-compose down
	docker-compose rm -f
