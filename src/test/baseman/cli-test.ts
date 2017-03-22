import * as Path from 'path';

import * as glob from 'glob';
import * as v  from 'villa';
import { Resolvable } from 'villa';

import {
  CLITest,
  CLITestCase,
} from 'baseman';

interface SubcaseDefinition {
  name: string;
  args: string[];
}

export class ClimeCLITestCase extends CLITestCase {
  get description(): string {
    let argsStr = this.args.slice(1).map(arg => JSON.stringify(arg)).join(' ');
    return `args ${argsStr}`;
  }
}

export class ClimeCLITest extends CLITest {
  async generate(): Promise<ClimeCLITestCase[]> {
    let caseNames = await v.call(glob, '*/case-*/', {
      cwd: __dirname,
    });

    return caseNames.map(caseName => {
      let caseDir = Path.join(__dirname, caseName);
      let subcases = require(Path.join(caseDir, 'subcases')).default as SubcaseDefinition[];

      return subcases.map(subcase => {
        return new ClimeCLITestCase(
          `${caseName}${subcase.name}`,
          [Path.join(caseDir, 'cli.js')].concat(subcase.args),
        );
      });
    })
    .reduce((result, cases) => result.concat(cases), []);
  }
}

export default new ClimeCLITest('node');
