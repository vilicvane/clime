export interface ParamDefinition<T> {
    name: string;
    type: Constructor<T>;
    description: string;
    required: boolean;
    default: T;
}

export interface OptionDefinition<T> {
    name: string;
    flag: string;
    type: Constructor<T>;
    description: string;
    required: boolean;
    default: T;
}

export interface ToggleDefinition {
    name: string;
    flag: string;
    type: Function;
    description: string;
}

export class BaseCommand {

}

export interface CommandConstructor extends Constructor<Command> {

}

export abstract class Command {
    dir: string;

    constructor() {

    }

    static description: string;
}

