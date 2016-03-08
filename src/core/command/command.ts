import * as Path from 'path';
import memorize from 'memorize-decorator';

import {
    Printable
} from '../object';

import {
    ParamDefinition,
    ParamsDefinition,
    OptionDefinition,
    Options,
    HelpInfo
} from './';

export interface CommandOptions {
    brief?: string;
    description?: string;
}

export interface Context {
    cwd: string;
    /** Commands sequence including entry and sub commands. */
    commands: string[];
}

export interface Validator<T> {
    validate(value: T, name: string): void;
}

export type GeneralValidator<T> = Validator<T> | RegExp;

export abstract class Command {
    /**
     * @returns A promise or normal value.
     */
    abstract execute(...args: any[]): any;

    static getHelp(): HelpInfo {
        let dir = Path.dirname(this.path);
        return HelpInfo.build(dir, this);
    }

    static path: string;
    static sequence: string[];
    static brief: string;
    static description: string;

    static paramDefinitions: ParamDefinition<any>[];
    static paramsDefinition: ParamsDefinition<any>;
    static optionConstructor: Clime.Constructor<Clime.HashTable<any>>;
    static optionDefinitions: OptionDefinition<any>[];

    static requiredParamsNumber = 0;
}

export function command(options: CommandOptions = {}) {
    return (target: typeof Command) => {
        target.brief = options.brief;
        target.description = options.description;

        // Validate param definitions.
        let paramDefinitions = target.paramDefinitions || [];
        let paramsDefinition = target.paramsDefinition;
        let variadicParamsRequired = paramsDefinition && paramsDefinition.required;

        if (paramDefinitions.length) {
            let hasOptional = false;

            for (let i = 0; i < paramDefinitions.length; i++) {
                let definition = paramDefinitions[i];

                if (!definition) {
                    throw new Error(`Expecting parameter definition at position ${i}`);
                }

                if (hasOptional) {
                    if (definition.required) {
                        throw new Error('Required parameter cannot follow optional ones');
                    }
                } else {
                    if (definition.required) {
                        target.requiredParamsNumber++;
                    } else {
                        if (variadicParamsRequired) {
                            throw new Error('Parameter cannot be optional if variadic parameters are required');
                        }

                        hasOptional = true;
                    }
                }
            }
        }

        if (paramsDefinition && paramsDefinition.index !== paramDefinitions.length) {
            throw new Error('Expecting variadic parameters to be adjacent to other parameters');
        }

        // Prepare option defintions.
        let types = Reflect.getMetadata('design:paramtypes', target.prototype, 'execute') as Clime.Constructor<any>[];

        if (!types) {
            throw new Error(`No parameter type information found, please add \`@metadata\` decorator to method \`execute\` if no other decorator applied`);
        }

        let candidateIndex = paramDefinitions.length + (target.paramsDefinition ? 1 : 0);
        let candidate = types[candidateIndex];

        if (candidate && candidate.prototype instanceof Options) {
            target.optionConstructor = candidate;
            target.optionDefinitions = (candidate as typeof Options).definitions;
        }
    };
}

export const metadata: MethodDecorator = () => { };
