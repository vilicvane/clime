import {
  Castable,
  Command,
  SubcommandDefinition,
  command,
  param,
} from '../../../../..';

export const subcommands: SubcommandDefinition[] = [
  {
    name: 'bar',
    brief: 'Bababa, ba-banana',
  },
];

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param({
      description: 'Some names',
      default: 'yo,ha',
    })
    names: Castable.CommaSeparatedStrings,
  ) {
    return JSON.stringify(names, undefined, 2);
  }
}
