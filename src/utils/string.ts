import * as Chalk from 'chalk';

export function buildTableOutput(rows: string[][], {
    spaces = 4 as string | number,
    indent = 0 as string | number
} = {}): string {
    let maxTextLengths: number[] = [];

    for (let row of rows) {
        let lastNoneEmptyIndex = 0;

        for (let i = 0; i < row.length; i++) {
            let text = row[i] || '';
            let textLength = Chalk.stripColor(text).length;

            if (!textLength) {
                continue;
            }

            lastNoneEmptyIndex = i;

            if (maxTextLengths.length > i) {
                maxTextLengths[i] = Math.max(maxTextLengths[i], textLength);
            } else {
                maxTextLengths[i] = textLength;
            }
        }

        row.splice(lastNoneEmptyIndex + 1);
    }

    let indentStr = typeof indent === 'string' ?
        indent :
        new Array(indent + 1).join(' ');

    return rows
        .map(row => {
            let line = indentStr;

            for (let i = 0; i < row.length; i++) {
                let text = row[i] || '';
                let textLength = Chalk.stripColor(text).length;

                let maxLength = maxTextLengths[i];

                line += text;
                line += new Array(maxLength - textLength + 1).join(' ');

                if (i < row.length - 1) {
                    if (typeof spaces === 'string') {
                        line += spaces;
                    } else {
                        line += new Array(spaces + 1).join(' ');
                    }
                }
            }

            return line;
        })
        .join('\n');
}
