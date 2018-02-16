import {Castable, Command, command, param} from '../../../../..';

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
