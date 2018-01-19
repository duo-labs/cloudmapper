#! /bin/bash
echo 'Starting pylint script'
find . -name '*.py' -not -path './docs/source/*' -not -path './venv/*' -exec pylint '{}' +
