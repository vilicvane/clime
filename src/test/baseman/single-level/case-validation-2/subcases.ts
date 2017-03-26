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
    args: ['12', '13'],
  },
  {
    name: 'invalid-argument-1',
    args: ['12', '21'],
  },
  {
    name: 'invalid-argument-2',
    args: ['1.23', '13'],
  },
];
