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
    args: ['--foo', '123'],
  },
  {
    name: 'valid-argument-2',
    args: ['--bar', '15'],
  },
  {
    name: 'valid-argument-3',
    args: ['yoha'],
  },
  {
    name: 'valid-argument-4',
    args: ['yoha', '123'],
  },
  {
    name: 'valid-argument-5',
    args: ['yoha', '123', '1', '2'],
  },
  {
    name: 'invalid-argument-1',
    args: ['--foo', '1.23'],
  },
  {
    name: 'invalid-argument-2',
    args: ['--bar', '12.3'],
  },
  {
    name: 'invalid-argument-3',
    args: ['--bar', '21'],
  },
  {
    name: 'invalid-argument-4',
    args: ['xxx'],
  },
  {
    name: 'invalid-argument-5',
    args: ['yoha', '456'],
  },
  {
    name: 'invalid-argument-6',
    args: ['yoha', '123', '1.1'],
  },
];
