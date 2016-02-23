import Promise, { Resolvable } from 'thenfail';

export type PrintableOutputLevel = 'log' | 'info' | 'warn' | 'error';

export interface Printable {
    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void;
}

export function isPrintable(object: any): object is Printable {
    return !!object && typeof object === 'function';
}
