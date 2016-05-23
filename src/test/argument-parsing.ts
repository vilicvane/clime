import * as Path from 'path';

import {
    CLI,
    HelpInfo
} from '../';

import { getCLICreator } from './helpers';

let createCLI = getCLICreator(__filename);

describe('Argument Parsing', () => {
    let cli = createCLI();

    it('Should get no argument for an empty signature', () => {
        return cli.execute(['no-argument']);
    });

    it('Should get only a context', () => {
        return cli.execute(['context-only']);
    });
});
