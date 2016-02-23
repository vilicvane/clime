import { Resolvable } from 'thenfail';
import * as Chalk from 'chalk';

import {
    memorize,
    buildTableOutput
} from '../utils';

export function command(options?: CommandOptions): ClassDecorator {
    return (target: typeof Command) => {
        target.description = options.description;
    };
}

export interface CommandOptions {
    description?: string;
}

export interface OptionOptions<T> {
    type?: Function;
    toggle?: boolean;
    flag?: string;
    required?: boolean;
    default?: T;
    description?: string;
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
    name: string;
    type: Function;
    description: string;
    required: boolean;
    default: any;
}

export interface ParamOptions<T> {
    type?: Function;
    description?: string;
    required?: boolean;
    default?: T;
}

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

        // TODO: Avoid unnecessary parsing.
        let groups = ((<any>target)[name] as Function)
            .toString()
            .match(/^[^{=]*\(([\w\d$-,\s]*)\)/);

        let paramNames = groups && groups[1].trim().split(/\s*,\s*/);
        let paramName: string;

        if (paramNames && paramNames.length > index) {
            paramName = paramNames[index];
        } else {
            paramName = 'param' + index;
        }

        definitions[index] = {
            name: paramName,
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

    static description: string;

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
        let candidate = <any>types[prototype.paramDefinitions.length];

        if (candidate && candidate !== Object) {
            prototype.optionDefinitions = (candidate.prototype as OptionsSchema)._definitions;
        }
    }

    abstract execute(...args: any[]): Resolvable<void>;

    help(commandSequence: string[]): void {
        let constructor = this.constructor as typeof Command;
        constructor.initialize();

        console.error();

        if (constructor.description) {
            console.error('  ' + constructor.description);
            console.error();
        }

        let paramDefinitions = this.paramDefinitions;

        let parameterRows: string[][] = [];

        let usageLine = Chalk.bold(commandSequence.join(' ')) + ' ' + paramDefinitions
            .map(definition => {
                let {
                    name,
                    required,
                    description,
                    default: defaultValue
                } = definition;

                if (description) {
                    parameterRows.push([
                        Chalk.bold(name),
                        Chalk.dim(description)
                    ]);
                }

                return required ?
                    `<${name}>` :
                    `[${name}${defaultValue !== undefined ? '=' + defaultValue : ''}]`;
            })
            .join(' ');

        let optionDefinitions = this.optionDefinitions || [];

        let requiredOptionDefinitions = optionDefinitions.filter(definition => definition.required);

        usageLine += ' ' + requiredOptionDefinitions
            .map(definition => {
                return `--${definition.name} <${definition.name}>`;
            })
            .join(' ');

        if (optionDefinitions.length > requiredOptionDefinitions.length) {
            usageLine += ' [...options]';
        }

        console.error(Chalk.green('  USAGE'));
        console.error();
        console.error('    ' + usageLine);
        console.error();
        console.error(buildTableOutput(parameterRows, {
            indent: 4,
            spaces: ' - '
        }));
        console.error();

        if (optionDefinitions.length) {
            let optionRows = optionDefinitions
                .map(definition => {
                    let {
                        name,
                        flag,
                        toggle: isToggle,
                        description
                    } = definition;

                    let triggerStr = flag ? `-${flag}, ` : '';

                    triggerStr += `--${name}`;

                    if (!isToggle) {
                        triggerStr += ` <${name}>`;
                    }

                    return [
                        Chalk.bold(triggerStr),
                        description && Chalk.dim(description)
                    ];
                });

            console.error(Chalk.green('  OPTIONS'));
            console.error();
            console.error(buildTableOutput(optionRows, {
                indent: 4,
                spaces: Chalk.dim(' - ')
            }));
            console.error();
        }
    }

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
    /** Extra arguments. */
    args: string[];
    /** Commands sequence including entry and sub commands. */
    commands: string[];
}
