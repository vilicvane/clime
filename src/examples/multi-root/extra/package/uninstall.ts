import {Command, command, param} from '../../../..';

@command({
  description: 'Uninstall a package',
})
export default class extends Command {
  execute(
    @param({
      required: true,
      description: 'Name of package to uninstall',
    })
    name: string,
  ) {
    return `Guess what, try command \`npm uninstall ${name}\`.`;
  }
}
