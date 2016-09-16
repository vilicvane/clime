import * as assert from 'assert';

import {
    Command,
    GeneralValidator
} from './command';

import {
    Reflection
} from '../../utils';

/**
 * Options for command parameter.
 */
export interface ParamOptions<T> {
    /**
     * Parameter name shown on usage, defaults to the name of correspondent
     * function parameter.
     */
    name?: string;
    /** Parameter type, defaults to type of emitted "design:type" metadata. */
    type?: Clime.Constructor<T>;
    /** Indicates whether this parameter is required, defaults to `false`. */
    required?: boolean;
    /**
     * The parameter validator, could be either a regular expression or an
     * object that matches `Validator` interface.
     */
    validator?: GeneralValidator<T>;
    /** The parameter validators. */
    validators?: GeneralValidator<T>[];
    /** Default value for this parameter. */
    default?: T | string;
    /** Description shown on usage. */
    description?: string;
}

/** @internal */
export interface ParamDefinition<T> {
    name: string;
    index: number;
    type: Clime.Constructor<T>;
    description: string | undefined;
    required: boolean;
    validators: GeneralValidator<T>[];
    default: T | string | undefined;
}

/**
 * The `param()` decorator that decorates parameters of method `execute` on a
 * concrete `Command` class.
 * This decorator could only be applied to continuous parameters of which the
 * index starts from 0.
 */
export function param<T>(
    {
        name: paramName,
        type,
        required,
        validator,
        validators,
        default: defaultValue,
        description
    }: ParamOptions<T> = {}
) {
    // TODO: name: 'execute'
    return (target: Command, name: string, index: number) => {
        assert.equal(name, 'execute');

        let constructor = target.constructor as typeof Command;

        let definitions = constructor.paramDefinitions;

        if (constructor.paramDefinitions) {
            definitions = constructor.paramDefinitions;
        } else {
            definitions = constructor.paramDefinitions = [];
        }

        type = type ||
            Reflect.getMetadata('design:paramtypes', target, 'execute')[index] as Clime.Constructor<T>;

        paramName = paramName || Reflection.getFunctionParameterName(target.execute, index);

        if (!validators) {
            validators = validator ? [validator] : [];
        }

        definitions[index] = {
            name: paramName,
            index,
            type,
            required: !!required,
            validators,
            default: defaultValue,
            description
        };
    };
}
