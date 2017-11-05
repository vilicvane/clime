declare module 'parse-messy-time' {
  interface ParseOptions {
    now?: number;
  }

  function parse(str: string, options?: ParseOptions): Date;

  export = parse;
}
