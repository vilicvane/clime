import * as Path from 'path';

import {
    CLI,
    HelpInfo
} from '../';

import { getCLICreator } from './helpers';

let createCLI = getCLICreator(__filename);

describe('Command Locating', () => {
    let label: string;
    let cli: CLI;

    describe('Single Command', () => {
        before(() => {
            label = 'single';
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
            label = 'multiple';
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

    describe('Multi-level Commands', () => {
        before(() => {
            label = 'multiple';
            cli = createCLI(label);
        });

        it('Should locate `commands/foo/default.js` with empty args', () => {
            return cli
                .execute(['foo'])
                .then(() => {
                    throw new Error('Should not fulfill');
                }, (helpInfo: HelpInfo) => {
                    helpInfo.text.should.contain('Foo!');
                });
        });

        it('Should locate `commands/foo/biu.js` with emptry extra args', () => {
            return cli
                .execute(['foo', 'biu'])
                .should.eventually.equal(`${label}/foo/biu`);
        });

        it('Should locate `commands/foo/pia.js` with emptry extra args', () => {
            return cli
                .execute(['foo', 'pia'])
                .should.eventually.equal(`${label}/foo/pia`);
        });
    });

    describe('Multi-root Commands', () => {
        before(() => {
            cli = new CLI('greet', [
                Path.join(__dirname, './command-locating-cases/multiple-root/commands'),
                Path.join(__dirname, './command-locating-cases/multiple-root/extend-commands'),
            ]);
        });

        it('Help info', () => {
            return cli
                .getHelp()
                .then(helpInfo => {
                    helpInfo.text.should.contain('Foo!');
                    helpInfo.text.should.contain('biu');
                    helpInfo.text.should.contain('pia');
                });
        });

        it('Should locate `commands/biu.js`', () => {
            return cli
                .execute(['biu'])
                .catch((helpInfo: HelpInfo) => {
                    throw new Error('Should not fulfill');
                });
        });

        it('Should locate `extend-commands/pia.js`', () => {
            return cli
                .execute(['pia'])
                .catch((helpInfo: HelpInfo) => {
                    throw new Error('Should not fulfill');
                });
        });
    });

    describe('Multi-root single command and root title', () => {
        before(() => {
            cli = new CLI('greet', [
                Path.join(__dirname, './command-locating-cases/single'),
                { dir: Path.join(__dirname, './command-locating-cases/multiple-root/extend-commands'), title: "EXTEND COMMANDS" },
            ]);
        });

        it('Help info', () => {
            return cli
                .getHelp()
                .then(helpInfo => {
                    helpInfo.text.should.contain('greet');
                    helpInfo.text.should.contain('EXTEND COMMANDS');
                    helpInfo.text.should.contain('pia');
                });
        });
        
        it('Should locate `single/default.js`', () => {
            return cli
                .execute(['hello'])
                .then((v) => {
                    v.should.contain('single');
                })
        });

        it('Should locate `extend-commands/pia.js`', () => {
            return cli
                .execute(['pia'])
                .catch((helpInfo: HelpInfo) => {
                    throw new Error('Should not fulfill');
                });
        });
    });
});
