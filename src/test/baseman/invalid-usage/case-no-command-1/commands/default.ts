import {Command, param} from '../../../../..';

export default class extends Command {
  execute(
    @param({
      description: 'Some name',
      required: true,
    })
    name: string,
  ) {
    // tslint:disable-next-line
    name;
  }
}
