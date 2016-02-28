import 'source-map-support/register';

import * as Path from 'path';

import Promise from 'thenfail';

import {
    CLI,
    isPrintable
} from '../';

let cli = new CLI('demo', Path.join(__dirname, 'commands'));

Promise
    .then(() => cli.execute(process.argv))
    .then(result => {
        if (isPrintable(result)) {
            result.print(process.stdout, process.stderr);
        } else {
            console.log(result);
        }

        process.exit();
    }, reason => {
        if (isPrintable(reason)) {
            reason.print(process.stdout, process.stderr);
        } else if (reason instanceof Error) {
            console.error(reason.stack);
        } else {
            console.error(reason);
        }

        process.exit(1);
    });
