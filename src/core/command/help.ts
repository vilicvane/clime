import * as Path from 'path';
import * as FS from 'fs';

import * as Chalk from 'chalk';
import * as v from 'villa';

import {
    Command,
    CommandClass
} from './';

import {
    Printable
} from '../object';

import {
    CLI,
    CommandModule,
    SubcommandDescriptor
} from '../cli';

import {
    TableRow,
    buildTableOutput,
    TABLE_CAPTION_FLAG,
    indent,
    safeStat
} from '../../util';

export interface HelpInfoBuildClassOptions {
    TargetCommand: typeof Command;
}

export interface HelpInfoBuildPathOptions {
    dir: string;
    description?: string;
}

export type HelpInfoBuildOptions = HelpInfoBuildClassOptions | HelpInfoBuildPathOptions;


const SUBCOMMAND_CAPTION = Chalk.green('SUBCOMMANDS');

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
            await info.buildTextForSubCommands([{ dir : options.dir, title: SUBCOMMAND_CAPTION }]);
        } else {
            let TargetCommand = options.TargetCommand;

            info.buildDescription(TargetCommand.description);
            info.buildTextsForParamsAndOptions(TargetCommand);

            let dir = Path.dirname(TargetCommand.path);

            if (Path.basename(TargetCommand.path) !== 'default.js') {
                dir = Path.join(dir, Path.basename(TargetCommand.path, '.js'));
            }

            await info.buildTextForSubCommands([{ dir: dir, title: SUBCOMMAND_CAPTION }]);
        }

        return info;
    }

    static async buildMulti(name: string, targets: { dir: string, title?: string }[]) {
        let info = new HelpInfo();

        // 获取最先定义的 description
        for (let i = 0, l = targets.length; i < l; i++) {
            let target = targets[i];
            let entryPath = Path.join(target.dir, 'default.js');
            let stats = await safeStat(entryPath);

            if (!stats) {
                continue;
            }

            let module = require(entryPath);

            if (typeof module.description == 'string') {
                info.buildDescription(module.description);
                break;
            }

            let TargetCommand = (module.default || module) as CommandClass;
            if (TargetCommand.prototype instanceof Command && TargetCommand.decorated) {
                TargetCommand.path = entryPath;
                TargetCommand.sequence = [name];
                info.buildDescription(TargetCommand.description);
                info.buildTextsForParamsAndOptions(TargetCommand);
                break;
            }
        }

        if (!targets[0].title) {
            targets[0].title = SUBCOMMAND_CAPTION;
        }

        await info.buildTextForSubCommands(targets);

        return info;
    }

    private buildDescription(description: string | undefined): void {
        if (description) {
            this.texts.push(`${indent(description)}\n`);
        }
    }

    private buildTextsForParamsAndOptions(TargetCommand: typeof Command): void {
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

    async buildTextForSubCommands(targets: { dir: string; title?: string }[]): Promise<void> {
        let rows: TableRow[] = [];
        let subcommandMap: Map<string, boolean> = new Map();

        await v.each(targets, async (target, index) => {
            let subCommandTableRows = await HelpInfo.getSubCommandTabbleRows(target.dir);

            // 只有有 subcommands 的才显示
            if (subCommandTableRows.length > 0) {
                if (target.title) {
                    rows.push([TABLE_CAPTION_FLAG, `  ${Chalk.green(target.title)}`]);
                }

                rows.push(...subCommandTableRows);
            }
        });
        

        if (rows.length) {
            // 处理同名子命令的筛选
            for (let i = rows.length - 1; i >= 0; i--) {
                let row = rows[i];
                let subcommandName = row[0] as string;

                if (row[0] == TABLE_CAPTION_FLAG) {
                    continue;
                }

                if (subcommandMap.has(subcommandName)) {
                    rows.splice(i, 1);
                    continue;
                }

                subcommandMap.set(subcommandName, true);
                rows[i].splice(0, 1);
            }

            this.texts.push(buildTableOutput(rows, { indent: 4, spaces: ' - ' }));
        }
    }
    
    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        stderr.write(`\n${this.text}\n`);
    }

    private static async getSubCommandTabbleRows(dir: string): Promise<TableRow[]> {
        let rows: TableRow[];
        let subcommands = await CLI.getSubcommandDescriptors(dir);
        
        if (subcommands) {
            rows = subcommands.map(subcommand => {
                let aliases = subcommand.aliases || subcommand.alias && [subcommand.alias];
                let subcommandNamesStr = Chalk.bold(subcommand.name);

                if (aliases) {
                    subcommandNamesStr += ` [${Chalk.dim(aliases.join(','))}]`;
                }

                return [
                    subcommand.name,
                    subcommandNamesStr,
                    subcommand.brief
                ];
            });
        } else {
            let stats = await safeStat(dir);

            if (!stats || !stats.isDirectory()) {
                return [];
            }

            let names = await v.call<string[]>(FS.readdir, dir);
            let unfilteredRows = await v.map(names, async name => {
                let path = Path.join(dir, name);
                let stats = await safeStat(path);

                if (!stats) {
                    return undefined;
                }

                if (stats.isFile()) {
                    if (name === 'default.js' || Path.extname(path) !== '.js') {
                        return undefined;
                    }

                    name = Path.basename(name, '.js');
                } else {
                    path = Path.join(path, 'default.js');
                    stats = await safeStat(path);
                }

                let description: string | undefined;

                if (stats) {
                    let module = require(path);
                    let CommandClass = (module.default || module) as CommandModule;
                    description = CommandClass && (CommandClass.brief || CommandClass.description);
                }

                return [
                    name,
                    Chalk.bold(name),
                    description
                ] as TableRow;
            });

            rows = unfilteredRows.filter(row => !!row) as TableRow[];
        }

        return rows;
    }
}

function isHelpInfoBuildPathOptions(options: HelpInfoBuildOptions): options is HelpInfoBuildPathOptions {
    return 'dir' in options;
}
