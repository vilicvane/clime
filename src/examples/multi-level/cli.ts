import 'source-map-support/register';

import * as Path from 'path';
import { CLI, Shim } from '../..';

let cli = new CLI('clime', Path.join(__dirname, 'commands'));

let shim = new Shim(cli);
shim.execute(process.argv);
