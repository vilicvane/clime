import * as Inquirer from 'inquirer';
import Promise from 'thenfail';

import {
    CLI,
    isPrintable
} from '../core';

// export type InteractionProvider = Interaction.InteractionProvider;
// export type SelectionType<T> = Interaction.SelectionType<T>;

// export const interfactionProvider: InteractionProvider = {
//     prompt(message, defaultValue) {
//         return new Promise<string>(resolve => {
//             Inquirer.prompt({
//                 name: 'value',
//                 message,
//                 default: defaultValue
//             }, answer => {
//                 resolve(answer['value'] as string);
//             });
//         });
//     },
//     confirm(message, defaultValue) {

//     },
//     select<T>(selections: SelectionType<T>[], defaultValue: T) {

//     }
// };

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
    }
}
