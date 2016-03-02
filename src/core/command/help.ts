import * as Path from 'path';
import * as FS from 'fs';

import * as Chalk from 'chalk';
import * as globby from 'globby';
import Promise, { invoke } from 'thenfail';

import {
    Command
} from './';

import {
    Printable
} from '../object';

import {
    DescriptiveObject
} from '../cli';

import {
    buildTableOutput,
    indent
} from '../../utils';

export class HelpInfo implements Printable {
    private texts: string[] = [];

    constructor() { }

    static build(dir: string, description: string): HelpInfo;
    static build(dir: string, CommandClass?: typeof Command): HelpInfo;
    static build(dir: string, arg?: typeof Command | string): HelpInfo {
        let info = new HelpInfo();

        if (typeof arg === 'string') {
            info.buildDescription(arg);
            info.buildTextForSubCommands(dir);
        } else if (arg) {
            info.buildDescription(arg.description);
            info.buildTextsForParamsAndOptions(arg);

            if (Path.basename(arg.path) === 'default.js') {
                info.buildTextForSubCommands(dir);
            }
        } else {
            info.buildTextForSubCommands(dir);
        }

        return info;
    }

    private buildDescription(description: string): void {
        if (description) {
            this.texts.push(`${indent(description)}\n`);
        }
    }

    private buildTextsForParamsAndOptions(CommandClass: typeof Command): void {
        let paramDefinitions = CommandClass.paramDefinitions;
        let paramsDefinition = CommandClass.paramsDefinition;

        let parameterDescriptionRows: string[][] = [];

        let parameterUsageItems = CommandClass
            .paramDefinitions
            .map(definition => {
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

            parameterUsageItems.push(
                required ?
                    `<...${name}>` :
                    `[...${name}]`
            );
        }

        let optionDefinitions = CommandClass.optionDefinitions || [];
        let requiredOptionUsageItems = optionDefinitions
            .filter(definition => definition.required)
            .map(({ name, placeholder }) => `--${name} <${placeholder || name}>`);

        let usageLine = [
            Chalk.bold(CommandClass.sequence.join(' ')),
            ...parameterUsageItems,
            ...requiredOptionUsageItems
        ].join(' ');

        if (optionDefinitions.length > requiredOptionUsageItems.length) {
            usageLine += ' [...options]';
        }

        let text = `\
  ${Chalk.green('USAGE')}\n
    ${usageLine}\n`;

        if (parameterDescriptionRows.length) {
            text += `\n${buildTableOutput(parameterDescriptionRows, { indent: 4, spaces: ' - '})}`;
        }

        this.texts.push(text);

        if (optionDefinitions.length) {
            let optionRows = optionDefinitions
                .map(definition => {
                    let {
                        name,
                        flag,
                        placeholder,
                        toggle: isToggle,
                        description
                    } = definition;

                    let triggerStr = flag ? `-${flag}, ` : '';

                    triggerStr += `--${name}`;

                    if (!isToggle) {
                        triggerStr += ` <${placeholder || name}>`;
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

    buildTextForSubCommands(dir: string): void {
        let rows = FS
            .readdirSync(dir)
            .map(name => {
                let path = Path.join(dir, name);
                let stats = FS.statSync(path);

                if (stats.isFile()) {
                    if (name === 'default.js' || Path.extname(path) !== '.js') {
                        return undefined;
                    }

                    name = Path.basename(name, '.js');
                } else {
                    path = Path.join(path, 'default.js');
                }

                let description: string;

                if (FS.existsSync(path)) {
                    let module = require(path);
                    let CommandClass = (module.default || module) as DescriptiveObject;
                    description = CommandClass && (CommandClass.brief || CommandClass.description);
                }

                return [
                    Chalk.bold(name),
                    description
                ];
            })
            .filter(row => !!row);

        if (rows.length) {
            this.texts.push(`\
  ${Chalk.green('SUB COMMANDS')}\n
${buildTableOutput(rows, { indent: 4, spaces: ' - ' })}`);
        }
    }

    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void {
        stderr.write(`\n${this.texts.join('\n')}\n`);
    }
}
