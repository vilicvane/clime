import {Command, Options, command, metadata, option} from '../../../../..';

export class SomeOptions extends Options {
  @option({
    description: 'guess what',
    placeholder: 'yo',
    flag: 'h',
    required: true,
  })
  foo: string;

  @option({
    default: '456',
  })
  bar: number;
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
