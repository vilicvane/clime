import parseMessyTime = require('parse-messy-time');

export class CommaSeparatedStrings extends Array<string> {
  private constructor(...args: string[]) {
    super(...args);
  }

  static cast(line: string): CommaSeparatedStrings {
    let values = line
      .split(',')
      .map(str => str.trim())
      .filter(str => !!str);

    return new this(...values);
  }
}

class CastableDate extends Date {
  private constructor(str: string) {
    super(parseMessyTime(str, {now: Math.round(Date.now() / 1000) * 1000}));
  }

  toDate(): Date {
    return new Date(this.getTime());
  }

  static cast(str: string): CastableDate {
    return new this(str);
  }
}

export {CastableDate as Date, CastableDate};
