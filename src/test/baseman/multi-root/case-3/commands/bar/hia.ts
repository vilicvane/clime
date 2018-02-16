import {Command, command, metadata} from '../../../../../..';

@command({
  brief: 'Hia',
  description: 'Hia description',
})
export default class extends Command {
  @metadata
  execute() {
    return 'Guess what';
  }
}
