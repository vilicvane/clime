import {Command, Options, command, metadata, option} from '../../../../..';

export class SomeOptions extends Options {
  @option({
    required: true,
    // tslint:disable-next-line:no-null-keyword
    default: null,
  })
  fooBar: boolean;
}

@command({
  description: 'Foo bar',
})
export default class extends Command {
  @metadata
  execute(options: SomeOptions) {
    return JSON.stringify(options, undefined, 2);
  }
}
