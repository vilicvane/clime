#!/usr/bin/env node

import * as Path from 'path';
import { CLI, Shim } from '../../../../';

let cli = new CLI('single-level-2', {
  label: 'Interesting Commands',
  path: Path.join(__dirname, 'commands'),
});

let shim = new Shim(cli);
shim.execute(process.argv);
