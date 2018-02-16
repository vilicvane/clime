import * as Chalk from 'chalk';
import ExtendableError from 'extendable-error';

import {Printable} from '.';

export class ExpectedError extends ExtendableError implements Printable {
  constructor(message: string, public code = 1) {
    super(message);
  }

  print(_stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
    let output = `${Chalk.dim.red('ERR')} ${this.message}.\n`;
    stderr.write(output);
  }
}
