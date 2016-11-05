import * as assert from 'assert';

import {
    command,
    Command,
    metadata
} from '../../../../';


@command()
export default class TestCommand extends Command {
    @metadata
    execute() {
        return 'extend/pia';
    }
}
