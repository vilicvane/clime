export default [
  {
    name: 'help-long',
    args: ['--help'],
  },
  {
    name: 'help-long-foo',
    args: ['foo', '--help'],
  },
  {
    name: 'help-long-bar',
    args: ['bar', '--help'],
  },
  {
    name: 'help-long-unknown',
    args: ['unknown', '--help'],
  },
  {
    name: 'no-argument',
    args: [],
  },
  // {
  //   name: 'valid-argument-1',
  //   args: ['guess what'],
  // },
  // {
  //   name: 'valid-argument-2',
  //   args: ['yoha', '456'],
  // },
  // {
  //   name: 'invalid-argument-1',
  //   args: ['yoha', 'def'],
  // },
  // {
  //   name: 'unknown-option-1',
  //   args: ['--foo'],
  // },
  // {
  //   name: 'unknown-option-2',
  //   args: ['-f'],
  // },
];
