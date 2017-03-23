import {
  Command,
  Context,
  Options,
  command,
  metadata,
  option,
} from '../../../../..';

export class SomeOptions extends Options {
  @option({
    description: 'guess what',
    placeholder: 'yo',
    flag: 'h',
    required: true,
  })
  foo: string;
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
