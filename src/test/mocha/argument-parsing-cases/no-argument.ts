import * as assert from 'assert';

import {
  Command,
  command,
  metadata,
} from '../../..';

@command()
export default class TestCommand extends Command {
  @metadata
  execute() {
    return arguments;
  }
}
