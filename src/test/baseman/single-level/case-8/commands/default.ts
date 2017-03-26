import {
  Command,
  command,
  param,
} from '../../../../..';

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param()
    error: boolean,
  ) {
    if (error) {
      throw new Error('Instance of Error');
    } else {
      throw 'Some meaningless string';
    }
  }
}
