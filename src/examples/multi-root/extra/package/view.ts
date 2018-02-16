import {Command, command, param} from '../../../..';

@command({
  description: 'View package information (extra)',
})
export default class extends Command {
  execute(
    @param({
      required: true,
      description: 'Name of package to view',
    })
    name: string,
  ) {
    return `Guess what (extra), try command \`npm view ${name}\`.`;
  }
}
