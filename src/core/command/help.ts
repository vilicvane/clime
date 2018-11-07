import * as FS from 'fs';
import * as Path from 'path';

import * as Chalk from 'chalk';
import * as v from 'villa';

import {Command, CommandClass} from '.';

import {Printable} from '../object';

import {CLI, CommandModule} from '../cli';

import {
  buildTableOutput,
  existsDir,
  indent,
  safeStat,
} from '../../internal-util';

export interface HelpBuildingContext {
  label: string;
  dir: string;
}

export interface HelpInfoBuildPathOptions {
  sequence: string[];
  contexts: HelpBuildingContext[];
  description?: string;
}

export type HelpInfoBuildOptions = typeof Command | HelpInfoBuildPathOptions;

export interface SubcommandHelpItem {
  name: string;
  aliases: string[];
  brief: string | undefined;
  group: number;
  overridden?: boolean;
}

export class HelpInfo implements Printable {
  private texts: string[] = [];

  get text(): string {
    return this.texts.join('\n');
  }

  async buildTextForSubCommands(
    contexts: HelpBuildingContext[],
  ): Promise<void> {
    let labels: string[] = [];
    let labelToHelpItemsMap = new Map<string, SubcommandHelpItem[]>();
    let helpItemMap = new Map<string, SubcommandHelpItem>();

    for (let [groupIndex, {label, dir}] of contexts.entries()) {
      let helpItems: SubcommandHelpItem[];

      if (labelToHelpItemsMap.has(label)) {
        helpItems = labelToHelpItemsMap.get(label)!;
      } else {
        helpItems = [];
        labelToHelpItemsMap.set(label, helpItems);
        labels.push(label);
      }

      let definitions = await CLI.getSubcommandDefinitions(dir);

      for (let definition of definitions) {
        let {name, brief} = definition;
        let aliases =
          definition.aliases || (definition.alias && [definition.alias]) || [];

        let item: SubcommandHelpItem;
        let existingItem = helpItemMap.get(name);

        if (existingItem) {
          existingItem.overridden = true;

          item = {
            name,
            brief: brief || existingItem.brief,
            aliases: existingItem.aliases.concat(aliases),
            group: groupIndex,
          };
        } else {
          item = {
            name,
            brief,
            aliases,
            group: groupIndex,
          };
        }

        helpItems.push(item);
        helpItemMap.set(name, item);
      }

      if (!await existsDir(dir)) {
        continue;
      }

      let names = await v.call<string[]>(FS.readdir, dir);

      for (let name of names) {
        let path = Path.join(dir, name);
        let stats = await safeStat(path);

        if (stats!.isFile()) {
          if (
            name === CLI.commandModuleDefaultFileName ||
            Path.extname(path) !== CLI.commandModuleExtension
          ) {
            continue;
          }

          name = Path.basename(name, CLI.commandModuleExtension);
        } else {
          path = Path.join(path, CLI.commandModuleDefaultFileName);
          stats = await safeStat(path);
        }

        let existingItem = helpItemMap.get(name);

        // `brief` already set in `subcommands` field
        if (
          existingItem &&
          existingItem.group === groupIndex &&
          existingItem.brief
        ) {
          continue;
        }

        let commandConstructor: CommandClass | undefined;
        let brief: string | undefined;

        if (stats) {
          let module = require(path) as CommandModule;
          commandConstructor = module.default;
          brief =
            commandConstructor &&
            (commandConstructor.brief || commandConstructor.description);
        }

        if (existingItem && existingItem.group === groupIndex) {
          existingItem.brief = brief;
        } else {
          let aliases: string[];

          if (existingItem) {
            if (!commandConstructor) {
              // Directory without an entry should not override existing one.
              continue;
            }

            existingItem.overridden = true;

            if (!brief) {
              brief = existingItem.brief;
            }

            aliases = existingItem.aliases;
          } else {
            aliases = [];
          }

          let item = {
            name,
            aliases,
            brief,
            group: groupIndex,
          };

          helpItems.push(item);
          helpItemMap.set(name, item);
        }
      }
    }

    for (let label of labels) {
      let hasAliases = false;
      let rows = labelToHelpItemsMap.get(label)!
        .filter(item => {
          if (item.overridden) {
            return false;
          }

          if (!hasAliases && item.aliases.length) {
            hasAliases = true;
          }

          return true;
        })
        .map(({name, aliases, brief}) => {
          if (hasAliases) {
            return [
              Chalk.bold(name),
              aliases.length ? `[${Chalk.dim(aliases.join(','))}]` : '',
              brief,
            ];
          } else {
            return [Chalk.bold(name), brief];
          }
        });

      let separators = hasAliases ? [' ', ' - '] : ' - ';

      if (rows.length) {
        this.texts.push(`\
  ${Chalk.green(label.toUpperCase())}\n
${buildTableOutput(rows, {indent: 4, separators})}`);
      }
    }
  }

  print(_stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
    stderr.write(`\n${this.text}\n`);
  }

  private buildDescription(description: string | undefined): void {
    if (description) {
      this.texts.push(`${indent(description, 2)}\n`);
    }
  }

  private buildSubcommandsUsage(sequence: string[]) {
    if (sequence && sequence.length) {
      this.texts.push(`\
  ${Chalk.green('USAGE')}\n
    ${Chalk.bold(sequence.join(' '))} <subcommand>\n`);
    }
  }

  private buildTextsForParamsAndOptions(TargetCommand: typeof Command): void {
    let paramDefinitions = TargetCommand.paramDefinitions;
    let paramsDefinition = TargetCommand.paramsDefinition;

    let parameterDescriptionRows: string[][] = [];
    let parameterUsageTexts: string[] = [];

    if (paramDefinitions) {
      parameterUsageTexts = paramDefinitions.map(definition => {
        let {name, required, description, default: defaultValue} = definition;

        if (description) {
          parameterDescriptionRows.push([Chalk.bold(name), description]);
        }

        return required
          ? `<${name}>`
          : `[${name}${defaultValue !== undefined ? `=${defaultValue}` : ''}]`;
      });
    } else {
      parameterUsageTexts = [];
    }

    if (paramsDefinition) {
      let {name, required, description} = paramsDefinition;

      if (description) {
        parameterDescriptionRows.push([Chalk.bold(name), description]);
      }

      parameterUsageTexts.push(required ? `<...${name}>` : `[...${name}]`);
    }

    let optionDefinitions = TargetCommand.optionDefinitions || [];
    let requiredOptionUsageItems = optionDefinitions
      .filter(definition => definition.required)
      .map(({name, key, placeholder}) => `--${name} <${placeholder || key}>`);

    let usageLine = [
      Chalk.bold(TargetCommand.sequence.join(' ').replace(/^\/ /, '/')),
      ...parameterUsageTexts,
      ...requiredOptionUsageItems,
    ].join(' ');

    if (optionDefinitions.length > requiredOptionUsageItems.length) {
      usageLine += ' [...options]';
    }

    this.texts.push(`\
  ${Chalk.green('USAGE')}\n
    ${usageLine}\n`);

    if (parameterDescriptionRows.length) {
      this.texts.push(`\
  ${Chalk.green('PARAMETERS')}\n
${buildTableOutput(parameterDescriptionRows, {indent: 4, separators: ' - '})}`);
    }

    if (optionDefinitions.length) {
      let optionRows = optionDefinitions.map(definition => {
        let {
          name,
          key,
          flag,
          placeholder,
          toggle: isToggle,
          description,
          default: defaultValue,
        } = definition;

        let triggerStr = flag ? `-${flag}, ` : '';

        triggerStr += `--${name}`;

        if (!isToggle) {
          triggerStr += ` <${placeholder || key}>`;
        }

        if (defaultValue !== undefined) {
          description = description
            ? `${description} [${defaultValue}]`
            : `[${defaultValue}]`;
        }

        return [Chalk.bold(triggerStr), description];
      });

      this.texts.push(`\
  ${Chalk.green('OPTIONS')}\n
${buildTableOutput(optionRows, {indent: 4, separators: ' - '})}`);
    }
  }

  /** @internal */
  static async build(options: HelpInfoBuildOptions): Promise<HelpInfo> {
    let info = new HelpInfo();

    if (typeof options === 'object') {
      info.buildDescription(options.description);
      info.buildSubcommandsUsage(options.sequence);

      await info.buildTextForSubCommands(options.contexts);
    } else {
      info.buildDescription(options.description);
      info.buildTextsForParamsAndOptions(options);

      await info.buildTextForSubCommands(options.helpBuildingContexts);
    }

    return info;
  }
}
