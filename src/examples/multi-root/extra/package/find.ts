import {Command, command, param} from '../../../..';

@command({
  description: 'Find package information',
})
export default class extends Command {
  execute(
    @param({
      required: true,
      description: 'Pattern of package to find',
    })
    pattern: string,
  ) {
    // tslint:disable-next-line
    pattern;
  }
}
