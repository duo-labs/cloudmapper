#!/usr/bin/env node

// @ts-ignore: Cannot find declaration file
require('source-map-support/register');
const cdk = require('@aws-cdk/core');
const { CloudmapperauditorStack } = require('../lib/cloudmapperauditor-stack');

const app = new cdk.App();
new CloudmapperauditorStack(app, 'CloudmapperauditorStack');
