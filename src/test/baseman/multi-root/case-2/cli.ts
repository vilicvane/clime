#!/usr/bin/env node

import * as Path from 'path';
import { CLI, Shim } from '../../../..';

let cli = new CLI('multi-root-2', [
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
shim.execute(process.argv);
