import * as Path from 'path';
import * as FS from 'fs';

import * as Chalk from 'chalk';

import {
    Command
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
    indent,
    invoke,
    safeStat
} from '../../utils';

export interface HelpInfoBuildClassOptions {
    TargetCommand: typeof Command;
}

export interface HelpInfoBuildPathOptions {
    dir: string;
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

            await info.buildTextForSubCommands(dir);
        }

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

    async buildTextForSubCommands(dir: string): Promise<void> {
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
                    subcommandNamesStr,
                    subcommand.brief
                ];
            });
        } else {
            let stats = await safeStat(dir);

            if (!stats || !stats.isDirectory()) {
                return;
            }

            let names = await invoke<string[]>(FS.readdir, dir);
            let unfilteredRows = await Promise.all(names.map(async name => {
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
                    Chalk.bold(name),
                    description
                ];
            })) as (TableRow | undefined)[];

            rows = unfilteredRows.filter(row => !!row) as TableRow[];
        }

        if (rows.length) {
            this.texts.push(`\
  ${Chalk.green('SUBCOMMANDS')}\n
${buildTableOutput(rows, { indent: 4, spaces: ' - ' })}`);
        }
    }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        stderr.write(`\n${this.text}\n`);
    }
}

function isHelpInfoBuildPathOptions(options: HelpInfoBuildOptions): options is HelpInfoBuildPathOptions {
    return 'dir' in options;
}
