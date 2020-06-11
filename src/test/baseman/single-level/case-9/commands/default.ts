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
    required: true,
  })
  fooBar: number;
}

@command({
  description: 'Foo bar',
})
export default class extends Command {
  @metadata
  execute(options: SomeOptions, context: Context) {
    return JSON.stringify(
      {...options, skippedArgs: context.skippedArgs},
      undefined,
      2,
    );
  }
}
