import {
  ExpectedError,
  Validator,
} from '../core';

export class RangeValidator implements Validator<number> {
  constructor(
    /** value >= from. */
    public from: number,
    /** value < to. */
    public to: number,
  ) { }

  validate(value: number, name: string): void {
    if (value < this.from || value >= this.to) {
      throw new ExpectedError(`Value of \`${name}\` is not within the range of [${this.from}, ${this.to})`);
    }
  }
}

export function range(from: number, to: number): RangeValidator {
  return new RangeValidator(from, to);
}

export class IntegerValidator implements Validator<number> {
  validate(value: number, name: string): void {
    if (value % 1 !== 0) {
      throw new ExpectedError(`Value of \`${name}\` is not an integer`);
    }
  }
}

export const integer = new IntegerValidator();
