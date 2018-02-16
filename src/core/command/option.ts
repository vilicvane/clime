import * as assert from 'assert';

import hyphenate from 'hyphenate';

import {CastableType} from '..';

import {GeneralValidator} from './command';

/**
 * Options for command options.
 */
export interface OptionOptions<T> {
  /**
   * Option name shown on usage, defaults to hyphenated name of correspondent
   * property.
   */
  name?: string;
  /** A single character as the shorthand of the option. */
  flag?: string;
  /** The placeholder shown on usage as `--option <placeholder>`. */
  placeholder?: string;
  /** Parameter type, defaults to type of emitted "design:type" metadata. */
  type?: CastableType<T>;
  /** Indicates whether this option is required, defaults to `false`. */
  required?: boolean;
  /**
   * The option validator, could be either a regular expression or an object
   * that matches `Validator` interface.
   */
  validator?: GeneralValidator<T>;
  /** The option validators. */
  validators?: GeneralValidator<T>[];
  /** Indicates whether this is a switch. */
  toggle?: boolean;
  /** Default value for this option. */
  default?: T | string;
  /** Description shown on usage. */
  description?: string;
}

/** @internal */
export interface OptionDefinition<T> {
  name: string;
  key: string;
  flag: string | undefined;
  placeholder: string | undefined;
  toggle: boolean;
  type: CastableType<T>;
  required: boolean;
  validators: GeneralValidator<T>[];
  default: T | string | undefined;
  description: string | undefined;
}

/**
 * The abstract `Options` class to be extended.
 */
export abstract class Options {
  /**
   * A type mark for @option() decorator.
   * @internal
   */
  // tslint:disable-next-line:variable-name
  _options_mark: void;

  /** @internal */
  static definitions: OptionDefinition<any>[];
}

/**
 * The `option()` decorator that decorates concrete class of `Options`.
 */
export function option<T>({
  name: optionName,
  flag,
  placeholder,
  toggle,
  type,
  required,
  validator,
  validators,
  default: defaultValue,
  description,
}: OptionOptions<T> = {}) {
  assert(
    !flag || /^[a-z]$/i.test(flag),
    'The option flag is expected to be a letter',
  );

  return (target: Options, name: string) => {
    let constructor = target.constructor as typeof Options;
    let definitions = constructor.definitions;

    if (definitions) {
      definitions = constructor.definitions;
    } else {
      definitions = constructor.definitions = [];
    }

    type =
      type ||
      (Reflect.getMetadata('design:type', target, name) as Clime.Constructor<
        T
      >);

    optionName = optionName || hyphenate(name, {lowerCase: true});

    if (!validators) {
      validators = validator ? [validator] : [];
    }

    definitions.push({
      name: optionName,
      key: name,
      flag,
      placeholder,
      toggle: !!toggle,
      type,
      required: !!required,
      validators,
      default: defaultValue,
      description,
    });
  };
}
