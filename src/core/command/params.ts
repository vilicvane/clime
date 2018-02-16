import * as assert from 'assert';

import hyphenate from 'hyphenate';

import {CastableType} from '..';

import {Command, GeneralValidator} from './command';

import {Reflection} from '../../internal-util';

/**
 * Options for variadic command parameters.
 */
export interface ParamsOptions<T> {
  /**
   * Variadic parameters name shown on usage, defaults to the name of
   * correspondent function parameter.
   */
  name?: string;
  /** Type of every element in variadic parameters. */
  type: CastableType<any>;
  /**
   * Indicates whether at least one element is required, defaults to `false`.
   */
  required?: boolean;
  /**
   * The variadic parameters validator, could be either a regular expression
   * or an object that matches `Validator` interface.
   */
  validator?: GeneralValidator<T>;
  /** The variadic parameters validators. */
  validators?: GeneralValidator<T>[];
  /** Description shown on usage. */
  description?: string;
}

/** @internal */
export interface ParamsDefinition<T> {
  name: string;
  index: number;
  type: CastableType<any>;
  required: boolean;
  validators: GeneralValidator<T>[];
  description: string | undefined;
}

/**
 * The `params()` decorator that decorates one array parameter of method
 * `execute` of a concrete `Command` class.
 */
export function params<T>({
  name: paramName,
  type,
  required,
  validator,
  validators,
  description,
}: ParamsOptions<T>) {
  return (target: Command, name: 'execute', index: number) => {
    assert.equal(name, 'execute');

    let constructor = target.constructor as typeof Command;

    if (constructor.paramsDefinition) {
      throw new Error('Can only define one `params` parameter');
    }

    paramName =
      paramName ||
      // tslint:disable-next-line:no-unbound-method
      hyphenate(Reflection.getFunctionParameterName(target.execute, index), {
        lowerCase: true,
      });

    if (!validators) {
      validators = validator ? [validator] : [];
    }

    constructor.paramsDefinition = {
      name: paramName,
      index,
      type,
      required: !!required,
      validators,
      description,
    };
  };
}
