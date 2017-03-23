import * as assert from 'assert';

import {
  Command,
  Context,
  command,
  metadata,
} from '../../..';

@command()
export default class TestCommand extends Command {
  @metadata
  execute(context: Context) {
    return arguments;
  }
}
