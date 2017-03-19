import * as Path from 'path';

import {
  CLI,
  HelpInfo,
} from '../../';

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

    it('Should locate `commands/hello.js` with empty extra args', () => {
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

    it('Should locate `commands/world.js` with empty extra args', () => {
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

    it('Should locate `commands/foo/biu.js` with empty extra args', () => {
      return cli
        .execute(['foo', 'biu'])
        .should.eventually.equal(`${label}/foo/biu`);
    });

    it('Should locate `commands/foo/pia.js` with empty extra args', () => {
      return cli
        .execute(['foo', 'pia'])
        .should.eventually.equal(`${label}/foo/pia`);
    });
  });
});
