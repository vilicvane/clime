import { Command, param, option } from '../..';

function test(target: any, abc: string) {

}

export class ScanOptions {
    @option()
    timeout: number;

    @option({
        default: 5555
    })
    port: number;
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
