#!/usr/bin/env node

import * as Path from 'path';
import { CLI, Shim } from '../../../..';

let cli = new CLI('invalid-usage', Path.join(__dirname, 'commands'));

let shim = new Shim(cli);
shim.execute(process.argv);
