import {Command, SubcommandDefinition, command, param} from '../../../../..';

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param({
      description: 'Some name',
    })
    name: string,
  ) {
    return JSON.stringify(
      {
        name,
      },
      undefined,
      2,
    );
  }
}

export const subcommands: SubcommandDefinition[] = [
  {
    name: 'foo',
    alias: 'f',
    brief: 'Overridden foo brief',
  },
  {
    name: 'bar',
    brief: 'Overridden bar brief',
  },
];
