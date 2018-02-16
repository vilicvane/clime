import {Command, command, param, params} from '../../../../..';

@command()
export default class extends Command {
  execute(
    @param() foo: string,
    @params({
      type: String,
      required: true,
    })
    bar: string[],
  ) {
    // tslint:disable-next-line
    [foo, bar];
  }
}
