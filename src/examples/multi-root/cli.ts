// tslint:disable:no-implicit-dependencies

import 'source-map-support/register';

import * as Path from 'path';
import {CLI, Shim} from '../..';

let cli = new CLI('clime', [
  Path.join(__dirname, 'commands'),
  {
    label: 'Extended subcommands',
    path: 'extra',
  },
]);

let shim = new Shim(cli);
// tslint:disable-next-line:no-floating-promises
shim.execute(process.argv);
