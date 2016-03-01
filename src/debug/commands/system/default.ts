import {
    Command,
    Options,
    command,
    param,
    params,
    option,
    HelpInfo,
    Context,
    metadata,
    Validation
} from '../../../';

export class SystemOptions extends Options {
    @option({
        flag: 'f',
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
            validator: /@/,
            required: true
        })
        foo: string,

        @param({
            default: 456,
            validator: Validation.integer,
            required: true
        })
        bar: number,

        @params({
            type: Number,
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
