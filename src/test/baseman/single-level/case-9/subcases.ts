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
    args: ['--foo-bar', '123', '--', 'test'],
  },
  {
    name: 'unknown-option-1',
    args: ['--foo'],
  },
];
