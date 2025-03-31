{ python, ... }:
[
  (python.withPackages (ps:
    with ps; [
      boto3
      botocore
      netaddr
      pyjq
      python-dateutil
      pyyaml
      jinja2
      parliament
      matplotlib
      pandas
      seaborn
      policyuniverse
      requests
      s3transfer
      toml
      urllib3
    ]))
]
