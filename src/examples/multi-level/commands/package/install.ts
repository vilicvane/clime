import {Command, command, param} from '../../../..';

@command({
  description: 'Install a package',
})
export default class extends Command {
  execute(
    @param({
      required: true,
      description: 'Name of package to install',
    })
    name: string,
  ) {
    return `Guess what, try command \`npm install ${name}\`.`;
  }
}
