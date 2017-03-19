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
    args: ['guess what'],
  },
  {
    name: 'valid-argument-2',
    args: ['yoha', '456'],
  },
  {
    name: 'invalid-argument-1',
    args: ['yoha', 'def'],
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
