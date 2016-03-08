import Promise, { Resolvable } from 'thenfail';

import {
    Context
} from './command';

export type PrintableOutputLevel = 'log' | 'info' | 'warn' | 'error';

export interface Printable {
    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void;
}

export function isPrintable(object: any): object is Printable {
    return !!object && typeof object.print === 'function';
}

export interface StringCastable<T> extends Clime.Constructor<T> {
    cast(source: string, context: Context): T;
}

export function isStringCastable<T>(constructor: Clime.Constructor<T>): constructor is StringCastable<T>  {
    return !!(<any>constructor).cast && typeof (<any>constructor).cast === 'function';
}
