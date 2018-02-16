import {Command, command, metadata} from '../../../../../..';

@command()
export default class extends Command {
  @metadata
  execute() {
    return 'Guess what';
  }
}
