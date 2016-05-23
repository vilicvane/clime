import * as assert from 'assert';

import {
    command,
    option,
    params,
    Command,
    Options
} from '../../../../';

export class TestOptions extends Options {
    @option()
    foo: string;
}

@command()
export default class TestCommand extends Command {
    execute(
        @params({
            type: String
        })
        args: string[],

        options: TestOptions
    ) {
        return 'multiple/foo/biu';
    }
}
