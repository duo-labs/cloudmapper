setup:
	pip install pipenv
	pipenv install --dev --skip-lock
test:
	pipenv run -- bash tests/scripts/unit_tests.sh