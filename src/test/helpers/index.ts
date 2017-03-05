import * as Path from 'path';

import { CLI } from '../../';

export type CLICreator = (label?: string) => CLI;

export function getCLICreator(filename: string): CLICreator {
  let dirname = Path.dirname(filename);
  let basename = Path.basename(filename, '.js');

  let casesDirname = Path.join(dirname, `${basename}-cases`);

  return label => new CLI('test', label ? Path.join(casesDirname, label) : casesDirname);
}
