import * as Path from 'path';
import * as FS from 'fs';

import {
    CommandConstructor
} from '../core'

const validCommandNameRegex = /^[\w\d]+(?:-[\w\d]+)*$/;
const defaultEntry = 'default';

export class CLI {
    parse(argv: string[], root = CLI.root, cwd = process.cwd()): void {
        root = Path.resolve(root);

        let searchPath = root;
        let filename = Path.join(searchPath, defaultEntry + '.js');

        let argsIndex = 2;
        let args: string[];

        outer:
        for (let i = 2; i < argv.length; i++) {
            let arg = argv[i];

            if (validCommandNameRegex.test(arg)) {
                searchPath = Path.join(searchPath, arg);

                let possiblePaths = [
                    searchPath + '.js',
                    Path.join(searchPath, defaultEntry + '.js')
                ];

                for (let possiblePath of possiblePaths) {
                    if (FS.existsSync(possiblePath)) {
                        filename = possiblePath;
                        argsIndex = i + 1;
                        continue outer;
                    }
                }

                // If a directory at path `searchPath` does not exist, stop searching.
                if (!FS.existsSync(searchPath)) {
                    break;
                }
            } else {
                break;
            }
        }

        this.load(filename, argv.slice(argsIndex), cwd);
    }

    private load(filename: string, args: string[], cwd: string): void {
        let CommandConstructor = require(filename).default as CommandConstructor;

        let command = new CommandConstructor(filename, cwd);

        



    }

    @memorize()
    private static get root(): string {
        let sep = Path.sep === '\\' ? '\\\\' : '/';

        let regexStr = `${sep}node_modules(?:${sep}(?!node_modules(?:${sep}|$))[^${sep}]+)+$`;
        let regex = new RegExp(regexStr);

        let moduleDir = __dirname.replace(regex, '');

        return Path.join(moduleDir, 'cli');
    }
}

function memorize(): MethodDecorator {
    return (target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
        let getter = descriptor.get;
        let value = descriptor.value;

        let fn: Function;
        let descriptorItemName: string;

        if (getter) {
            fn = getter;
            descriptorItemName = 'get';
        } else if (typeof value === 'function') {
            fn = value;
            descriptorItemName = 'value';
        }

        if (!fn) {
            throw new TypeError('Invalid decoration');
        }

        let hasCache = false;
        let cache: any;

        return {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            [descriptorItemName]() {
                if (hasCache) {
                    return cache;
                }

                cache = getter.call(this);
                hasCache = true;

                return cache;
            }
        };
    };
}
