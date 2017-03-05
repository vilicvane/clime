import * as Path from 'path';

import {
  CLI,
  Context,
} from '../';

import { getCLICreator } from './helpers';

let createCLI = getCLICreator(__filename);

describe('Argument Parsing', () => {
  let cli = createCLI();

  it('Should get no argument for an empty signature', async () => {
    let args = await cli.execute(['no-argument']) as IArguments;
    args.should.have.lengthOf(0);
  });

  it('Should get only a context', async () => {
    let args = await cli.execute(['context-only']) as IArguments;
    args.should.have.lengthOf(1);
    (args[0] as Object).should.be.an.instanceOf(Context);
  });
});
