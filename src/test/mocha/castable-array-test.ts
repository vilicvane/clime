import {
  CastingContext,
  Context,
  buildCastingContext,
  cast,
} from '../..';

import { array } from '../../castable/array';

const context = new Context({
  cwd: __dirname,
  commands: ['clime'],
});

class CastableFoo {
  private constructor(
    public source: string,
  ) { }

  static cast(source: string, context: CastingContext<CastableFoo>): CastableFoo {
    return new CastableFoo(source);
  }
}

class Bar {
  constructor(
    public source: string,
  ) { }
}

const CastableBar = {
  cast(source: string, context: CastingContext<Bar>): Bar {
    return new Bar(source);
  },
};

describe('Castable array', () => {
  it('should cast primitive values', async () => {
    let castingContext = buildCastingContext(context, {
      name: 'test',
      validators: [],
    });

    await cast('foo, bar', array(String), castingContext)
      .should.eventually.deep.equal(['foo', 'bar']);

    await cast('123, 456', array(Number), castingContext)
      .should.eventually.deep.equal([123, 456]);

    await cast('true, false', array(Boolean), castingContext)
      .should.eventually.deep.equal([true, false]);
  });

  it('should cast string-castable values', async () => {
    let castingContext = buildCastingContext(context, {
      name: 'test',
      validators: [],
    });

    await cast('yo, ha', array(CastableFoo), castingContext)
      .should.eventually.deep.equal([
        { source: 'yo' },
        { source: 'ha' },
      ]);

    await cast('yo, ha', array(CastableBar), castingContext)
      .should.eventually.deep.equal([
        { source: 'yo' },
        { source: 'ha' },
      ]);
  });

  it('should cast nested array values', async () => {
    let castingContext = buildCastingContext(context, {
      name: 'test',
      validators: [],
    });

    let type = array(array(String), { separator: ';' });

    await cast('yo, ha; biu, pia', type, castingContext)
      .should.eventually.deep.equal([
        ['yo', 'ha'],
        ['biu', 'pia'],
      ]);
  });
});
