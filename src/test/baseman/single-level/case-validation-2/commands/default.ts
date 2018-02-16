import {Command, Validation, command, params} from '../../../../..';

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @params({
      type: Number,
      validators: [Validation.integer, Validation.range(10, 20)],
    })
    args: number[],
  ) {
    return JSON.stringify(args, undefined, 2);
  }
}
