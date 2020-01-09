#! /bin/bash
echo 'Starting pylint script'
find . -name '*.py' -not -path './docs/source/*' -not -path './venv/*' -exec pylint '{}' +

# Automaticaly fix issues with:
# find . -name '*.py' -not -path './docs/source/*' -not -path './venv/*'  -exec autopep8 --in-place --max-line-length 160 '{}' +