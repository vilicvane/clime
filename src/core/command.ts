import { Resolvable } from 'thenfail';

export interface CommandOption<T> {
    type?: Function;
    description?: string;
    required?: boolean;
    default?: T;
}

export interface OptionOptions<T> extends CommandOption<T> {
    toggle?: boolean;
}

export interface OptionDefinition {
    type: Function;
    description: string;
    required: boolean;
    toggle: boolean;
    default: any;
}

interface OptionsSchema {
    _definitions: OptionDefinition[];
}

export function option<T>(options: OptionOptions<T> = {}): PropertyDecorator {
    return (target: Object, name: string) => {
        let definitions: OptionDefinition[];

        if ((target as OptionsSchema)._definitions) {
            definitions = (target as OptionsSchema)._definitions;
        } else {
            definitions = (target as OptionsSchema)._definitions = [];
        }

        let type = options.type || Reflect.getMetadata('design:type', target, name);

        definitions.push({
            type,
            toggle: options.toggle,
            default: options.default,
            required: options.required,
            description: options.description
        });
    };
}

export interface ToggleOptions {
    default?: boolean;
    description?: string;
}

export function toggle(options: ToggleOptions = {}): PropertyDecorator {
    return option<boolean>({
        toggle: true,
        default: options.default,
        description: options.description
    });
}

// export function command(): ClassDecorator {
//     return (target: typeof Command) => {

//     };
// }

// export interface OptionsOptions {

// }

export interface ParamDefinition {
    type: Function;
    description: string;
    required: boolean;
    default: any;
}

export interface ParamOptions<T> extends CommandOption<T> { }

export function param<T>(options: ParamOptions<T> = {}): ParameterDecorator {
    return (target: Command, name: string, index: number) => {
        let definitions: ParamDefinition[];

        if (target.paramDefinitions) {
            definitions = target.paramDefinitions;
        } else {
            definitions = target.paramDefinitions = [];
        }

        let type = options.type ||
            Reflect.getMetadata('design:paramtypes', target, name)[index];

        definitions[index] = {
            type,
            required: options.required,
            default: options.default,
            description: options.description
        };
    };
}

export abstract class Command {
    optionDefinitions: OptionDefinition[];
    paramDefinitions: ParamDefinition[];

    constructor(filename: string, cwd?: string) {

    }

    abstract execute(...args: any[]): Resolvable<void>;
}

export interface CommandConstructor {
    new(filename: string, cwd?: string): Command;
}
