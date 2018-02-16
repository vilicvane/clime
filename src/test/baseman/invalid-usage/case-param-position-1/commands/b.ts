import {Command, command, param} from '../../../../..';

@command()
export default class extends Command {
  execute(
    @param() foo: string,
    @param({
      required: true,
    })
    bar: string,
  ) {
    // tslint:disable-next-line
    [foo, bar];
  }
}
