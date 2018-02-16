import {ExpectedError, ValidatorFunction} from '../core';

export function range(from: number, to: number): ValidatorFunction<number> {
  return (value, {name, source}) => {
    if (value < from || value >= to) {
      throw new ExpectedError(
        `Value (${source}) of "${name}" is not within the range of [${from}, ${to})`,
      );
    }
  };
}

export const integer: ValidatorFunction<number> = (value, {name, source}) => {
  if (value % 1 !== 0) {
    throw new ExpectedError(`Value (${source}) of "${name}" is not an integer`);
  }
};
