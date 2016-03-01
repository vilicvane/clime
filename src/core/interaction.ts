import Promise from 'thenfail';

export interface Selection<T> {
    text: string;
    value: T;
}

export type SelectionType<T> = Selection<T> | T;

export interface InteractionProvider {
    prompt(message?: string, defaultValue?: string): Promise<string>;
    confirm(message?: string, defaultValue?: boolean): Promise<boolean>;
    select<T>(selections: SelectionType<T>[], defaultValue: T): Promise<T>;
}
