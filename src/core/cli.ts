import * as FS from 'fs';
import * as Path from 'path';

import * as v from 'villa';

import {
  Command,
  CommandClass,
  Context,
  GeneralValidator,
  HelpInfo,
  OptionDefinition,
  ParamDefinition,
  ParamsDefinition,
} from './command';

import {
  Printable,
  isStringCastable,
} from './object';

import { ExpectedError } from './error';

import {
  existsDir,
  existsFile,
  findPaths,
  joinPaths,
  safeStat,
} from '../util';

const COMMAND_NAME_REGEX = /^[\w\d]+(?:-[\w\d]+)*$/;
const HELP_OPTION_REGEX = /^(?:-[h?]|--help)$/;

export interface CommandRoot {
  label: string;
  path: string;
}

export type GeneralCommandRoot = string | CommandRoot;

export interface CommandModule {
  brief?: string;
  description?: string;
  subcommands?: SubcommandDefinition[];
}

export interface SubcommandDefinition {
  name: string;
  filename?: string;
  alias?: string;
  aliases?: string[];
  brief?: string;
}

export interface SubcommandSearchBaseResult {
  name: string;
  path: string | undefined;
  searchBase: string | undefined;
}

export interface SubcommandSearchInProgressContext extends SubcommandSearchBaseResult {
  label: string;
}

export interface SubcommandSearchContext extends SubcommandSearchInProgressContext {
  searchBase: string;
}

interface PreProcessResult {
  sequence: string[];
  args: string[];
  path: string | undefined;
  searchContexts: SubcommandSearchContext[];
  possibleUnknownCommandName: string | undefined;
}

/**
 * Clime command line interface.
 */
export class CLI {
  roots: CommandRoot[];

  constructor(
    /** Command entry name. */
    public name: string,
    /** Root directory of command modules. */
    roots: GeneralCommandRoot | GeneralCommandRoot[],
  ) {
    roots = Array.isArray(roots) ? roots : [roots];
    this.roots = roots.map(root => {
      let label: string | undefined;
      let path: string;

      if (typeof root === 'string') {
        path = root;
      } else {
        label = root.label;
        path = root.path;
      }

      return {
        label: label || 'Subcommands',
        path: Path.resolve(path),
      };
    });
  }

  async execute(argv: string[], cwd = process.cwd()): Promise<any> {
    let {
      sequence,
      args,
      path,
      searchContexts,
      possibleUnknownCommandName,
    } = await this.preProcessArguments(argv);

    let description: string | undefined;

    if (path) {
      let module = require(path);
      let TargetCommand = (module.default || module) as CommandClass;

      if (TargetCommand.prototype instanceof Command) {
        // This is a command module with an actual command.

        if (!TargetCommand.decorated) {
          throw new TypeError(`Command defined in module "${path}" does not seem to be initialized, \
make sure to decorate it with \`@command()\``);
        }

        TargetCommand.path = path;
        TargetCommand.helpBuildingContexts = searchContexts.map(context => {
          return {
            label: context.label,
            dir: context.searchBase,
          };
        });
        TargetCommand.sequence = sequence;

        let argsParser = new ArgsParser(TargetCommand);
        let parsedArgs = await argsParser.parse(sequence, args, cwd);

        if (!parsedArgs) {
          return await HelpInfo.build(TargetCommand);
        }

        let command = new TargetCommand();

        let {
          args: commandArgs,
          extraArgs: commandExtraArgs,
          options: commandOptions,
          context,
        } = parsedArgs;

        return await this.executeCommand(
          command,
          commandArgs,
          commandExtraArgs,
          commandOptions,
          context,
        );
      } else if (Path.basename(path) === 'default.js') {
        // This is a command module with only description and
        // subcommands information.
        description = TargetCommand.description;
      } else {
        throw new TypeError(`Module "${path}" is expected to be a command`);
      }
    }

    let helpInfo = await HelpInfo.build({
      sequence,
      contexts: searchContexts.map(context => {
        return {
          label: context.label,
          dir: context.searchBase,
        };
      }),
      description,
    });

    if (possibleUnknownCommandName) {
      throw new UsageError(`Unknown subcommand "${possibleUnknownCommandName}"`, {
        getHelp() {
          return helpInfo;
        },
      });
    }

    if (args.length && HELP_OPTION_REGEX.test(args[0])) {
      return helpInfo;
    } else {
      throw helpInfo;
    }
  }

  async getHelp(): Promise<HelpInfo> {
    return await HelpInfo.build({
      sequence: [this.name],
      contexts: this.roots.map(root => {
        return {
          label: root.label,
          dir: root.path,
        };
      }),
    });
  }

  private async preProcessSearchBase(searchBase: string, possibleCommandName: string, aliasMap: Map<string, string>):
    Promise<SubcommandSearchBaseResult> {
    let definitions = await CLI.getSubcommandDefinitions(searchBase);
    let definitionMap = new Map<string, SubcommandDefinition>();

    for (let definition of definitions) {
      definitionMap.set(definition.name, definition);

      let aliases = definition.aliases || definition.alias && [definition.alias];

      if (!aliases) {
        continue;
      }

      for (let alias of aliases) {
        if (!aliasMap.has(alias)) {
          aliasMap.set(alias, definition.name);
        }

        let targetName = aliasMap.get(alias);
        if (targetName !== definition.name) {
          throw new Error(`Alias "${alias}" already exists and points to "${targetName}" \
instead of "${definition.name}"`);
        }
      }
    }

    possibleCommandName = definitionMap.has(possibleCommandName) ?
      possibleCommandName : aliasMap.get(possibleCommandName) || possibleCommandName;

    let targetPath: string | undefined;

    let targetDefinition = definitionMap.get(possibleCommandName);
    searchBase = Path.join(searchBase, possibleCommandName);

    if (targetDefinition && targetDefinition.filename) {
      targetPath = Path.resolve(searchBase, targetDefinition.filename);
    } else {
      targetPath = await CLI.findPathBySearchBase(searchBase) || targetPath;
    }

    return {
      name: possibleCommandName,
      path: targetPath,
      searchBase: existsDir(searchBase) ? searchBase : undefined,
    };
  }

  /**
   * Mapping the command line arguments to a specific command file.
   */
  private async preProcessArguments(argv: string[]): Promise<PreProcessResult> {
    let sequence = [this.name];

    let possibleUnknownCommandName: string | undefined;
    let aliases: string[] | undefined;

    let argsIndex = 0;

    let targetPath: string | undefined;

    let contexts: SubcommandSearchContext[] = await v.map(this.roots, async root => {
      let candidatePath: string | undefined = Path.join(root.path, 'default.js');
      candidatePath = await existsFile(candidatePath) ? candidatePath : undefined;

      if (candidatePath) {
        targetPath = candidatePath;
      }

      return {
        label: root.label,
        name: this.name,
        path: candidatePath,
        searchBase: root.path,
      };
    });

    for (let i = argsIndex; i < argv.length && contexts.length; i++) {
      let possibleCommandName = argv[i];

      if (!COMMAND_NAME_REGEX.test(possibleCommandName)) {
        break;
      }

      let aliasMap = new Map<string, string>();

      let nextContexts: SubcommandSearchInProgressContext[] = await v.map(contexts, async context => {
        let searchBaseContext = await this.preProcessSearchBase(context.searchBase, possibleCommandName, aliasMap);
        return {
          label: context.label,
          ...searchBaseContext,
        };
      });

      let targetContexts = nextContexts.filter(context => !!context.path);

      if (!targetContexts.length) {
        possibleUnknownCommandName = possibleCommandName;
        break;
      }

      let targetContext = targetContexts[targetContexts.length - 1];

      targetPath = targetContext.path;
      possibleCommandName = targetContext.name;

      argsIndex = i + 1;
      sequence.push(possibleCommandName);

      contexts = nextContexts.filter(context => !!context.searchBase) as SubcommandSearchContext[];
    }

    return {
      sequence,
      args: argv.slice(argsIndex),
      path: targetPath,
      searchContexts: contexts,
      possibleUnknownCommandName,
    };
  }

  private executeCommand(
    command: Command,
    commandArgs: string[],
    commandExtraArgs: string[] | undefined,
    commandOptions: Clime.Dictionary<any> | undefined,
    context: Context | undefined,
  ): any {
    let executeMethodArgs: any[] = commandArgs.concat();

    if (commandExtraArgs) {
      executeMethodArgs.push(commandExtraArgs);
    }

    if (commandOptions) {
      executeMethodArgs.push(commandOptions);
    }

    if (context) {
      executeMethodArgs.push(context);
    }

    return command.execute(...executeMethodArgs);
  }

  /**
   * @internal
   * Get subcommands definition written as `export subcommands = [...]`.
   */
  static async getSubcommandDefinitions(searchBase: string): Promise<SubcommandDefinition[]> {
    let path = await this.findPathBySearchBase(searchBase);

    if (!path) {
      return [];
    }

    return (require(path) as CommandModule).subcommands || [];
  }

  private static async findPathBySearchBase(searchBase: string): Promise<string | undefined> {
      let possiblePaths = [
        `${searchBase}.js`,
        Path.join(searchBase, 'default.js'),
      ];

      for (let possiblePath of possiblePaths) {
        if (await existsFile(possiblePath)) {
          return possiblePath;
        }
      }

      return undefined;
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
          flag,
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
      commands: sequence,
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
          default: defaultValue,
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
          await consumeFlags(arg.substr(1));
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
          this.helpProvider,
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

    let missingOptionNames = requiredOptionSet && Array.from(requiredOptionSet);

    if (missingOptionNames && missingOptionNames.length) {
      throw new UsageError(`Missing required option(s) \`${missingOptionNames.join('`, `')}\``, this.helpProvider);
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
      throw new UsageError(
        `Expecting at least one element for variadic parameters \`${paramsDefinition.name}\``,
        this.helpProvider,
      );
    }

    return {
      args: commandArgs,
      extraArgs: paramsDefinition && commandExtraArgs,
      options: commandOptions,
      context: this.contextConstructor ? context : undefined,
    };

    async function consumeFlags(flags: string): Promise<void> {
      for (let i = 0; i < flags.length; i++) {
        let flag = flags[i];

        if (!optionFlagMapping.has(flag)) {
          throw new UsageError(`Unknown option flag "${flag}"`, that.helpProvider);
        }

        let name = optionFlagMapping.get(flag)!;
        let definition = optionDefinitionMap.get(name)!;

        if (definition.required) {
          requiredOptionSet!.delete(name);
        }

        if (definition.toggle) {
          commandOptions![definition.key] = true;
        } else {
          if (i !== flags.length - 1) {
            throw new UsageError(
              'Only the last flag in a sequence can refer to an option instead of a toggle',
              that.helpProvider,
            );
          }

          await consumeOption(definition);
        }
      }
    }

    async function consumeToggleOrOption(name: string): Promise<void> {
      if (!optionDefinitionMap.has(name)) {
        throw new UsageError(`Unknown option \`${name}\``, that.helpProvider);
      }

      let definition = optionDefinitionMap.get(name)!;

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
        validators,
      } = definition;

      let arg = args.shift();

      if (arg === undefined) {
        throw new UsageError(`Expecting value for option \`${name}\``, that.helpProvider);
      }

      if (arg[0] === '-') {
        throw new UsageError(
          `Expecting a value instead of an option or toggle "${arg}" for option \`${name}\``,
          that.helpProvider,
        );
      }

      commandOptions![key] = await castArgument(arg, name, type, validators);
    }

    // TODO: support casting provider object.
    async function castArgument(
      arg: string,
      name: string,
      type: Clime.Constructor<any>,
      validators: GeneralValidator<any>[],
    ): Promise<any> {
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
            value = await type.cast(arg, context);
          } else {
            throw new Error(`Type \`${(<any>type).name || type}\` cannot be casted from a string, \
see \`StringCastable\` interface for more information`);
          }

          break;
      }

      for (let validator of validators) {
        if (validator instanceof RegExp) {
          if (!validator.test(value)) {
            throw new ExpectedError(`Invalid value for "${name}"`);
          }
        } else if (typeof validator === 'function') {
          validator(arg, name);
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
    public helpProvider: HelpProvider,
  ) {
    super(message);
  }

  async print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): Promise<void> {
    super.print(stdout, stderr);

    let help = await this.helpProvider.getHelp();
    help.print(stdout, stderr);
  }
}
