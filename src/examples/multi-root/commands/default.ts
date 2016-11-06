import * as Path from 'path';

export const description = `\
     _ _
 ___| |_|_____ ___
|  _| | |     | -_|
|___|_|_|_|_|_|___|
`;

export const subcommands = [
    {
        name: 'install',
        alias: 'i',
        brief: 'Show useless message of installation',
        filename: '../../multi-level/commands/package/install.js'
    },
    {
        name: 'view',
        aliases: ['show', 'lookup'],
        brief: 'Show useless message of viewing',
        filename: '../../multi-level/commands/package/view.js'
    }
];
