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
