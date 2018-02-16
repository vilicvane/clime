import {Command, command, metadata} from '../../../../../..';

@command({
  brief: 'Extra biu',
  description: 'Extra biu description',
})
export default class extends Command {
  @metadata
  execute() {
    return 'Extra guess what';
  }
}
