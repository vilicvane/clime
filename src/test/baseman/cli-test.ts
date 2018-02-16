// tslint:disable:no-implicit-dependencies

import * as Path from 'path';

import * as glob from 'glob';
import * as v from 'villa';

import {CLITest, CLITestCase, Util} from 'baseman';

interface SubcaseDefinition {
  name: string;
  args: string[];
}

export class ClimeCLITestCase extends CLITestCase {
  get description(): string {
    let argsStr = this.args
      .slice(1)
      .map(arg => JSON.stringify(arg))
      .join(' ');
    return `args ${argsStr}`;
  }

  extractOutput(stdout: Buffer, stderr: Buffer): [string, string] {
    let out = stdout.toString();
    let err = stderr.toString();

    let blurPathOptions: Util.BlurPathOptions = {
      extensions: ['.js'],
      existingOnly: true,
    };

    out = Util.blurPath(out, blurPathOptions);

    err = Util.blurErrorStack(err);
    err = Util.blurPath(err, blurPathOptions);

    return [out, err];
  }
}

export class ClimeCLITest extends CLITest {
  async generate(): Promise<ClimeCLITestCase[]> {
    let caseNames = await v.call(glob, '*/case-*/', {
      cwd: __dirname,
    });

    return caseNames
      .map(caseName => {
        if (!/-\d+\/$/.test(caseName)) {
          throw new Error(
            `Expecting numeric suffix for case name "${caseName}"`,
          );
        }

        let caseDir = Path.join(__dirname, caseName);
        let subcases = require(Path.join(caseDir, 'subcases'))
          .default as SubcaseDefinition[];

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
