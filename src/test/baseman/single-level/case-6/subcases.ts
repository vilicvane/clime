export default [
  {
    name: 'help-long',
    args: ['--help'],
  },
  {
    name: 'help-short',
    args: ['-h'],
  },
  {
    name: 'help-question-mark',
    args: ['-?'],
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
    name: 'invalid-argument-1',
    args: ['--foo'],
  },
  {
    name: 'invalid-argument-2',
    args: ['--foo', '--bar'],
  },
  {
    name: 'unknown-option-2',
    args: ['-f'],
  },
];
