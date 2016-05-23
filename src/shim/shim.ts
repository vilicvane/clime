import * as Util from 'util';

import * as Chalk from 'chalk';
import Promise from 'thenfail';

import {
    CLI,
    ExpectedError,
    isPrintable
} from '../core';

/**
 * A Clime command line interface shim for pure Node.js.
 */
export class Shim {
    constructor(
        public cli: CLI
    ) { }

    /**
     * Execute CLI with an array as `argv`.
     * @param argv - The `argv` array to execute, typically `process.argv`.
     * @param cwd - Current working directory.
     */
    execute(argv: string[], cwd?: string): void {
        this
            .cli
            .execute(argv.slice(2), cwd)
            .then(result => {
                if (isPrintable(result)) {
                    result.print(process.stdout, process.stderr);
                } else if (result !== undefined) {
                    console.log(result);
                }

                process.exit();
            }, (reason: Object) => {
                let exitCode = 1;

                if (isPrintable(reason)) {
                    reason.print(process.stdout, process.stderr);

                    if (reason instanceof ExpectedError) {
                        exitCode = (reason as ExpectedError).code;
                    }
                } else if (reason instanceof Error) {
                    console.error(Chalk.red(reason.stack));
                } else {
                    console.error(Chalk.red(Util.format(reason)));
                }

                process.exit(exitCode);
            });
    }
}
