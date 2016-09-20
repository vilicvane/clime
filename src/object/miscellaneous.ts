export class CommaSeperatedStrings extends Array<string> {
    private constructor(...args: string[]) {
        super(...args);
    }

    static cast(line: string): CommaSeperatedStrings {
        let values = line
            .split(',')
            .map(str => str.trim())
            .filter(str => !!str);

        return new this(...values);
    }
}
