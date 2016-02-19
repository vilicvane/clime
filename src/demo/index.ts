'use strict';

import 'source-map-support/register';

import * as Path from 'path';

import { CLI } from '../';

let cli = new CLI();

cli.parse(process.argv, Path.join(__dirname, 'commands'));
