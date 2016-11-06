import * as Chalk from 'chalk';

export type TableRow = (string | undefined)[];

export const TABLE_CAPTION_FLAG = 'TABLE_OUTPUT_CAPTION_FLAG';
export function buildTableOutput(rows: TableRow[], {
    spaces = 4 as string | number,
    indent = 0 as string | number
} = {}): string {
    let maxTextLengths: number[] = [];

    for (let row of rows) {
        let lastNoneEmptyIndex = 0;

        if (row[0] == TABLE_CAPTION_FLAG) {
            continue;
        }

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
        .map((row, index) => {
            let line = indentStr;

            if (row[0] == TABLE_CAPTION_FLAG) {
                return (index > 0 ? '\n' : '') + row[1] + '\n';
            }

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
        .join('\n') + '\n';
}

export function indent(text: string, indent: string | number = 2): string {
    let indentStr = typeof indent === 'string' ?
        indent.replace(/\r/g, '') :
        Array(indent + 1).join(' ');

    return text.replace(/^/mg, indentStr);
}
