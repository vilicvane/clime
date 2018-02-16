#!/usr/bin/env node

import * as Path from 'path';
import {CLI, Shim} from '../../../..';

let cli = new CLI('multi-root', [
  Path.join(__dirname, 'commands'),
  {
    label: 'Extra Subcommands',
    path: Path.join(__dirname, 'extra-commands'),
  },
  {
    label: 'Extra Subcommands',
    path: Path.join(__dirname, 'extra-extra-commands'),
  },
]);

let shim = new Shim(cli);
// tslint:disable-next-line:no-floating-promises
shim.execute(process.argv);
