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
    name: 'valid-argument-bar-pia-pia-4',
    args: ['bar', 'pia-pia', '-sn', 'hello'],
  },
  // `pia`
  {
    name: 'help-long-pia',
    args: ['pia', '--help'],
  },
  {
    name: 'no-argument-pia',
    args: ['pia'],
  },
  {
    name: 'valid-argument-pia-1',
    args: ['pia', 'yoha'],
  },
];
