// tslint:disable:no-console

import * as Util from 'util';

import * as Chalk from 'chalk';

import {CLI, ExpectedError, isPrintable} from '../core';

/**
 * A Clime command line interface shim for pure Node.js.
 */
export class Shim {
  constructor(public cli: CLI) {}

  /**
   * Execute CLI with an array as `argv`.
   * @param argv - The `argv` array to execute, typically `process.argv`.
   * @param cwd - Current working directory.
   */
  async execute(argv: string[], cwd?: string): Promise<void> {
    try {
      let result = await this.cli.execute(argv.slice(2), cwd);

      if (isPrintable(result)) {
        await result.print(process.stdout, process.stderr);
      } else if (result !== undefined) {
        // tslint:disable-next-line:no-console
        console.log(result);
      }
    } catch (error) {
      let exitCode = 1;

      if (isPrintable(error)) {
        await error.print(process.stdout, process.stderr);

        if (error instanceof ExpectedError) {
          exitCode = error.code;
        }
      } else if (error instanceof Error) {
        console.error(Chalk.red(error.stack || error.message));
      } else {
        console.error(Chalk.red(Util.format(error)));
      }

      process.exit(exitCode);
    }
  }
}
