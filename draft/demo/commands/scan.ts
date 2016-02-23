import {
    Command,
    Context,
    command,
    param,
    option,
    toggle
} from '../..';

export class ScanOptions {
    @option({
        required: true,
        flag: 't',
        description: 'lalalala timeout~'
    })
    timeout: number;

    @option({
        default: 5555,
        flag: 'p',
        description: 'yayayaya~'
    })
    port: number;

    @toggle({
        flag: 'x'
    })
    xxx: boolean;
}

@command({
    description: 'Hello, world! This is the description of this command.'
})
export default class extends Command {
    execute(
        @param({
            description: 'sdfsdfsdf',
            required: true,
            default: 'abc'
        })
        hostname: string,

        @param({
            default: 10000,
            description: 'whatever description'
        })
        whatever: number,

        @param({
            description: 'guess what'
        })
        foo: string,

        options: ScanOptions,
        context: Context
    ) {
        console.log(context);
    }
}
