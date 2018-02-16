import {Command, command, metadata} from '../../..';

@command({
  brief: 'Print version',
  description: 'Print version of this tool',
})
export default class extends Command {
  @metadata
  execute() {
    return '0.0.0';
  }
}
