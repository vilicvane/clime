export default [
  {
    name: 'help-long',
    args: ['--help'],
  },
  {
    name: 'no-argument',
    args: [],
  },
  {
    name: 'valid-argument-1',
    args: ['guess what'],
  },
  {
    name: 'valid-argument-2',
    args: ['guess what, biu biu biu'],
  },
  // `foo`
  {
    name: 'help-long-foo',
    args: ['foo', '--help'],
  },
  {
    name: 'no-argument-foo',
    args: ['foo'],
  },
  {
    name: 'valid-argument-foo-1',
    args: ['foo', 'abc'],
  },
  // `bar`
  {
    name: 'help-long-bar',
    args: ['bar', '--help'],
  },
  {
    name: 'no-argument-bar',
    args: ['bar'],
  },
];
