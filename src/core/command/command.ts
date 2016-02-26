import * as Path from 'path';
import memorize from 'memorize-decorator';

import {
    Printable
} from '../object';

import {
    ParamDefinition,
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
    /** Extra arguments. */
    args: string[];
    /** Commands sequence including entry and sub commands. */
    commands: string[];
}

export abstract class Command {
    /**
     * @returns A promise or normal value.
     */
    abstract execute(...args: any[]): any;

    @memorize()
    get help(): HelpInfo {
        let constructor = this.constructor as typeof Command;
        let dir = Path.dirname(constructor.path);
        return HelpInfo.build(dir, constructor);
    }

    static path: string;
    static sequence: string[];
    static brief: string;
    static description: string;

    static paramDefinitions: ParamDefinition<any>[];
    static optionDefinitions: OptionDefinition<any>[];

    static requiredParamsNumber: number;
}

export function command(options: CommandOptions = {}) {
    return (target: typeof Command) => {
        target.brief = options.brief;
        target.description = options.description;

        // Validate param definitions.
        let paramDefinitions = target.paramDefinitions || [];

        if (paramDefinitions.length) {
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
                        target.requiredParamsNumber++;
                    } else {
                        hasOptional = true;
                    }
                }
            }
        }

        // Prepare option defintions.
        let types = Reflect.getMetadata('design:paramtypes', target.prototype, 'execute') as Constructor<any>[];

        if (!types) {
            throw new Error(`No parameter type information found, please add \`@metadata\` decorator to method \`execute\` if no other decorator applied`);
        }

        let candidate = types[paramDefinitions.length];

        if (candidate && candidate.prototype instanceof Options) {
            target.optionDefinitions = (candidate as typeof Options).definitions;
        }
    };
}

export const metadata: MethodDecorator = () => { };
