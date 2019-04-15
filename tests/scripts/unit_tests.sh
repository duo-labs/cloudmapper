#! /bin/bash
if [ -f .coverage ]; then
  rm .coverage
fi

nosetests tests/unit \
--with-coverage \
--cover-package=commands \
--cover-package=shared \
--cover-min-percentage=20 \
--cover-html \
--cover-html-dir=htmlcov