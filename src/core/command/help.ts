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
    RootInfo,
    CommandModule,
    SubcommandDescriptor
} from '../cli';

import {
    TableRow,
    TableCaption,
    buildTableOutput,
    indent,
    safeStat
} from '../../util';

export interface HelpInfoBuildClassOptions {
    TargetCommand: typeof Command;
    subcommandHelpInfo?: HelpInfo;
}

export interface HelpInfoBuildPathOptions {
    dir: string | string[] | RootInfo[];
    description?: string;
}

export type HelpInfoBuildOptions = HelpInfoBuildClassOptions | HelpInfoBuildPathOptions;

export class HelpInfo implements Printable {
    private texts: string[] = [];

    constructor() { }

    get text(): string {
        return this.texts.join('\n');
    }

    /** @internal */
    static async build(options: HelpInfoBuildOptions): Promise<HelpInfo> {
        let info = new HelpInfo();

        if (isHelpInfoBuildPathOptions(options)) {
            info.buildDescription(options.description);
            await info.buildTextForSubCommands(options.dir);
        } else {
            let TargetCommand = options.TargetCommand;

            info.buildDescription(TargetCommand.description);
            info.buildTextsForParamsAndOptions(TargetCommand);

            let dir = Path.dirname(TargetCommand.path);

            if (Path.basename(TargetCommand.path) !== 'default.js') {
                dir = Path.join(dir, Path.basename(TargetCommand.path, '.js'));
            }

            if (options.subcommandHelpInfo) {
                info.texts.push(options.subcommandHelpInfo.text);
            } else {
                await info.buildTextForSubCommands(dir);
            }
        }

        return info;
    }

    buildDescription(description: string | undefined): void {
        if (description) {
            this.texts.push(`${indent(description)}\n`);
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

    async buildTextForSubCommands(dir: string | string[] | RootInfo[]): Promise<void> {
        let dirs: string[];
        let rootTitleMapping = new Map<string, string>();

        if (typeof dir === 'string') {
            dirs = [dir];
        } else if (isRootInfos(dir)) {
            dirs = dir.map(rootInfo => {
                if (rootInfo.title) {
                    rootTitleMapping.set(rootInfo.dir, rootInfo.title);
                }
                return rootInfo.dir;
            });
        } else {
            dirs = dir;
        }

        let rows: TableRow[];
        let unFilterRows: TableRow[] = [];
        let subcommands = await CLI.getSubcommandDescriptors(dirs, true);
        let subcommandRowIndexMapping = new Map<string, number>();
        let removeRowIndexMapping = new Map<number, boolean>();

        if (subcommands && subcommands.length) {
            let groupDir: string;
            let groupTitle: string;

            if (rootTitleMapping.has(dirs[0])) {
                groupDir = dirs[0];
                groupTitle = rootTitleMapping.get(groupDir) || '';
            } else {
                groupTitle = 'SUBCOMMANDS';
            }

            unFilterRows.push(new TableCaption(`  ${Chalk.green(groupTitle)}`));

            subcommands.forEach(subcommand => {
                let dir = subcommand.dir;
                let aliases = subcommand.aliases || subcommand.alias && [subcommand.alias];
                let subcommandNamesStr = Chalk.bold(subcommand.name);

                if (aliases) {
                    subcommandNamesStr += ` [${Chalk.dim(aliases.join(','))}]`;
                }
                
                if (dir && dir != groupDir && !subcommand.hidden && rootTitleMapping.has(dir)) {
                    groupDir = dir;
                    groupTitle = rootTitleMapping.get(dir) || '';
                    unFilterRows.push(new TableCaption(`\n  ${Chalk.green(groupTitle)}`));
                }

                // 标记 需要删除列表中 重复项目索引
                if (subcommandRowIndexMapping.has(subcommand.name)) {
                    let index = subcommandRowIndexMapping.get(subcommand.name);
                    if (index !== undefined) {
                        removeRowIndexMapping.set(index, true);
                    }
                }

                if (subcommand.hidden) {
                    return;
                }

                subcommandRowIndexMapping.set(subcommand.name, unFilterRows.length);
                unFilterRows.push([
                    subcommandNamesStr,
                    subcommand.brief
                ]);
            });
        }

        rows = unFilterRows
            .filter((row, index) => {
                return !removeRowIndexMapping.has(index);
            })
            .filter((row, index, array) => {
                if (row instanceof TableCaption) {
                    if (index + 1 === array.length || array[index + 1] instanceof TableCaption) {
                        return false;
                    }
                }

                return true;
            });

        if (rows.length) {
            this.texts.push(buildTableOutput(rows, { indent: 4, spaces: ' - ' }));
        }
    }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        stderr.write(`\n${this.text}\n`);
    }
}

function isHelpInfoBuildPathOptions(options: HelpInfoBuildOptions): options is HelpInfoBuildPathOptions {
    return 'dir' in options;
}

function isRootInfos(roots: string[] | RootInfo[]): roots is RootInfo[] {
    return roots.length > 0 && typeof roots[0] !== 'string';
}