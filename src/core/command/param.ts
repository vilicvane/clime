import * as assert from 'assert';

import hyphenate from 'hyphenate';

import {Command, GeneralValidator} from './command';

import {CastableType} from '..';

import {Reflection} from '../../internal-util';

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
  type?: CastableType<any>;
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
  type: CastableType<any>;
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
export function param<T>({
  name: paramName,
  type,
  required,
  validator,
  validators,
  default: defaultValue,
  description,
}: ParamOptions<T> = {}) {
  return (target: Command, name: 'execute', index: number) => {
    assert.equal(name, 'execute');

    let constructor = target.constructor as typeof Command;

    let definitions = constructor.paramDefinitions;

    if (constructor.paramDefinitions) {
      definitions = constructor.paramDefinitions;
    } else {
      definitions = constructor.paramDefinitions = [];
    }

    type =
      type ||
      (Reflect.getMetadata('design:paramtypes', target, 'execute')[
        index
      ] as CastableType<T>);

    paramName =
      paramName ||
      // tslint:disable-next-line:no-unbound-method
      hyphenate(Reflection.getFunctionParameterName(target.execute, index), {
        lowerCase: true,
      });

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
      description,
    };
  };
}
