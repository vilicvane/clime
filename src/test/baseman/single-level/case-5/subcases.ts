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
    args: ['--help', 'yoha'],
  },
  {
    name: 'unknown-option-1',
    args: ['--foo'],
  },
  {
    name: 'unknown-option-2',
    args: ['-f'],
  },
];
