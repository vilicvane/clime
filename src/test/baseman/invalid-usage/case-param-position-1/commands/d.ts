import {Command, command, param, params} from '../../../../..';

@command()
export default class extends Command {
  execute(
    @param() foo: string,
    oops: number,
    @params({
      type: String,
    })
    bar: string[],
  ) {
    // tslint:disable-next-line
    [foo, oops, bar];
  }
}
