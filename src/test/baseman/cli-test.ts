import * as Path from 'path';

import * as glob from 'glob';
import * as v  from 'villa';
import { Resolvable } from 'villa';

import {
  CLITest,
  CLITestCase,
  Test,
} from 'baseman';

interface SubcaseDefinition {
  name: string;
  args: string[];
}

export class ClimeCLITest extends CLITest {
  async generate(): Promise<CLITestCase[]> {
    let caseNames = await v.call(glob, '*/case-*/', {
      cwd: __dirname,
    });

    return caseNames.map(caseName => {
      let caseDir = Path.join(__dirname, caseName);
      let subcases = require(Path.join(caseDir, 'subcases')).default as SubcaseDefinition[];

      return subcases.map(subcase => {
        return new CLITestCase(
          `${caseName}${subcase.name}`,
          [Path.join(caseDir, 'cli.js')].concat(subcase.args),
        );
      });
    })
    .reduce((result, cases) => result.concat(cases), []);
  }
}

export default new ClimeCLITest('node');
