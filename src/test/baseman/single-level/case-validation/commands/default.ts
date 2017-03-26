import {
  Command,
  Options,
  Validation,
  command,
  metadata,
  option,
} from '../../../../..';

export class FooOptions extends Options {
  @option({
    description: 'Foo description',
    validator: Validation.integer,
  })
  foo: number;

  @option({
    description: 'Bar description',
    validators: [
      Validation.integer,
      Validation.range(10, 20),
    ],
  })
  bar: number;
}

@command({
  description: 'Foo bar',
})
export default class extends Command {
  @metadata
  execute(options: FooOptions) {
    return JSON.stringify(options, undefined, 2);
  }
}
