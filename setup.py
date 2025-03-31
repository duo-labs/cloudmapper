#from setuptools import setup, find_packages
from setuptools import setup, find_packages

setup(
    name="cloudmapper",
    version="2.10.0",
    packages=find_packages(),
    install_requires=[
        'boto3',
        'botocore',
        'netaddr',
        'pyjq',
        'python-dateutil',
        'pyyaml',
        'jinja2',
        'parliament',
        'matplotlib',
        'pandas',
        'seaborn',
        'policyuniverse',
        'requests',
        's3transfer',
        'toml',
        'urllib3',
    ],
    scripts=['cloudmapper.py'],
#    entry_points={
#        'console_scripts': [
#            'cloudmapper = cloudmapper:main',
#        ],
#    },
)
