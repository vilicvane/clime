import {
  CastableDate,
  CommaSeparatedStrings,
} from '../../castable/miscellaneous';

describe('Castable object `CommaSeparatedStrings`', () => {
  it('should cast', () => {
    CommaSeparatedStrings.cast('foo, bar').should.deep.equal(['foo', 'bar']);
    CommaSeparatedStrings.cast('foo, bar, , pia').should.deep.equal(['foo', 'bar', 'pia']);
  });
});

describe('Castable object `CastableDate`', () => {
  it('should cast', () => {
    CastableDate.cast('2013-12-15').getTime().should.equal(new Date(2013, 11, 15).getTime());
  });
});
