import * as assert from 'assert';

import {
    command,
    metadata,
    Command
} from '../../';

@command()
export default class TestCommand extends Command {
    @metadata
    execute() {
        arguments.should.have.lengthOf(0);
    }
}
