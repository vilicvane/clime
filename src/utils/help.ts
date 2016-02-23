import * as Path from 'path';

import * as Chalk from 'chalk';
import * as glob from 'glob';
import Promise, { invoke } from 'thenfail';

import {
    Command,
    Printable
} from '../core';

import {
    buildTableOutput
} from '../utils';

export interface CommandPeek {
    name: string;
    description: string;
}

// TODO: cache
export function getCommandPeeks(dir: string): Promise<CommandPeek[]> {
    return invoke<string[]>(glob, '+(*.js|*/default.js)', {
            cwd: dir
        })
        .map<CommandPeek>(path => {
            const dirname = Path.dirname(path);
            const name = dirname === '.' ? Path.basename(path, '.js') : dirname;

            const resolvedPath = Path.resolve(dir, path);
            const CommandClass = (require(resolvedPath).default as typeof Command);

            const description = CommandClass.description;

            return {
                name,
                description
            };
        });
}

export class CommandsInfo implements Printable {
    constructor(
        public peeks: CommandPeek[]
    ) { }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        if (!this.peeks) {
            return;
        }

        let rows = this.peeks.map(peek => [peek.name, peek.description]);

        let output = '  SUB COMMANDS\n' +
            buildTableOutput(rows, {
                indent: 4,
                spaces: ' - '
            }) + '\n';

        stderr.write(output);
    }

    static get(dir: string): Promise<CommandsInfo> {
        return getCommandPeeks(dir)
            .then(peeks => new CommandsInfo(peeks));
    }
}
