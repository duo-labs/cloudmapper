init:
    pip install pipenv
    pipenv install --dev --skip-lock

test:
    pipenv run nosetests tests/unit \
    --with-coverage \
    --cover-package=commands \
    --cover-package=shared \
    --cover-min-percentage=70 \
    --cover-html \
    --cover-html-dir=htmlcov