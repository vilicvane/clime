const validCommandNameRegex = /^[\w\d]+(?:-[\w\d]+)*$/;

let argv = process.argv;

async function main(argv: string[]): Promise<void> {
    for (let arg of argv) {

    }




}

main(process.argv);

export class CLI {
    parse(argv: string[], root = CLI.root): void {

    }

    static get root(): string {
        let path = __dirname;

        return path;
    }
}
