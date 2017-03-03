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
    SubcommandDescriptor
} from '../cli';

import {
    TableRow,
    buildTableOutput,
    indent,
    safeStat,
    findPaths
} from '../../util';

export interface HelpInfoBuildClassOptions {
    TargetCommand: typeof Command;
}

export interface HelpInfoBuildPathOptions {
    dirs: string[];
    description?: string;
}

export type HelpInfoBuildOptions = typeof Command | HelpInfoBuildPathOptions;

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
            await info.buildTextForSubCommands(options.dirs);
        } else {
            info.buildDescription(options.description);
            info.buildTextsForParamsAndOptions(options);

            await info.buildTextForSubCommands(options.searchDirs);
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

    async buildTextForSubCommands(dirs: string[]): Promise<void> {
        let rows: TableRow[] = [];
        let rowMap = new Map<string, TableRow>();

        let definition = await CLI.getSubcommandsDefinition(dirs);

        if (definition) {
            for (let subcommand of definition.subcommands) {
                if (rowMap.has(subcommand.name)) {
                    throw new Error('Duplicate subcommand definitions');
                }

                let aliases = subcommand.aliases || subcommand.alias && [subcommand.alias];
                let subcommandNamesStr = Chalk.bold(subcommand.name);

                if (aliases) {
                    subcommandNamesStr += ` [${Chalk.dim(aliases.join(','))}]`;
                }

                let row = [
                    subcommandNamesStr,
                    subcommand.brief
                ];

                rows.push(row);
                rowMap.set(subcommand.name, row);
            }
        }

        let foundDirs = await findPaths('dir', dirs);

        if (!foundDirs) {
            return;
        }

        for (let dir of foundDirs) {
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

                let row = rowMap.get(name);

                if (row && row[1]) {
                    continue;
                }

                let description: string | undefined;

                if (stats) {
                    let module = require(path);
                    let CommandClass = (module.default || module) as CommandModule;
                    description = CommandClass && (CommandClass.brief || CommandClass.description);
                }

                if (row) {
                    row[1] = description;
                } else {
                    row = [
                        Chalk.bold(name),
                        description
                    ];

                    rows.push(row);
                    rowMap.set(name, row);
                }
            }
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
    return 'dirs' in options;
}
