import * as FS from 'fs';
import * as Path from 'path';

import {
    Command,
    CommandClass,
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

import {
    safeStat
} from '../util';

const COMMAND_NAME_REGEX = /^[\w\d]+(?:-[\w\d]+)*$/;
const HELP_OPTION_REGEX = /^(?:-[h?]|--help)$/;

export interface CommandModule {
    brief?: string;
    description?: string;
    subcommands?: SubcommandDescriptor[];
}

export interface SubcommandDescriptor {
    name: string;
    filename?: string;
    alias?: string;
    aliases?: string[];
    brief?: string;
}

interface PreProcessResult {
    sequence: string[];
    args: string[];
    path: string;
    possibleUnknownCommandName: string | undefined;
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

    async execute(argv: string[], cwd = process.cwd()): Promise<any> {
        let {
            sequence,
            args,
            path,
            possibleUnknownCommandName
        } = await this.preProcessArguments(argv);

        let stats = await safeStat(path);
        let description: string | undefined;

        if (stats && stats.isFile()) {
            let module = require(path);
            let TargetCommand = (module.default || module) as CommandClass;

            if (TargetCommand.prototype instanceof Command) {
                // This is a command module with an actual command.

                if (!TargetCommand.decorated) {
                    throw new TypeError(`Command defined in module "${path}" does not seem to be intialized, make sure to decorate it with \`@command()\``);
                }

                TargetCommand.path = path;
                TargetCommand.sequence = sequence;

                let argsParser = new ArgsParser(TargetCommand);
                let parsedArgs = argsParser.parse(sequence, args, cwd);

                if (!parsedArgs) {
                    return await HelpInfo.build({ TargetCommand });
                }

                let command = new TargetCommand();

                let {
                    args: commandArgs,
                    extraArgs: commandExtraArgs,
                    options: commandOptions,
                    context
                } = parsedArgs;

                return await this.executeCommand(
                    command,
                    commandArgs,
                    commandExtraArgs,
                    commandOptions,
                    context
                );
            } else if (Path.basename(path) === 'default.js') {
                // This is a command module with only description and
                // subcommands information.
                path = Path.dirname(path);
                description = TargetCommand.description;
            } else {
                throw new TypeError(`Module "${path}" is expected to be a command`);
            }
        }

        let helpInfo = await HelpInfo.build({ dir: path, description });

        if (possibleUnknownCommandName) {
            throw new UsageError(`Unknown subcommand "${possibleUnknownCommandName}"`, {
                getHelp() {
                    return helpInfo;
                }
            });
        }

        if (args.length && HELP_OPTION_REGEX.test(args[0])) {
            return helpInfo;
        } else {
            throw helpInfo;
        }
    }

    /**
     * Mapping the command line arguments to a specific command file.
     */
    private async preProcessArguments(argv: string[]): Promise<PreProcessResult> {
        let sequence = [this.name];
        let searchPath = this.root;
        let argsIndex = 0;

        let entryPath = Path.join(this.root, 'default.js');
        let targetPath = await safeStat(entryPath) ? entryPath : searchPath;
        let possibleUnknownCommandName: string | undefined;
        let aliases: string[] | undefined;

        outer:
        for (let i = argsIndex; i < argv.length; i++) {
            let possibleCommandName = argv[i];

            if (!COMMAND_NAME_REGEX.test(possibleCommandName)) {
                break;
            }

            let subcommands = await CLI.getSubcommandDescriptors(searchPath);

            if (subcommands && subcommands.length) {
                let metadata = new Map<string, SubcommandDescriptor>();

                for (let subcommand of subcommands) {
                    metadata.set(subcommand.name, subcommand);

                    let aliases = subcommand.aliases || subcommand.alias && [subcommand.alias];

                    if (!aliases) {
                        continue;
                    }

                    for (let alias of aliases) {
                        metadata.set(alias, subcommand);
                    }
                }

                if (!metadata.has(possibleCommandName)) {
                    possibleUnknownCommandName = possibleCommandName;
                    break;
                }

                let descriptor = metadata.get(possibleCommandName);

                // If `possibleCommandName` is an alias.
                if (descriptor.name !== possibleCommandName) {
                    possibleCommandName = descriptor.name;
                }

                if (descriptor.filename) {
                    targetPath = Path.resolve(searchPath, descriptor.filename);
                    argsIndex = i + 1;
                    sequence.push(possibleCommandName);
                    continue outer;
                }
            }

            searchPath = Path.join(searchPath, possibleCommandName);

            let possiblePaths = [
                searchPath + '.js',
                Path.join(searchPath, 'default.js'),
                searchPath
            ];

            for (let possiblePath of possiblePaths) {
                if (await safeStat(possiblePath)) {
                    targetPath = possiblePath;
                    argsIndex = i + 1;
                    sequence.push(possibleCommandName);
                    continue outer;
                }
            }

            possibleUnknownCommandName = possibleCommandName;

            // If a directory at path `searchPath` does not exist, stop searching.
            if (!await safeStat(searchPath)) {
                break;
            }
        }

        return {
            sequence,
            args: argv.slice(argsIndex),
            path: targetPath,
            possibleUnknownCommandName
        };
    }

    private executeCommand(
        command: Command,
        commandArgs: string[],
        commandExtraArgs: string[] | undefined,
        commandOptions: Clime.Dictionary<any> | undefined,
        context: Context | undefined
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

    async getHelp(): Promise<HelpInfo> {
        return await HelpInfo.build({
            dir: this.root
        });
    }

    /** @internal */
    static async getSubcommandDescriptors(dir: string): Promise<SubcommandDescriptor[] | undefined> {
        let path = Path.join(dir, 'default.js');

        if (!await safeStat(path)) {
            return undefined;
        }

        let commandModule = require(path) as CommandModule;
        return commandModule.subcommands;
    }
}

export interface ParsedArgs {
    args: any[];
    extraArgs?: any[];
    options?: Clime.Dictionary<any>;
    context?: Context;
}

class ArgsParser {
    private helpProvider: HelpProvider;

    private paramDefinitions: ParamDefinition<any>[];
    private requiredParamsNumber: number;

    private paramsDefinition: ParamsDefinition<any>;

    private optionDefinitionMap: Map<string, OptionDefinition<any>>;
    private optionFlagMapping: Map<string, string>;

    private optionsConstructor: Clime.Constructor<Clime.Dictionary<any>>;
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
            this.optionFlagMapping = new Map<string, string>();
            this.optionDefinitionMap = new Map<string, OptionDefinition<any>>();

            for (let definition of this.optionDefinitions) {
                let {
                    name,
                    flag
                } = definition;

                this.optionDefinitionMap.set(name, definition);

                if (flag) {
                    this.optionFlagMapping.set(flag, name);
                }
            }
        }
    }

    parse(sequence: string[], args: string[], cwd: string): ParsedArgs | undefined {
        let that = this;

        let ContextConstructor = this.contextConstructor || Context;
        let context = new ContextConstructor({
            cwd,
            commands: sequence
        });

        args = args.concat();

        let OptionConstructor = this.optionsConstructor;
        let optionDefinitions = this.optionDefinitions;
        let optionDefinitionMap = this.optionDefinitionMap || new Map<string, OptionDefinition<any>>();
        let optionFlagMapping = this.optionFlagMapping || new Map<string, string>();
        let requiredOptionSet: Set<string> | undefined;

        let paramDefinitions = this.paramDefinitions || [];
        let pendingParamDefinitions = paramDefinitions.concat();

        let paramsDefinition = this.paramsDefinition;
        let argsNumber = args.length;

        let commandArgs = [] as any[];
        let commandExtraArgs = paramsDefinition && [] as any[];
        let commandOptions: Clime.Dictionary<any> | undefined;

        if (OptionConstructor) {
            commandOptions = new OptionConstructor();
            requiredOptionSet = new Set<string>();

            for (let definition of optionDefinitions) {
                let {
                    name,
                    key,
                    type,
                    required,
                    validators,
                    toggle,
                    default: defaultValue
                } = definition;

                if (required) {
                    requiredOptionSet.add(name);
                }

                if (toggle) {
                    commandOptions[key] = false;
                } else {
                    commandOptions[key] = typeof defaultValue === 'string' ?
                        castArgument(defaultValue, name, type, validators) :
                        defaultValue;
                }
            }
        }

        while (args.length) {
            let arg = args.shift() as string;

            if (
                arg === '-?' ||
                (arg === '-h' && !optionFlagMapping.has('h')) ||
                (arg === '--help' && !optionDefinitionMap.has('help'))
            ) {
                return undefined;
            }

            if (arg[0] === '-') {
                if (arg[1] === '-') {
                    consumeToggleOrOption(arg.substr(2));
                } else {
                    consumeFlags(arg.substr(1))
                }
            } else if (pendingParamDefinitions.length) {
                let definition = pendingParamDefinitions.shift() as ParamDefinition<any>;
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
            let missingOptionNames = requiredOptionSet && requiredOptionSet.keys();

            if (missingOptionNames && missingOptionNames.length) {
                throw new UsageError(`Missing required option(s) \`${missingOptionNames.join('`, `')}\``, this.helpProvider);
            }
        }

        for (let definition of pendingParamDefinitions) {
            let defaultValue = definition.default;

            let value = typeof defaultValue === 'string' ?
                castArgument(defaultValue, definition.name, definition.type, definition.validators) :
                defaultValue;

            commandArgs.push(value);
        }

        if (
            paramsDefinition &&
            paramsDefinition.required &&
            !commandExtraArgs.length
        ) {
            throw new UsageError(`Expecting at least one element for letiadic parameters \`${paramsDefinition.name}\``, this.helpProvider);
        }

        return {
            args: commandArgs,
            extraArgs: paramsDefinition && commandExtraArgs,
            options: commandOptions,
            context: this.contextConstructor ? context : undefined
        };

        function consumeFlags(flags: string): void {
            for (let i = 0; i < flags.length; i++) {
                let flag = flags[i];

                if (!optionFlagMapping.has(flag)) {
                    throw new UsageError(`Unknown option flag "${flag}"`, that.helpProvider);
                }

                let name = optionFlagMapping.get(flag);
                let definition = optionDefinitionMap.get(name);

                if (definition.required) {
                    requiredOptionSet!.delete(name);
                }

                if (definition.toggle) {
                    commandOptions![definition.key] = true;
                } else {
                    if (i !== flags.length - 1) {
                        throw new UsageError('Only the last flag in a sequence can refer to an option instead of a toggle', that.helpProvider);
                    }

                    consumeOption(definition);
                }
            }
        }

        function consumeToggleOrOption(name: string): void {
            if (!optionDefinitionMap.has(name)) {
                throw new UsageError(`Unknown option \`${name}\``, that.helpProvider);
            }

            let definition = optionDefinitionMap.get(name);

            if (definition.required) {
                requiredOptionSet!.delete(name);
            }

            if (definition.toggle) {
                commandOptions![definition.key] = true;
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

            commandOptions![key] = castArgument(arg, name, type, validators);
        }

        // TODO: support casting provider object.
        function castArgument(arg: string, name: string, type: Clime.Constructor<any>, validators: GeneralValidator<any>[]): any {
            let value: any;

            switch (type) {
                case String:
                    value = arg;
                    break;
                case Number:
                    value = Number(arg);

                    if (isNaN(value)) {
                        throw new ExpectedError(`Value "${arg}" cannot be casted to number`);
                    }

                    break;
                case Boolean:
                    if (/^(?:f|false)$/i.test(arg)) {
                        value = false;
                    } else {
                        let n = Number(arg);
                        value = isNaN(n) ? true : Boolean(n);
                    }

                    break;
                default:
                    if (isStringCastable(type)) {
                        value = type.cast(arg, context)
                    } else {
                        throw new Error(`Type \`${(<any>type).name || type}\` cannot be casted from a string, see \`StringCastable\` interface for more information`);
                    }

                    break;
            }

            for (let validator of validators) {
                if (validator instanceof RegExp) {
                    if (!validator.test(value)) {
                        throw new ExpectedError(`Invalid value for "${name}"`);
                    }
                } else {
                    validator.validate(arg, name);
                }
            }

            return value;
        }
    }
}

export interface HelpProvider {
    getHelp(): Promise<HelpInfo> | HelpInfo;
}

export class UsageError extends ExpectedError implements Printable {
    constructor(
        message: string,
        public helpProvider: HelpProvider
    ) {
        super(message);
    }

    async print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): Promise<void> {
        super.print(stdout, stderr);

        let help = await this.helpProvider.getHelp();
        help.print(stdout, stderr);
    }
}
