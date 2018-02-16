import {Command, param, params} from '../../../../..';

export default class extends Command {
  execute(
    @param({
      description: 'Some name',
      required: true,
    })
    name: string,
    @params({
      type: String,
    })
    texts: string[],
    @params({
      type: String,
    })
    extraTexts: string[],
  ) {
    // tslint:disable-next-line
    [name, texts, extraTexts];
  }
}
