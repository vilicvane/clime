import {Command, command, metadata} from '../../../../../..';

@command({
  brief: 'Biu',
  description: 'Biu description',
})
export default class extends Command {
  @metadata
  execute() {
    return 'Guess what';
  }
}
