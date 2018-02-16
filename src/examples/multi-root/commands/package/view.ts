import {Command, command, param} from '../../../..';

@command({
  description: 'View package information',
})
export default class extends Command {
  execute(
    @param({
      required: true,
      description: 'Name of package to view',
    })
    name: string,
  ) {
    return `Guess what, try command \`npm view ${name}\`.`;
  }
}
