import * as FS from 'fs';
import * as Path from 'path';

import Promise from 'thenfail';

import {
    CommandsInfo
} from '../utils';

import {
    ParamDefinition,
    OptionDefinition,
    ToggleDefinition
} from './command';

const validCommandNameRegex = /^[\w\d]+(?:-[\w\d]+)*$/;

/**
 * Clime command line interface.
 */
export class CLI {
    root: string;

    constructor(
        public name: string,
        root: string
    ) {
        this.root = Path.resolve(root);

    }

    parse(argv: string[], cwd = process.cwd()) {
        let {
            commands,
            args,
            path
        } = this.preProcessArguments(argv);

        if (path) {
            // command file exists
        } else if (commands.length > 1) {

        } else {
            this.help();
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
        let targetPath = FS.existsSync(entryPath) ? entryPath : searchPath;

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

    help(): Promise<CommandsInfo> {
        return CommandsInfo.get(this.root);
    }
}

export class CLIParsedArgs {
    args: any[];
    options: HashTable<any>;
    extraArgs: any[];
}

export class CLIParser {
    private optionDefinitionMap: HashTable<OptionDefinition<any>>;
    private toggleDefinitionMap: HashTable<ToggleDefinition>;

    private optionFlagMapping: HashTable<string>;
    private toggleFlagMapping: HashTable<string>;

    constructor(
        private paramDefinitions: ParamDefinition<any>[],
        private optionDefinitions: OptionDefinition<any>[],
        private toggleDefinitions: ToggleDefinition[]
    ) {

        for (let definition of optionDefinitions) {
            this.optionDefinitionMap[definition.name] = definition;
            this.optionFlagMapping[definition.flag] = definition.name;
        }

        for (let definition of toggleDefinitions) {
            this.toggleDefinitionMap[definition.name] = definition;
            this.toggleFlagMapping[definition.flag] = definition.name;
        }
    }

    parse(args: string[]): CLIParsedArgs {
        let commandArgs: any[] = [];
        let commandOptions: HashTable<any> = {};
        let commandExtraArgs: any[] = [];

        let pendingParamDefinitions = this.paramDefinitions.concat();
        return;
    }


}
