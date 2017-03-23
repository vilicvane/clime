import {
  Command,
  Context,
  Object as ClimeObject,
  command,
  param,
} from '../../../../..';

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param({
      description: 'Some names',
      default: 'yo,ha',
    })
    names: ClimeObject.CommaSeparatedStrings,
  ) {
    return JSON.stringify(names, undefined, 2);
  }
}
