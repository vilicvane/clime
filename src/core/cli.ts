import * as FS from 'fs';
import * as Path from 'path';

import ExtendableError from 'extendable-error';
import hyphenate from 'hyphenate';
import Promise, { Resolvable } from 'thenfail';

import {
    Command,
    Context,
    HelpInfo,
    OptionDefinition,
    ParamDefinition,
    ParamsDefinition,
    GeneralValidator
} from './command';

import {
    Printable,
    isStringCastable
} from './object';

import {
    ExpectedError
} from './error';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const COMMAND_NAME_REGEX = /^[\w\d]+(?:-[\w\d]+)*$/;
const HELP_OPTION_REGEX = /^(?:-[h?]|--help)$/;

export interface DescriptiveObject {
    brief?: string;
    description?: string;
}

/**
 * Clime command line interface.
 */
export class CLI {
    root: string;

    constructor(
        /** Command entry name. */
        public name: string,
        /** Root directory of command modules. */
        root: string
    ) {
        this.root = Path.resolve(root);
    }

    execute(argv: string[], cwd = process.cwd()): Promise<Printable | void> {
        return Promise.then(() => {
            let {
                commands,
                args,
                path
            } = this.preProcessArguments(argv);

            let isFile = FS.statSync(path).isFile();
            let description: string;

            if (isFile) {
                let module = require(path);
                let TargetCommand: Clime.Constructor<Command> & typeof Command = module.default || module;

                if (TargetCommand.prototype instanceof Command) {
                    if (!TargetCommand.decorated) {
                        throw new TypeError(`Command defined in module "${path}" does not seem to be intialized, make sure to decorate it with \`@command()\``);
                    }

                    TargetCommand.path = path;
                    TargetCommand.sequence = commands;

                    let argsParser = new ArgsParser(TargetCommand);

                    let {
                        args: commandArgs,
                        extraArgs: commandExtraArgs,
                        options: commandOptions,
                        context,
                        help
                    } = argsParser.parse(commands, args, cwd);

                    let command = new TargetCommand();

                    if (help) {
                        return HelpInfo.build(TargetCommand);
                    }

                    return this.executeCommand(
                        command,
                        commandArgs,
                        commandExtraArgs,
                        commandOptions,
                        context
                    );
                } else if (Path.basename(path) === 'default.js') {
                    path = Path.dirname(path);
                    description = TargetCommand.description;
                } else {
                    throw new TypeError(`Module "${path}" is expected to be a command`);
                }
            }

            let helpInfo = HelpInfo.build(path, description);

            if (args.some(arg => HELP_OPTION_REGEX.test(arg))) {
                return helpInfo;
            } else {
                throw helpInfo;
            }
        });
    }

    private preProcessArguments(argv: string[]): {
        commands: string[],
        args: string[],
        path: string
    } {
        let commands = [this.name];
        let searchPath = this.root;
        let argsIndex = 0;

        let entryPath = Path.join(this.root, 'default.js');
        let targetPath = FS.existsSync(entryPath) ? entryPath : searchPath;

        outer:
        for (let i = argsIndex; i < argv.length; i++) {
            let arg = argv[i];

            if (COMMAND_NAME_REGEX.test(arg)) {
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

    private executeCommand(
        command: Command,
        commandArgs: string[],
        commandExtraArgs: string[],
        commandOptions: Clime.HashTable<any>,
        context: Context
    ): any {
        let executeMethodArgs: any[] = commandArgs.concat();

        if (commandExtraArgs) {
            executeMethodArgs.push(commandExtraArgs);
        }

        if (commandOptions) {
            executeMethodArgs.push(commandOptions);
        }

        if (context) {
            executeMethodArgs.push(context)
        }

        return command.execute(...executeMethodArgs);
    }

    getHelp(): HelpInfo {
        return HelpInfo.build(this.root);
    }
}

export interface ParsedArgs {
    args?: any[];
    extraArgs?: any[];
    options?: Clime.HashTable<any>;
    context?: Context;
    help?: boolean;
}

class ArgsParser {
    private helpProvider: HelpProvider;

    private paramDefinitions: ParamDefinition<any>[];
    private requiredParamsNumber: number;

    private paramsDefinition: ParamsDefinition<any>;

    private optionDefinitionMap: Clime.HashTable<OptionDefinition<any>>;
    private optionFlagMapping: Clime.HashTable<string>;

    private optionsConstructor: Clime.Constructor<Clime.HashTable<any>>;
    private optionDefinitions: OptionDefinition<any>[];

    private contextConstructor: typeof Context;

    constructor(command: typeof Command) {
        this.helpProvider = command;

        this.paramDefinitions = command.paramDefinitions;
        this.requiredParamsNumber = command.requiredParamsNumber;

        this.paramsDefinition = command.paramsDefinition;

        this.optionsConstructor = command.optionsConstructor;
        this.optionDefinitions = command.optionDefinitions;

        this.contextConstructor = command.contextConstructor;

        if (this.optionDefinitions) {
            this.optionFlagMapping = {};
            this.optionDefinitionMap = {};

            for (let definition of this.optionDefinitions) {
                let {
                    name,
                    flag,
                    required,
                    toggle,
                    default: defaultValue
                } = definition;

                this.optionDefinitionMap[name] = definition;

                if (flag) {
                    this.optionFlagMapping[flag] = name;
                }
            }
        }
    }

    parse(sequence: string[], args: string[], cwd: string): ParsedArgs {
        let that = this;

        let ContextConstructor = this.contextConstructor || Context;
        let context = new ContextConstructor({
            cwd,
            commands: sequence
        });

        args = args.concat();

        let OptionConstructor = this.optionsConstructor;
        let optionDefinitions = this.optionDefinitions;
        let optionDefinitionMap = this.optionDefinitionMap || {};
        let optionFlagMapping = this.optionFlagMapping || {};
        let requiredOptionMap: Clime.HashTable<boolean>;

        let paramDefinitions = this.paramDefinitions || [];
        let pendingParamDefinitions = paramDefinitions.concat();

        let paramsDefinition = this.paramsDefinition;
        let argsNumber = args.length;

        let commandArgs: any[] = [];
        let commandExtraArgs: any[] = paramsDefinition && [];
        let commandOptions: Clime.HashTable<any>;

        if (OptionConstructor) {
            commandOptions = new OptionConstructor();
            requiredOptionMap = {};

            for (let definition of optionDefinitions) {
                let {
                    name,
                    key,
                    required,
                    toggle,
                    default: defaultValue
                } = definition;

                if (required) {
                    requiredOptionMap[name] = true;
                }

                if (toggle) {
                    commandOptions[key] = false;
                } else {
                    commandOptions[key] = defaultValue;
                }
            }
        }

        while (args.length) {
            let arg = args.shift();

            if (
                arg === '-?' ||
                (arg === '-h' && !hasOwnProperty.call(optionFlagMapping, 'h')) ||
                (arg === '--help' && !hasOwnProperty.call(optionDefinitionMap, 'help'))
            ) {
                return {
                    help: true
                };
            }

            if (arg[0] === '-') {
                if (arg[1] === '-') {
                    consumeToggleOrOption(arg.substr(2));
                } else {
                    consumeFlags(arg.substr(1))
                }
            } else if (pendingParamDefinitions.length) {
                let definition = pendingParamDefinitions.shift();
                let casted = castArgument(arg, definition.name, definition.type, definition.validators);
                commandArgs.push(casted);
            } else if (paramsDefinition) {
                let casted = castArgument(arg, paramsDefinition.name, paramsDefinition.type, paramsDefinition.validators);
                commandExtraArgs.push(casted);
            } else {
                throw new UsageError(
                    `Expecting ${paramDefinitions.length} parameter(s) at most but got ${argsNumber} instead`,
                    this.helpProvider
                );
            }
        }

        {
            let expecting = this.requiredParamsNumber;
            let got = commandArgs.length;

            if (got < expecting) {
                let missingArgNames = pendingParamDefinitions
                    .slice(0, expecting - got)
                    .map(definition => `\`${definition.name}\``);

                throw new UsageError(`Expecting parameter(s) ${missingArgNames.join(', ')}`, this.helpProvider);
            }
        }

        {
            let missingOptionNames = requiredOptionMap && Object.keys(requiredOptionMap);

            if (missingOptionNames && missingOptionNames.length) {
                throw new UsageError(`Missing required option(s) \`${missingOptionNames.join('`, `')}\``, this.helpProvider);
            }
        }

        for (let definition of pendingParamDefinitions) {
            commandArgs.push(definition.default);
        }

        if (
            paramsDefinition &&
            paramsDefinition.required &&
            !commandExtraArgs.length
        ) {
            throw new UsageError(`Expecting at least one element for variadic parameters \`${paramsDefinition.name}\``, this.helpProvider);
        }

        return {
            args: commandArgs,
            extraArgs: paramsDefinition && commandExtraArgs,
            options: commandOptions,
            context
        };

        function consumeFlags(flags: string): void {
            for (let i = 0; i < flags.length; i++) {
                let flag = flags[i];

                if (!hasOwnProperty.call(optionFlagMapping, flag)) {
                    throw new UsageError(`Unknown option flag "${flag}"`, that.helpProvider);
                }

                let name = optionFlagMapping[flag];
                let definition = optionDefinitionMap[name];

                if (definition.required) {
                    delete requiredOptionMap[name];
                }

                if (definition.toggle) {
                    commandOptions[definition.key] = true;
                } else {
                    if (i !== flags.length - 1) {
                        throw new UsageError('Only the last flag in a sequence can refer to an option instead of a toggle', that.helpProvider);
                    }

                    consumeOption(definition);
                }
            }
        }

        function consumeToggleOrOption(name: string): void {
            if (!hasOwnProperty.call(optionDefinitionMap, name)) {
                throw new UsageError(`Unknown option \`${name}\``, that.helpProvider);
            }

            let definition = optionDefinitionMap[name];

            if (definition.required) {
                delete requiredOptionMap[name];
            }

            if (definition.toggle) {
                commandOptions[definition.key] = true;
            } else {
                consumeOption(definition);
            }
        }

        function consumeOption(definition: OptionDefinition<any>) {
            let {
                name,
                key,
                type,
                validators
            } = definition;

            let arg = args.shift();

            if (arg === undefined) {
                throw new UsageError(`Expecting value for option \`${name}\``, that.helpProvider);
            }

            if (arg[0] === '-') {
                throw new UsageError(`Expecting a value instead of an option or toggle "${arg}" for option \`${name}\``, that.helpProvider);
            }

            commandOptions[key] = castArgument(arg, name, type, validators);
        }

        // TODO: support casting provider object.
        function castArgument(arg: string, name: string, type: Clime.Constructor<any>, validators: GeneralValidator<any>[]): any {
            let casted: any;

            switch (type) {
                case String:
                    casted = arg;
                    break;
                case Number:
                    casted = Number(arg);

                    if (isNaN(casted)) {
                        throw new ExpectedError(`Value "${arg}" cannot be casted to number`);
                    }

                    break;
                case Boolean:
                    if (arg.toLowerCase() === 'false') {
                        casted = false;
                    } else {
                        let n = Number(arg);
                        casted = isNaN(n) ? true : Boolean(n);
                    }

                    break;
                default:
                    if (isStringCastable(type)) {
                        casted = type.cast(arg, context)
                    } else {
                        throw new Error(`Type \`${(<any>type).name || type}\` cannot be casted from a string, see \`StringCastable\` interface for more information`);
                    }

                    break;
            }

            for (let validator of validators) {
                if (validator instanceof RegExp) {
                    if (!validator.test(casted)) {
                        throw new ExpectedError(`Invalid value for "${name}"`);
                    }
                } else {
                    validator.validate(arg, name);
                }
            }

            return casted;
        }
    }
}

export interface HelpProvider {
    getHelp(): HelpInfo;
}

export class UsageError extends ExpectedError implements Printable {
    constructor(
        message: string,
        public helpProvider: HelpProvider
    ) {
        super(message);
    }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        super.print(stdout, stderr);

        this
            .helpProvider
            .getHelp()
            .print(stdout, stderr);
    }
}
