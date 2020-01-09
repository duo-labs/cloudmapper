#! /bin/bash
if [ -f .coverage ]; then
  rm .coverage
fi

if [ ! -d account-data/demo ]; then
  mkdir -p account-data
  cp -r cloudmapper/account-data/demo account-data/
fi

python -m nose cloudmapper/tests/unit \
--with-coverage \
--cover-package=cloudmapper \
--cover-min-percentage=60 \
--cover-html \
--cover-html-dir=htmlcov