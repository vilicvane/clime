import * as stripAnsi from 'strip-ansi';

export type TableRow = (string | undefined)[];

export function buildTableOutput(
  rows: TableRow[],
  {separators = '  ' as string | string[], indent = 0 as string | number} = {},
): string {
  let maxTextLengths: number[] = [];

  for (let row of rows) {
    let lastNoneEmptyIndex = 0;

    for (let i = 0; i < row.length; i++) {
      let text = row[i] || '';
      let textLength = stripAnsi(text).length;

      if (textLength) {
        lastNoneEmptyIndex = i;
      }

      if (maxTextLengths.length > i) {
        maxTextLengths[i] = Math.max(maxTextLengths[i], textLength);
      } else {
        maxTextLengths[i] = textLength;
      }
    }

    row.splice(lastNoneEmptyIndex + 1);
  }

  let indentStr =
    typeof indent === 'string' ? indent : new Array(indent + 1).join(' ');

  return (
    // tslint:disable-next-line:prefer-template
    rows
      .map(row => {
        let line = indentStr;

        for (let i = 0; i < row.length; i++) {
          let text = row[i] || '';
          let textLength = stripAnsi(text).length;

          let maxLength = maxTextLengths[i];

          line += text;
          line += new Array(maxLength - textLength + 1).join(' ');

          if (i < row.length - 1) {
            if (typeof separators === 'string') {
              line += separators;
            } else {
              line += separators[i];
            }
          }
        }

        return line;
      })
      .join('\n') + '\n'
  );
}

export function indent(text: string, indent: number | string): string {
  let indentStr =
    typeof indent === 'string'
      ? indent.replace(/\r/g, '')
      : Array(indent + 1).join(' ');

  return text.replace(/^/gm, indentStr);
}
