import Promise from 'thenfail';

import {
    CLI,
    ExpectedError,
    isPrintable
} from '../core';

export class Shim {
    constructor(
        public cli: CLI
    ) { }

    execute(argv: string[], cwd?: string): void {
        this
            .cli
            .execute(argv, cwd)
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
                    console.error(reason.stack);
                } else {
                    console.error(reason);
                }

                process.exit(exitCode);
            });
    }
}
