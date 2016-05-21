import * as Path from 'path';

import { CLI } from '../';
import { getCLICreator } from './helpers';

let createCLI = getCLICreator(__filename);

describe('Command Locating', () => {
    let label: string;
    let cli: CLI;

    describe('Single Command', () => {
        before(() => {
            label = 'single/0';
            cli = createCLI(label);
        });

        it('Should locate `commands/default.js` with empty args', () => {
            return cli
                .execute([])
                .should.eventually.equal(label);
        });

        it('Should locate `commands/default.js` with one parameter', () => {
            return cli
                .execute(['hello'])
                .should.eventually.equal(label);
        });

        it('Should locate `commands/default.js` with several parameter', () => {
            return cli
                .execute(['hello', 'world'])
                .should.eventually.equal(label);
        });

        it('Should locate `commands/default.js` with options', () => {
            return cli
                .execute(['--foo', 'bar'])
                .should.eventually.equal(label);
        });
    });

    describe('Multiple Commands', () => {
        before(() => {
            label = 'multiple/0';
            cli = createCLI(label);
        });

        it('Should locate `commands/default.js` with empty args', () => {
            return cli
                .execute([])
                .should.eventually.equal(label);
        });

        it('Should locate `commands/hello.js` with emptry extra args', () => {
            return cli
                .execute(['hello'])
                .should.eventually.equal(`${label}/hello`);
        });

        it('Should locate `commands/hello.js` with several parameters', () => {
            return cli
                .execute(['hello', 'world', 'hahaha'])
                .should.eventually.equal(`${label}/hello`);
        });

        it('Should locate `commands/hello.js` with options', () => {
            return cli
                .execute(['hello', '--foo', 'bar'])
                .should.eventually.equal(`${label}/hello`);
        });

        it('Should locate `commands/world.js` with emptry extra args', () => {
            return cli
                .execute(['world'])
                .should.eventually.equal(`${label}/world`);
        });
    });
});
