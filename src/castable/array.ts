import * as v from 'villa';

import {
  CastableType,
  CastingContext,
  GeneralValidator,
  StringCastable,
  buildCastingContext,
  cast,
} from '..';

export interface ArrayCastingOptions<T> {
  /** Separator to split the input string, defaults to ",". */
  separator?: string | RegExp;
  /** Whether to trim split strings before casting, defaults to `true`. */
  trim?: boolean;
  /** Whether to keep empty strings after split, defaults to `false`. */
  empty?: boolean;
  validator?: GeneralValidator<T>;
  validators?: GeneralValidator<T>[];
}

export function array<T>(
  type: CastableType<any>,
  {
    separator = ',',
    trim = true,
    empty = false,
    validator,
    validators,
  }: ArrayCastingOptions<T> = {},
): StringCastable<T[]> {
  return {
    async cast(str: string, context: CastingContext<T[]>): Promise<T[]> {
      let parts = str.split(separator as any);

      if (trim) {
        parts = parts.map(part => part.trim());
      }

      if (!empty) {
        parts = parts.filter(part => !!part);
      }

      if (!validators) {
        validators = validator ? [validator] : [];
      }

      let castingContext = buildCastingContext(context, {
        name: `element of ${context.name}`,
        validators,
        default: context.default,
      });

      return v.map(parts, part => cast(part, type, castingContext));
    },
  };
}
