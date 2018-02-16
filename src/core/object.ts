import {Resolvable} from 'villa';

import {Context, GeneralValidator} from './command';

import {ExpectedError} from './error';

export interface Printable {
  print(
    stdout: NodeJS.WritableStream,
    stderr: NodeJS.WritableStream,
  ): Promise<void> | void;
}

export function isPrintable(object: any): object is Printable {
  return !!object && typeof object.print === 'function';
}

export interface StringCastable<T> {
  cast(source: string, context: CastingContext<T>): Resolvable<T>;
}

export function isStringCastable<T>(
  object: object,
): object is StringCastable<T> {
  return (
    !!object &&
    !!(object as any).cast &&
    typeof (object as any).cast === 'function'
  );
}

export type CastableType<T> = Clime.Constructor<T> | StringCastable<T>;

export async function cast<T>(
  source: string,
  type: CastableType<T>,
  context: CastingContext<T>,
): Promise<T> {
  let value: any;

  let {name, validators, default: usingDefault} = context;

  switch (type as CastableType<any>) {
    case String:
      value = source;
      break;
    case Number:
      value = Number(source);

      if (isNaN(value)) {
        throw new ExpectedError(`Value "${source}" cannot be casted to number`);
      }

      break;
    case Boolean:
      if (/^(?:f|false)$/i.test(source)) {
        value = false;
      } else {
        let n = Number(source);
        value = isNaN(n) ? true : Boolean(n);
      }

      break;
    default:
      if (!isStringCastable(type)) {
        throw new Error(`Type \`${type.name ||
          type}\` cannot be casted from a string, \
see \`StringCastable\` interface for more information`);
      }

      let castingContext = buildCastingContext(context, {
        name,
        validators,
        default: usingDefault,
        upper: context,
      });

      value = await type.cast(source, castingContext);

      break;
  }

  for (let validator of validators) {
    if (validator instanceof RegExp) {
      if (!validator.test(source)) {
        throw new ExpectedError(`Invalid value for "${name}"`);
      }
    } else if (typeof validator === 'function') {
      validator(value, {name, source});
    } else {
      validator.validate(value, {name, source});
    }
  }

  return value;
}

export interface CastingContextExtension<T> {
  name: string;
  validators: GeneralValidator<T>[];
  default: boolean;
  upper?: CastingContext<any>;
}

export interface CastingContext<T>
  extends CastingContextExtension<T>,
    Context {}

export function buildCastingContext<T>(
  context: Context,
  extension: CastingContextExtension<T>,
): CastingContext<T> {
  return Object.assign(Object.create(context), extension);
}
