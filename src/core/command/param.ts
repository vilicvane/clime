import * as assert from 'assert';

import {
    Command,
    GeneralValidator
} from './command';

import {
    Reflection
} from '../../utils';

export interface ParamOptions<T> {
    name?: string;
    type?: Clime.Constructor<T>;
    description?: string;
    required?: boolean;
    validator?: GeneralValidator<T>;
    validators?: GeneralValidator<T>[];
    default?: T;
}

export interface ParamDefinition<T> {
    name: string;
    index: number;
    type: Clime.Constructor<T>;
    description: string;
    required: boolean;
    validators: GeneralValidator<T>[];
    default: T;
}

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
    if (!validators) {
        validators = validator ? [validator] : [];
    }

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

        definitions[index] = {
            name: paramName,
            index,
            type,
            required,
            validators,
            default: defaultValue,
            description
        };
    };
}
