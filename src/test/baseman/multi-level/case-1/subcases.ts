export default [
  {
    name: 'help-long',
    args: ['--help'],
  },
  {
    name: 'help-long-unknown',
    args: ['unknown', '--help'],
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
    name: 'unknown-option-1',
    args: ['-x', 'abc'],
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
  {
    name: 'invalid-argument-foo-1',
    args: ['foo', 'def', 'ghi'],
  },
  {
    name: 'unknown-option-foo-1',
    args: ['foo', '-x', 'def'],
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
  // `bar biu`
  {
    name: 'help-long-bar-biu',
    args: ['bar', 'biu', '--help'],
  },
  {
    name: 'no-argument-bar-biu',
    args: ['bar', 'biu'],
  },
  // `bar pia-pia`
  {
    name: 'help-long-bar-pia-pia',
    args: ['bar', 'pia-pia', '--help'],
  },
  {
    name: 'no-argument-bar-pia-pia',
    args: ['bar', 'pia-pia'],
  },
  {
    name: 'valid-argument-bar-pia-pia-1',
    args: ['bar', 'pia-pia', '--switch'],
  },
  {
    name: 'valid-argument-bar-pia-pia-2',
    args: ['bar', 'pia-pia', '-s'],
  },
  {
    name: 'valid-argument-bar-pia-pia-3',
    args: ['bar', 'pia-pia', '--name', 'hello'],
  },
  {
    name: 'valid-argument-bar-pia-pia-4',
    args: ['bar', 'pia-pia', '-sn', 'hello'],
  },
  {
    name: 'invalid-argument-bar-pia-pia-1',
    args: ['bar', 'pia-pia', '-ns', 'hello'],
  },
];
