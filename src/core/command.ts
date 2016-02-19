import { Resolvable } from 'thenfail';

import {
    memorize
} from '../utils';

export interface CommandOption<T> {
    type?: Function;
    description?: string;
    required?: boolean;
    default?: T;
}

export interface OptionOptions<T> extends CommandOption<T> {
    toggle?: boolean;
    flag?: string;
}

export interface OptionDefinition {
    name: string;
    flag: string;
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
            name,
            type,
            flag: options.flag,
            toggle: options.toggle,
            default: options.default,
            required: options.required,
            description: options.description
        });
    };
}

export interface ToggleOptions {
    flag?: string;
    description?: string;
}

export function toggle(options: ToggleOptions = {}): PropertyDecorator {
    return option<boolean>({
        toggle: true,
        flag: options.flag,
        description: options.description
    });
}

export interface ParamDefinition {
    // name: string;
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
            Reflect.getMetadata('design:paramtypes', target, name)[index] as Function;

        definitions[index] = {
            type,
            required: options.required,
            default: options.default,
            description: options.description
        };
    };
}

export abstract class Command {
    paramDefinitions: ParamDefinition[];
    requiredParamsNumber: number;

    optionDefinitions: OptionDefinition[];

    constructor(filename: string, cwd?: string) { }

    private static validateParamDefinitions(): void {
        let prototype = this.prototype;

        let paramDefinitions = prototype.paramDefinitions;
        let requiredParamsNumber = 0;
        let hasOptional = false;

        for (let i = 0; i < paramDefinitions.length; i++) {
            let definition = paramDefinitions[i];

            if (!definition) {
                throw new Error(`Expecting parameter definition at position ${i}`);
            }

            if (hasOptional) {
                if (definition.required) {
                    throw new Error('Required parameter can not follow optional ones');
                }
            } else {
                if (definition.required) {
                    requiredParamsNumber++;
                } else {
                    hasOptional = true;
                }
            }
        }

        prototype.requiredParamsNumber = requiredParamsNumber;
    }

    private static prepareOptionDefinitions(): void {
        let prototype = this.prototype;

        if (prototype.optionDefinitions) {
            return;
        }

        let types = Reflect.getMetadata('design:paramtypes', prototype, 'execute') as Function[];
        let schema = types[prototype.paramDefinitions.length].prototype as OptionsSchema;

        prototype.optionDefinitions = schema ? schema._definitions : [];
    }

    abstract execute(...args: any[]): Resolvable<void>;

    @memorize()
    static initialize(): void {
        this.validateParamDefinitions();
        this.prepareOptionDefinitions();
    }
}

export interface CommandConstructor {
    new(filename: string, cwd?: string): Command;
    initialize(): void;
}

export interface Context {
    cwd: string;
    args: string[];
}
