import * as assert from 'assert';

import {
    command,
    metadata,
    Command,
    Context
} from '../../';

@command()
export default class TestCommand extends Command {
    @metadata
    execute(context: Context) {
        context.should.be.an.instanceOf(Context);
    }
}
