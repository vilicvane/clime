import {
    Command,
    Options,
    command,
    option,
    metadata
} from '../../../';

export class ScanOptions extends Options {
    @option()
    abc: string;

    @option()
    def: number;
}

@command({
    description: 'Start ahahaha...'
})
export default class extends Command {
    @metadata
    execute(options: ScanOptions) {

    }
}
