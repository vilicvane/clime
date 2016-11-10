import * as FS from 'fs';
import * as Path from 'path';
import * as v from 'villa';

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
    hidden?: boolean; // 可将 subcommand 命令强制隐藏, 设置为不可(找到)使用的命令
    
    /** @internal */
    dir?: string; // 用来标记 command 文件模块所在位置, 主要还是程序内部使用
}

interface PreProcessResult {
    sequence: string[];
    args: string[];
    path: string;
    possibleUnknownCommandName: string | undefined;
}

export interface RootInfo {
    dir: string;
    title?: string;
}

/**
 * Clime command line interface.
 */
export class CLI {
    roots: RootInfo[];

    constructor(
        /** Command entry name. */
        public name: string,
        /** Root directory of command modules. */
        roots: string | RootInfo | (RootInfo | string)[]
    ) {
        if (typeof roots === 'string') {
            this.roots = [{ dir: Path.resolve(roots) }];
        } else if (!(roots instanceof Array)) {
            this.roots = [{
                dir: Path.resolve(roots.dir),
                title: roots.title
            }];
        } else {
            this.roots = roots.map(rootInfo => {
                if (typeof rootInfo === 'string') {
                    return {
                        dir: Path.resolve(rootInfo)
                    };
                } else {
                    return {
                        dir: Path.resolve(rootInfo.dir),
                        title: rootInfo.title
                    };
                }
            });
        }
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
                let parsedArgs: ParsedArgs | undefined; 

                // 多目录情况下，如果参数列表是空的情况 就不执行 arguments parse
                if (this.roots.length == 1 || (args.length > 0 || sequence.length > 1)) {
                    parsedArgs = await argsParser.parse(sequence, args, cwd);
                }

                if (parsedArgs === undefined) {
                    // 当参数列表为空，并且 是多root目录情况，要兼顾 全总目录下定义的subcommand的显示
                    if (sequence.length == 1 && this.roots.length > 1) {
                        let description = await this.getHelpDescription();
                        let subcommandHelpInfo = await this.getHelp(false);

                        return await HelpInfo.build({ TargetCommand, subcommandHelpInfo });
                    } else {
                        return await HelpInfo.build({ TargetCommand });
                    }
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

        let helpInfo: HelpInfo;

        if (sequence.length == 1) {
            // 没有找到匹配的 子命令 或 空参数 或 无效的参数 时候 显示默认的帮助信息
            // !possibleUnknownCommandName 这个值传过去的用意是，当传递参数是个未知
            // 参数 会不显示 默认的 头部描述内容
            helpInfo = await this.getHelp(!possibleUnknownCommandName);
        } else {
            helpInfo = await HelpInfo.build({ dir: path, description })
        }

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
        let argsIndex = 0;
        let possibleUnknownCommandName: string | undefined;
        let aliases: string[] | undefined;
        let searchPaths = this.roots.map(rootInfo => rootInfo.dir).reverse(); // 默认从最后一级开始搜索
        let targetPath: string = searchPaths[0];
        let entryPaths: string[] = [];
        
        for (let searchPath of searchPaths) {
            let entryPath = Path.join(searchPath, 'default.js');
            if (await safeStat(entryPath)) {
                let module = require(entryPath);
                let TargetCommand = (module.default || module) as CommandClass;

                if (TargetCommand.prototype instanceof Command && TargetCommand.decorated) {
                    entryPaths.push(entryPath);
                    break;
                } else if (entryPaths.length === 0) {
                    entryPaths.push(entryPath);
                }
            }
        }

        targetPath = entryPaths.pop() as string;

        outer:
        for (let i = argsIndex; i < argv.length; i++) {
            let possibleCommandName = argv[i];

            if (!COMMAND_NAME_REGEX.test(possibleCommandName)) {
                break;
            }

            let subcommands = await CLI.getSubcommandDescriptors(searchPaths);

            if (subcommands && subcommands.length) {
                let metadata = new Map<string, SubcommandDescriptor>();

                for (let subcommand of subcommands) {
                    // 这里主要考虑多目录处理情况, 因为目标顺序是从 roots列表的反序， 所以
                    // 这里加限制 不给后者覆盖
                    if (metadata.has(subcommand.name)) {
                        continue;
                    }

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
                } else {
                    let descriptor = metadata.get(possibleCommandName);

                    if (descriptor.hidden) {
                        possibleUnknownCommandName = possibleCommandName;
                        break;
                    }

                    // If `possibleCommandName` is an alias.
                    if (descriptor.name !== possibleCommandName) {
                        possibleCommandName = descriptor.name;
                    }
                    
                    if (descriptor.filename) {
                        targetPath = Path.join(descriptor.dir as string, descriptor.filename);
                        argsIndex = i + 1;
                        sequence.push(possibleCommandName);
                        continue outer;
                    }

                    // 已经确定只需要搜索一个目标目录
                    searchPaths = [descriptor.dir as string];
                }
            }

            let possiblePaths: string[] = [];
            
            searchPaths = searchPaths.map(searchPath => {
                let path = Path.join(searchPath, possibleCommandName);

                // 找可能的 CommandModule/CommandClass 文件位置
                possiblePaths.push(Path.join(path, 'default.js'));
                possiblePaths.push(path + '.js');
                possiblePaths.push(path);
                return path;
            });
            
            for (let possiblePath of possiblePaths) {
                if (await safeStat(possiblePath)) {
                    targetPath = possiblePath;
                    argsIndex = i + 1;
                    sequence.push(possibleCommandName);
                    
                    // 因为 searchPaths 可能是多位置情况 所以这里要修正下
                    if (Path.extname(possiblePath) != '.js') {
                        searchPaths = [possiblePath];
                    } else if (Path.basename(possiblePath) === 'default.js') {
                        searchPaths = [Path.dirname(possiblePath)];   
                    } else {
                        searchPaths = [
                            Path.join(Path.dirname(possiblePath), 
                            Path.basename(possiblePath, '.js'))
                        ];
                    }

                    continue outer;
                }
            }

            possibleUnknownCommandName = possibleCommandName;
            
            if (!v.some(searchPaths, searchPath => !!safeStat(searchPath))) {
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

    async getHelp(printHeadingDescription: boolean = false): Promise<HelpInfo> {
        let description: string | undefined;

        if (printHeadingDescription) {
            description = await this.getHelpDescription();
        }

        return await HelpInfo.build({
            dir: this.roots,
            description
        });
    }

    async getHelpDescription() {
        // 找到roots里 第一个 实现了 description
        for (let root of this.roots.slice().reverse()) {
            let entryPath = Path.join(root.dir, 'default.js');

            if (!await safeStat(entryPath)) {
                continue;
            }

            let module = require(entryPath);
            let CommandClass = (module.default || module) as CommandModule;
            let description = CommandClass && (CommandClass.brief || CommandClass.description);

            if (description) {
                return description;
            }
        }

        return undefined;
    }

    // 用来临时缓存 目录里subcommand 定义的结构，为什么加这个呢？ 主要还是处理多目录获取子命
    // 令列表的情况, 因为 子命令的列表可能是 default.js 里定义好的，也可能是 直接使用文件系
    // 统结构, 所以 为了处理方便 整合到一起了
    private static commandModuleSubcommandsCacheMap = new Map<string, SubcommandDescriptor[]>();

    /** @internal */
    static async getSubcommandDescriptors(dirs: string | string[], scanDir: boolean = false): Promise<SubcommandDescriptor[] | undefined> {
        let subcommands: SubcommandDescriptor[] = [];
        let targetDirs: string[];

        if (typeof dirs === 'string') {
            targetDirs = [dirs];
        } else {
            targetDirs = dirs;
        }
        
        await v.each(targetDirs, async dir => {
            let targetSubcommands: SubcommandDescriptor[];
            let path = Path.join(dir, 'default.js');
            let commandModule: CommandModule;
            
            // 先从缓存里取
            targetSubcommands = CLI.commandModuleSubcommandsCacheMap.get(dir);

            // 如果缓存没有找到结果，则从提供的 targetDir/default.js 里找被定义的 subcommands
            if (!targetSubcommands && await safeStat(path)) {
                commandModule = require(path) as CommandModule;

                if (commandModule.subcommands && commandModule.subcommands.length) {
                    targetSubcommands = commandModule.subcommands;

                    // 解决 dir的设置
                    for (let targetSubcommand of targetSubcommands) {
                        if (targetSubcommand.dir) {
                            targetSubcommand.dir = Path.resolve(dir, targetSubcommand.dir);
                        } else {
                            targetSubcommand.dir = dir;
                        }
                    }
                }
            }
            
            // 如果没有定义 default.js 或 需要的结构, 并且允许扫描目录， 
            // 则会遍历目标目录文件结构 来获取可能的 结果
            // 如果default.js 定义了subcommands，但是列表为空 并不会进行目标扫描
            if (!targetSubcommands && scanDir && await safeStat(dir)) {
                let fileNames = await v.call<string[]>(FS.readdir, dir);
                targetSubcommands = [];

                await v.each(fileNames, async fileName => {
                    if (fileName == 'default.js') {
                        return;
                    }

                    let path = Path.join(dir, fileName);
                    let name = fileName;
                    let stats = await safeStat(path);

                    if (!stats) {
                        return;
                    }
                    
                    if (stats.isFile()) {
                        if (Path.extname(path) !== '.js') {
                            return;
                        }

                        name = Path.basename(name, '.js');
                    } else {
                        path = Path.join(path, 'default.js');
                        stats = await safeStat(path);

                        // 找与目录同名的子文件
                        if (!stats) {
                            path = Path.join(path, fileName + '.js');
                            stats = await safeStat(path);
                        }
                    }

                    if (!stats) {
                        return;
                    }

                    let brief: string | undefined;

                    if (stats) {
                        let module = require(path);
                        let CommandClass = (module.default || module) as CommandModule;
                        brief = CommandClass && (CommandClass.brief || CommandClass.description);
                    }

                    targetSubcommands.push({
                        name,
                        brief,
                        dir
                    });
                });
            }

            // 完全没有结果
            if (!targetSubcommands || !targetSubcommands.length) {
                // 缓存
                CLI.commandModuleSubcommandsCacheMap.set(dir, []);
                return;
            }

            // merge
            subcommands.push(...targetSubcommands);
            // 缓存
            CLI.commandModuleSubcommandsCacheMap.set(dir, targetSubcommands);
        });
        
        return subcommands;
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

    async parse(sequence: string[], args: string[], cwd: string): Promise<ParsedArgs | undefined> {
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
                        await castArgument(defaultValue, name, type, validators) :
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
                    await consumeToggleOrOption(arg.substr(2));
                } else {
                    await consumeFlags(arg.substr(1))
                }
            } else if (pendingParamDefinitions.length) {
                let definition = pendingParamDefinitions.shift() as ParamDefinition<any>;
                let casted = await castArgument(arg, definition.name, definition.type, definition.validators);
                commandArgs.push(casted);
            } else if (paramsDefinition) {
                let casted = await castArgument(arg, paramsDefinition.name, paramsDefinition.type, paramsDefinition.validators);
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
                await castArgument(defaultValue, definition.name, definition.type, definition.validators) :
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

        async function consumeFlags(flags: string): Promise<void> {
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

                    await consumeOption(definition);
                }
            }
        }

        async function consumeToggleOrOption(name: string): Promise<void> {
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
                await consumeOption(definition);
            }
        }

        async function consumeOption(definition: OptionDefinition<any>): Promise<void> {
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

            commandOptions![key] = await castArgument(arg, name, type, validators);
        }

        // TODO: support casting provider object.
        async function castArgument(arg: string, name: string, type: Clime.Constructor<any>, validators: GeneralValidator<any>[]): Promise<any> {
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
                        value = await type.cast(arg, context)
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
