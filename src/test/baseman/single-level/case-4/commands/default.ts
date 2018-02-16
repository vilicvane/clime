import {Command, Context, command, param, params} from '../../../../..';

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
    @params({
      description: 'Some values',
      type: Number,
      required: true,
    })
    values: number,
    context: Context,
  ) {
    return JSON.stringify(
      {
        name,
        values,
        commands: context.commands,
      },
      undefined,
      2,
    );
  }
}
