import * as FS from 'fs';
import * as Path from 'path';

import Promise from 'thenfail';

import {
    Command,
    Context,
    ParamDefinition,
    OptionDefinition,
    HelpInfo
} from './command';

export interface DescriptiveObject {
    brief?: string;
    description?: string;
}

const validCommandNameRegex = /^[\w\d]+(?:-[\w\d]+)*$/;

/**
 * Clime command line interface.
 */
export class CLI {
    root: string;
    description: string;

    constructor(
        public name: string,
        root: string
    ) {
        this.root = Path.resolve(root);
    }

    parse(argv: string[], cwd = process.cwd()): any {
        let {
            commands,
            args,
            path
        } = this.preProcessArguments(argv);

        if (path) {
            // command file or directory exists
            let isFile = FS.statSync(path).isFile();

            if (isFile) {
                return this.loadCommand(path, commands, args, cwd);
            } else {
                return HelpInfo.build(path);
            }
        } else {
            return this.help;
        }
    }

    preProcessArguments(argv: string[]): {
        commands: string[],
        args: string[],
        path: string
    } {
        let commands = [this.name];
        let searchPath = this.root;
        let argsIndex = 2;

        let entryPath = Path.join(this.root, 'default.js');
        let targetPath: string;

        if (FS.existsSync(entryPath)) {
            targetPath = entryPath;

            let module = require(entryPath);
            let object = (module.default || module) as DescriptiveObject;
            this.description = object.description;
        } else {
            targetPath = searchPath;
        }

        outer:
        for (let i = 2; i < argv.length; i++) {
            let arg = argv[i];

            if (validCommandNameRegex.test(arg)) {
                searchPath = Path.join(searchPath, arg);

                let possiblePaths = [
                    searchPath + '.js',
                    Path.join(searchPath, 'default.js'),
                    searchPath
                ];

                for (let possiblePath of possiblePaths) {
                    if (FS.existsSync(possiblePath)) {
                        targetPath = possiblePath;
                        argsIndex = i + 1;
                        commands.push(arg);
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

        return {
            commands,
            args: argv.slice(argsIndex),
            path: targetPath
        };
    }

    loadCommand(path: string, sequence: string[], args: string[], cwd: string): any {
        let module = require(path);
        let TargetCommand: Constructor<Command> & typeof Command = module.default || module;

        if (TargetCommand.prototype instanceof Command) {
            TargetCommand.path = path;
            TargetCommand.sequence = sequence;

            let {
                paramDefinitions,
                optionDefinitions
            } = TargetCommand;

            let argsParser = new ArgsParser(paramDefinitions, optionDefinitions);

            let {
                args: commandArgs,
                options: commandOptions,
                extraArgs: commandExtraArgs
            } = argsParser.parse(args);

            let command = new TargetCommand();

            let executeMethodArgs = commandArgs.concat();

            if (optionDefinitions) {
                executeMethodArgs.push(commandOptions);
            }

            let context: Context = {
                cwd,
                args: commandExtraArgs,
                commands: sequence
            };

            executeMethodArgs.push(context)

            return command.execute(...commandArgs, commandOptions);
        } else if (Path.basename(path) === 'default.js') {
            let dir = Path.dirname(path);
            return HelpInfo.build(dir, TargetCommand.description);
        }
    }

    get help(): HelpInfo {
        return HelpInfo.build(this.root);
    }
}

export class ParsedArgs {
    args: any[];
    options: HashTable<any>;
    extraArgs: any[];
}

export class ArgsParser {
    private optionDefinitionMap: HashTable<OptionDefinition<any>>;
    private optionFlagMapping: HashTable<string>;
    private paramDefinitions: ParamDefinition<any>[];
    private optionDefinitions: OptionDefinition<any>[];

    constructor(
        paramDefinitions: ParamDefinition<any>[],
        optionDefinitions: OptionDefinition<any>[]
    ) {
        this.paramDefinitions = paramDefinitions || [];
        this.optionDefinitions = optionDefinitions || [];

        for (let definition of optionDefinitions) {
            this.optionDefinitionMap[definition.name] = definition;
            this.optionFlagMapping[definition.flag] = definition.name;
        }
    }

    parse(args: string[]): ParsedArgs {
        let commandArgs: any[] = [];
        let commandOptions: HashTable<any> = {};
        let commandExtraArgs: any[] = [];

        let pendingParamDefinitions = this.paramDefinitions.concat();
        return;
    }


}
