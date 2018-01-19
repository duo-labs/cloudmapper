#! /bin/bash
if [ -f .coverage ]; then
  rm .coverage
fi

nosetests tests/unit \
--with-coverage \
--cover-package=cloudmapper \
--cover-min-percentage=85 \
--cover-html \
--cover-html-dir=htmlcov