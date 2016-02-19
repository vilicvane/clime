import * as Path from 'path';
import * as FS from 'fs';

import {
    CommandConstructor,
    OptionDefinition,
    Context
} from '../core'

import {
    memorize
} from '../utils';

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

        CommandConstructor.initialize();

        let command = new CommandConstructor(filename, cwd);

        let optionDefinitions = command.optionDefinitions;
        let optionDefinitionMap: HashTable<OptionDefinition> = {};
        let requiredOptionMap: HashTable<boolean> = {};

        let flagToNameMapping: HashTable<string> = {};

        let commandOptions: HashTable<any> = {};
        let commandArgs: any[] = [];
        let commandExtraArgs: any[] = [];

        for (let definition of optionDefinitions) {
            let { name, flag, required, toggle, default: defaultValue } = definition;

            optionDefinitionMap[name] = definition;

            if (flag) {
                flagToNameMapping[flag] = name;
            }

            if (required) {
                requiredOptionMap[name] = true;
            }

            if (toggle) {
                commandOptions[name] = false;
            } else {
                commandOptions[name] = defaultValue;
            }
        }

        let paramDefinitions = command.paramDefinitions;

        let pendingParamDefinitions = paramDefinitions.concat();

        while (args.length) {
            let arg = args.shift();

            if (arg[0] === '-') {
                if (arg[1] === '-') {
                    consumeToggleOrOption(arg.substr(2));
                } else {
                    consumeFlags(arg.substr(1))
                }
            } else {
                consumeArgument(arg);
            }
        }

        {
            let expecting = command.requiredParamsNumber;
            let got = commandArgs.length;

            if (got < expecting) {
                throw new Error(`Expecting ${expecting} or more parameters but got ${got} instead`);
            }
        }

        {
            let missingOptionNames = Object.keys(requiredOptionMap);

            if (missingOptionNames.length) {
                throw new Error(`Missing required option(s) \`${missingOptionNames.join('`, `')}\``);
            }
        }

        for (let definition of pendingParamDefinitions) {
            commandArgs.push(definition.default);
        }

        let context: Context = {
            cwd,
            args: commandExtraArgs
        };

        command.execute(...commandArgs, commandOptions, context);

        function consumeFlags(flags: string): void {
            for (let i = 0; i < flags.length; i++) {
                let flag = flags[i];

                if (!flagToNameMapping.hasOwnProperty(flag)) {
                    throw new Error(`Unknown option flag "${flag}"`);
                }

                let name = flagToNameMapping[flag];
                let definition = optionDefinitionMap[name];

                if (definition.toggle) {
                    commandOptions[name] = true;
                } else {
                    if (i !== flags.length - 1) {
                        throw new Error('Only the last flag in a sequence can refer to an option instead of a toggle');
                    }

                    consumeOption(name, definition);
                }
            }
        }

        function consumeToggleOrOption(name: string): void {
            if (!optionDefinitionMap.hasOwnProperty(name)) {
                throw new Error(`Unknown option \`${name}\``);
            }

            let definition = optionDefinitionMap[name];

            if (definition.required) {
                delete requiredOptionMap[name];
            }

            if (definition.toggle) {
                commandOptions[name] = true;
            } else {
                consumeOption(name, definition);
            }
        }

        function consumeOption(name: string, definition: OptionDefinition) {
            let arg = args.shift();

            if (arg === undefined) {
                throw new Error(`Expecting value for option \`${name}\``);
            }

            if (arg[0] === '-') {
                throw new Error(`Expecting a value instead of an option or toggle "${arg}" for option \`${name}\``);
            }

            commandOptions[name] = castArgument(arg, definition.type);
        }

        function consumeArgument(arg: string): void {
            if (pendingParamDefinitions.length) {
                let definition = pendingParamDefinitions.shift();
                commandArgs.push(castArgument(arg, definition.type))
            } else {
                commandExtraArgs.push(arg);
            }
        }

        function castArgument(arg: string, type: Function): any {
            switch (type) {
                case String:
                    return arg;
                case Number:
                    return Number(arg);
                case Boolean:
                    if (arg.toLowerCase() === 'false') {
                        return false;
                    } else {
                        let n = Number(arg);
                        return isNaN(n) ? true : Boolean(n);
                    }
                default:
                    return undefined;
            }
        }
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
