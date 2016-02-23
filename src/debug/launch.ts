import * as Path from 'path';

import {
    CLI
} from '../core';

let cli = new CLI('demo', Path.join(__dirname, 'commands'));

cli.parse(['node', 'launch.js', 'system']);
