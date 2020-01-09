# Always prefer setuptools over distutils
from setuptools import setup, find_packages
from os import path
from cloudmapper import __version__

here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, "README.md"), encoding="utf-8") as f:
    long_description = f.read()

with open(path.join(here, "requirements", "base.txt"), encoding="utf-8") as f:
    requirements = f.read().splitlines()

with open(path.join(here, "requirements", "dev.txt"), encoding="utf-8") as f:
    dev_requirements = f.read().splitlines()


setup(
    name="cloudmapper",
    version=__version__,
    description=" CloudMapper helps you analyze your Amazon Web Services (AWS) environments.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/duo-labs/cloudmapper",
    author="Duo Labs",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: BSD",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    keywords="aws cytoscape diagram security",
    packages=find_packages(),
    python_requires=">=3.5",
    install_requires=requirements,
    extras_require={"dev": dev_requirements,},
    package_data={"cloudmapper": ["*.yaml", "templates/*"],},
    entry_points={"console_scripts": ["cloudmapper=cloudmapper.__main__:main",],},
)
