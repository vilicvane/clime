import { Command, param, option, toggle } from '../..';

function test(target: any, abc: string) {

}

export class ScanOptions {
    @option()
    timeout: number;

    @option({
        default: 5555
    })
    port: number;

    @toggle()
    x: boolean;
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

    }
}
