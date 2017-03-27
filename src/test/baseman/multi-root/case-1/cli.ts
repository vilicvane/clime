#!/usr/bin/env node

import * as Path from 'path';
import { CLI, Shim } from '../../../..';

let cli = new CLI('multi-root', [
  Path.join(__dirname, 'commands'),
  Path.join(__dirname, 'extra-commands'),
]);

let shim = new Shim(cli);
shim.execute(process.argv);
