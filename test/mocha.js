'use strict';

require('source-map-support/register');

const Chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

Chai.should();
Chai.use(chaiAsPromised);
