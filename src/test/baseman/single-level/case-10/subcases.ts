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
    args: ['-h', 'yoha'],
  },
  {
    name: 'valid-argument-2',
    args: ['--foo', 'yoha'],
  },
  {
    name: 'valid-argument-3',
    args: ['--foo', 'yoha', '--bar', '123'],
  },
  {
    name: 'invalid-argument-1',
    args: ['--foo'],
  },
  {
    name: 'unknown-option-2',
    args: ['-f'],
  },
];
