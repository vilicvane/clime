import * as Path from 'path';
import * as FS from 'fs';

import * as Chalk from 'chalk';
import * as v from 'villa';

import {
    Command
} from './';

import {
    Printable
} from '../object';

import {
    CLI,
    CommandModule,
    SubcommandDefinition,
    SubcommandSearchContext
} from '../cli';

import {
    TableRow,
    TableCaption,
    buildTableOutput,
    deduplicate,
    existsDir,
    findPaths,
    indent,
    safeStat
} from '../../util';

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

    constructor() { }

    get text(): string {
        return this.texts.join('\n');
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

    buildDescription(description: string | undefined): void {
        if (description) {
            this.texts.push(`${indent(description)}\n`);
        }
    }

    buildSubcommandsUsage(sequence: string[]) {
        if (sequence && sequence.length) {
            this.texts.push(`${indent(Chalk.green('USAGE'))}\n`);
            this.texts.push(`${indent(Chalk.bold(sequence.join(' ')), 4)} <subcommand>\n`);
        }
    }

    buildTextsForParamsAndOptions(TargetCommand: typeof Command): void {
        let paramDefinitions = TargetCommand.paramDefinitions;
        let paramsDefinition = TargetCommand.paramsDefinition;

        let parameterDescriptionRows: string[][] = [];
        let parameterUsageTexts: string[] = [];

        if (paramDefinitions) {
            parameterUsageTexts = paramDefinitions.map(definition => {
                let {
                    name,
                    required,
                    description,
                    default: defaultValue
                } = definition;

                if (description) {
                    parameterDescriptionRows.push([
                        Chalk.bold(name),
                        description
                    ]);
                }

                return required ?
                    `<${name}>` :
                    `[${name}${defaultValue !== undefined ? '=' + defaultValue : ''}]`;
            });
        } else {
            parameterUsageTexts = [];
        }

        if (paramsDefinition) {
            let {
                name,
                required,
                description
            } = paramsDefinition;

            if (description) {
                parameterDescriptionRows.push([
                    Chalk.bold(name),
                    description
                ]);
            }

            parameterUsageTexts.push(
                required ?
                    `<...${name}>` :
                    `[...${name}]`
            );
        }

        let optionDefinitions = TargetCommand.optionDefinitions || [];
        let requiredOptionUsageItems = optionDefinitions
            .filter(definition => definition.required)
            .map(({ name, placeholder }) => `--${name} <${placeholder || name}>`);

        let usageLine = [
            Chalk.bold(TargetCommand.sequence.join(' ')),
            ...parameterUsageTexts,
            ...requiredOptionUsageItems
        ].join(' ');

        if (optionDefinitions.length > requiredOptionUsageItems.length) {
            usageLine += ' [...options]';
        }

        let usageContent = `\
  ${Chalk.green('USAGE')}\n
    ${usageLine}\n`;

        this.texts.push(usageContent);

        if (parameterDescriptionRows.length) {
            let paramsContent = `\
  ${Chalk.green('PARAMETERS')}\n
${buildTableOutput(parameterDescriptionRows, { indent: 4, spaces: ' - '})}`;

            this.texts.push(paramsContent);
        }

        if (optionDefinitions.length) {
            let optionRows = optionDefinitions
                .map(definition => {
                    let {
                        name,
                        key,
                        flag,
                        placeholder,
                        toggle: isToggle,
                        description
                    } = definition;

                    let triggerStr = flag ? `-${flag}, ` : '';

                    triggerStr += `--${name}`;

                    if (!isToggle) {
                        triggerStr += ` <${placeholder || key}>`;
                    }

                    return [
                        Chalk.bold(triggerStr),
                        description
                    ];
                });

            this.texts.push(`\
  ${Chalk.green('OPTIONS')}\n
${buildTableOutput(optionRows, { indent: 4, spaces: ' - ' })}`
            );
        }
    }

    async buildTextForSubCommands(contexts: HelpBuildingContext[]): Promise<void> {
        let labels: string[] = [];
        let labelToHelpItemsMap = new Map<string, SubcommandHelpItem[]>();
        let helpItemMap = new Map<string, SubcommandHelpItem>();

        for (let [groupIndex, { label, dir }] of contexts.entries()) {
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
                let { name, brief } = definition;
                let aliases = definition.aliases || definition.alias && [definition.alias] || [];

                let item: SubcommandHelpItem;
                let existingItem = helpItemMap.get(name);

                if (existingItem) {
                    existingItem.overridden = true;

                    item = {
                        name,
                        brief: brief || existingItem.brief,
                        aliases: existingItem.aliases.concat(aliases),
                        group: groupIndex
                    };
                } else {
                    item = {
                        name,
                        brief: brief,
                        aliases,
                        group: groupIndex
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

                if (!stats) {
                    continue;
                }

                if (stats.isFile()) {
                    if (name === 'default.js' || Path.extname(path) !== '.js') {
                        continue;
                    }

                    name = Path.basename(name, '.js');
                } else {
                    path = Path.join(path, 'default.js');
                    stats = await safeStat(path);
                }

                let existingItem = helpItemMap.get(name);

                // `brief` already set in `subcommands` field
                if (existingItem && existingItem.group === groupIndex && existingItem.brief) {
                    continue;
                }

                let brief: string | undefined;

                if (stats) {
                    let module = require(path);
                    let CommandClass = (module.default || module) as CommandModule;
                    brief = CommandClass && (CommandClass.brief || CommandClass.description);
                }

                if (existingItem && existingItem.group === groupIndex) {
                    existingItem.brief = brief;
                } else {
                    let aliases: string[];

                    if (existingItem) {
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
                        group: groupIndex
                    };

                    helpItems.push(item);
                    helpItemMap.set(name, item);
                }
            }
        }

        for (let label of labels) {
            let rows = labelToHelpItemsMap
                .get(label)!
                .filter(item => !item.overridden)
                .map(({ name, aliases, brief }) => {
                    let subcommandNamesStr = Chalk.bold(name);
                    if (aliases.length) {
                        subcommandNamesStr += ` [${Chalk.dim(aliases.join(','))}]`;
                    }
                    return [subcommandNamesStr, brief];
                });

            if (rows.length) {
                this.texts.push(`\
  ${Chalk.green(label.toUpperCase())}\n
${buildTableOutput(rows, { indent: 4, spaces: ' - ' })}`);
            }
        }
    }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        stderr.write(`\n${this.text}\n`);
    }
}

function isHelpInfoBuildPathOptions(options: HelpInfoBuildOptions): options is HelpInfoBuildPathOptions {
    return 'dirs' in options;
}