import * as Path from 'path';

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

export interface ContextOptions {
    cwd: string;
    /** Commands sequence including entry and sub commands. */
    commands: string[];
    stdout?: NodeJS.WritableStream;
    stderr?: NodeJS.WritableStream;
}

export class Context {
    cwd: string;
    commands: string[];
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;

    constructor({
        cwd,
        commands,
        stdout,
        stderr
    }: ContextOptions) {
        this.cwd = cwd;
        this.commands = commands;
        this.stdout = stdout || process.stdout;
        this.stderr = stderr || process.stderr;
    }
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
        return HelpInfo.build(this);
    }

    static path: string;
    static sequence: string[];
    static brief: string;
    static description: string;

    static paramDefinitions: ParamDefinition<any>[];
    static paramsDefinition: ParamsDefinition<any>;
    static optionsConstructor: Clime.Constructor<Clime.HashTable<any>>;
    static optionDefinitions: OptionDefinition<any>[];
    static contextConstructor: typeof Context;

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

        let optionsConstructorCandidateIndex = paramDefinitions.length + (target.paramsDefinition ? 1 : 0);
        let optionsConstructorCandidate = types[optionsConstructorCandidateIndex];

        let contextConstructorCandidateIndex: number;

        if (optionsConstructorCandidate && optionsConstructorCandidate.prototype instanceof Options) {
            target.optionsConstructor = optionsConstructorCandidate;
            target.optionDefinitions = (optionsConstructorCandidate as typeof Options).definitions;

            contextConstructorCandidateIndex = optionsConstructorCandidateIndex + 1;
        } else {
            contextConstructorCandidateIndex = optionsConstructorCandidateIndex;
        }

        let contextConstructorCandidate = types[contextConstructorCandidateIndex];

        if (
            contextConstructorCandidate && (
                contextConstructorCandidate === Context ||
                contextConstructorCandidate.prototype instanceof Context
            )
        ) {
            target.contextConstructor = contextConstructorCandidate;
        }
    };
}

export const metadata: MethodDecorator = () => { };
