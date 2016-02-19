import { Command, param, option, toggle } from '../..';

export class ScanOptions {
    @option({
        flag: 't'
    })
    timeout: number;

    @option({
        default: 5555,
        flag: 'p'
    })
    port: number;

    @toggle({
        flag: 'x'
    })
    xxx: boolean;
}

export default class extends Command {
    execute(
        @param({
            description: 'sdfsdfsdf',
            required: true,
            default: 'abc'
        })
        hostname: string,

        @param({
            default: 10000
        })
        timeout: number,

        options: ScanOptions
    ) {
        console.log(arguments);
    }
}
