import {
    Command,
    Options,
    command,
    param,
    option
} from '../../../';

export class ScanOptions extends Options {
    @option()
    abc: string;

    @option()
    def: number;
}

@command({
    description: 'Scan scan scan...'
})
export default class extends Command {
    execute(
        @param()
        foo: string,

        @param()
        bar: number,

        options: ScanOptions
    ) {

    }
}
