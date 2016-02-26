import {
    Command,
    Options,
    command,
    param,
    params,
    option,
    HelpInfo,
    Context,
    metadata
} from '../../../';

export class SystemOptions extends Options {
    @option({
        default: 'hahaha'
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
            description: 'yo yo yo~',
            required: true
        })
        foo: string,

        @param({
            default: 456,
            required: true
        })
        bar: number,

        @params({
            type: Number,
            required: true,
            description: 'variadic arguments'
        })
        args: number[],

        options: SystemOptions,
        context: Context
    ) {
        console.log(arguments);
        // return this.help;
    }
}
