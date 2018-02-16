import {Command, Context, command, param} from '../../../../..';

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param({
      description: 'Some name',
      required: true,
    })
    name: string,
    @param({
      default: 123,
    })
    value: number,
    context: Context,
  ) {
    return JSON.stringify(
      {
        name,
        value,
        commands: context.commands,
      },
      undefined,
      2,
    );
  }
}
