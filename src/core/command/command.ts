import * as Path from 'path';

import { Resolvable } from 'thenfail';

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

/**
 * Options for command.
 */
export interface CommandOptions {
    /** Shown on usage as subcommand description. */
    brief?: string;
    /** Shown on usage as the description of current command. */
    description?: string;
}

/**
 * Options for context.
 */
export interface ContextOptions {
    /** Current working directory. */
    cwd: string;
    /** Commands sequence including entry and subcommands. */
    commands: string[];
}

/**
 * Command context.
 */
export class Context {
    /** Current working directory. */
    cwd: string;
    /** Commands sequence including entry and subcommands. */
    commands: string[];

    constructor({
        cwd,
        commands
    }: ContextOptions) {
        this.cwd = cwd;
        this.commands = commands;
    }
}

/**
 * Validator interface for parameters or options.
 */
export interface Validator<T> {
    /**
     * A method that validates a value.
     * It should throw an error (usually an instance of `ExpectedError`) if the
     * validation fails.
     * @param value - Value to be validated.
     * @param name - Name of the parameter or option, used for generating error
     * message.
     */
    validate(value: T, name: string): void;
}

export type GeneralValidator<T> = Validator<T> | RegExp;

/**
 * The abstract `Command` class to be extended.
 */
export abstract class Command {
    /**
     * @returns A promise or normal value.
     */
    abstract execute(...args: any[]): Resolvable<any>;

    /**
     * Get the help object of current command.
     */
    // Note: we are using method instead of getter here to avoid issue with
    // `__extends` helper emitted by TypeScript.
    static getHelp(): HelpInfo {
        return HelpInfo.build(this);
    }

    /** @internal */
    static decorated = false;
    /** @internal */
    static path: string;
    /** @internal */
    static sequence: string[];
    /** @internal */
    static brief: string;
    /** @internal */
    static description: string;

    /** @internal */
    static paramDefinitions: ParamDefinition<any>[];
    /** @internal */
    static paramsDefinition: ParamsDefinition<any>;
    /** @internal */
    static optionsConstructor: Clime.Constructor<Clime.HashTable<any>>;
    /** @internal */
    static optionDefinitions: OptionDefinition<any>[];
    /** @internal */
    static contextConstructor: typeof Context;
    /** @internal */
    static requiredParamsNumber = 0;
}

/**
 * The `command()` decorator that decorates concrete class of `Command`.
 */
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
            target.optionDefinitions = (<any>optionsConstructorCandidate as typeof Options).definitions;

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

        target.decorated = true;
    };
}

/**
 * The `metadata` decorator does nothing at runtime. It is only used to have
 * TypeScript emits type metadata for `execute` method that has no other
 * decorators.
 */
export const metadata: MethodDecorator = () => { };
