import * as Path from 'path';

import { CLI } from '../../';

export type CLICreator = (path: string) => CLI;

export function getCLICreator(filename: string): CLICreator {
    let dirname = Path.dirname(filename);
    let basename = Path.basename(filename, '.js');

    let casesDirname = Path.join(dirname, `${basename}-cases`);

    return (path: string) => new CLI('test', Path.join(casesDirname, path));
}
