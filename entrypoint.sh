#!/usr/bin/env bash
log_err() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" 2>&1
}

# nice log message wrapper
log_date() {
    echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" 2>&1
}


mkdir -p data/aws

collect(){
  log_date "CLOUDMAPPER: starting to collect data about AWS account"
  pipenv run python cloudmapper.py collect
}

prepare(){
  log_date "CLOUDMAPPER: preparing data for webserver"
  pipenv run python cloudmapper.py prepare
}

report(){
  log_date "CLOUDMAPPER: producing report"
  pipenv run python cloudmapper.py report --accounts ${ACCOUNTS}
  mv -f /opt/cloudmapper/web/account-data/report.html /opt/cloudmapper/web/account-data/$(date +'%Y-%m-%d-')${ACCOUNTS}-report.html
}

iam_report(){
  pipenv run python cloudmapper.py iam_report --accounts ${ACCOUNTS}
  mv -f /opt/cloudmapper/web/account-data/iam_report.html /opt/cloudmapper/web/account-data/$(date +'%Y-%m-%d-')${ACCOUNTS}-iam_report.html
}

unused(){
  pipenv run python cloudmapper.py find_unused --accounts ${ACCOUNTS} > /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-unused-resources.json
}

prepare_map_service(){
  set -x
  pipenv run python cloudmapper.py prepare --account ${ACCOUNTS} --tags Environment=${ENV},Service=${SERVICE}
  set +x
}

public(){
  pipenv run python cloudmapper.py public --accounts ${ACCOUNTS} >> /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-public-resources.json
}

admins(){
  pipenv run python cloudmapper.py find_admins --accounts ${ACCOUNTS} > /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-admins.txt
}

audit(){
  pipenv run python cloudmapper.py audit --accounts ${ACCOUNTS} > /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-audit-report.txt
}

stats(){
  pipenv run python cloudmapper.py stats --accounts ${ACCOUNTS} > /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-stats-resources.json 
  mv -f /opt/cloudmapper/resource_stats.png /opt/cloudmapper/data/$(date +'%Y-%m-%d-')${ACCOUNTS}-stats-resources.png
}


amis(){
  cd data/aws
  aws ec2 describe-regions | jq -r '.Regions[].RegionName' | xargs -I{} mkdir {}
  aws ec2 describe-regions | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws --region {} ec2 describe-images --executable-users all > {}/ec2-describe-images.json'
  cd /opt/cloudmapper
  pipenv run python cloudmapper.py amis --accounts ${ACCOUNTS}
}

everything(){
  log_date "running everything"
  stats
  audit
  report
  admins
  unused
  public
  iam_report
}


webserver(){
  log_date "CLOUDMAPPER: starting webserver"
  pipenv run python cloudmapper.py webserver --public
}



if [[ $# -ne 1 ]]; then
  webserver
else 
  $@ $1
fi
