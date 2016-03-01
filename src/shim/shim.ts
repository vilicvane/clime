import * as Inquirer from 'inquirer';
import Promise from 'thenfail';

import {
    Interaction,
    XXX
} from '../core';

export type InteractionProvider = Interaction.InteractionProvider;
export type SelectionType<T> = Interaction.SelectionType<T>;

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
    constructor() {

    }
}

const enum ErrorCode {
    abc,
    def
}

const enum ErrorCode {
    ghi = 100,
    jkl
}

let x = XXX.e;

declare module '../core' {
    const enum XXX {
        d = 3,
        e,
        f
    }
}
