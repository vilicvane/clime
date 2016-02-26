import {
    Command,
    Options,
    command,
    param,
    option,
    HelpInfo
} from '../../../';

export class SystemOptions extends Options {
    @option({
    })
    abc: string;

    @option({
        description: 'biu biu biu~',
        required: true
    })
    def: number;
}

@command({
    brief: 'yo system yo~',
    description: 'System lalala...'
})
export default class extends Command {
    execute(
        @param({
            description: 'yo yo yo~'
        })
        foo: string,

        @param()
        bar: number,

        options: SystemOptions
    ) {
        return this.help;
    }
}
