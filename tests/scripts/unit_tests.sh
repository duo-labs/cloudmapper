#! /bin/bash
if [ -f .coverage ]; then
  rm .coverage
fi

python -m nose2 --config unittest.cfg -v
