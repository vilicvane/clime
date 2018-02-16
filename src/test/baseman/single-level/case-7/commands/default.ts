import {Command, Options, command, metadata, option} from '../../../../..';

export class FooOptions extends Options {
  @option({
    description: 'guess what foo',
    placeholder: 'yo',
    flag: 'h',
    required: true,
  })
  foo: string;
}

export class FooBarOptions extends FooOptions {
  @option({
    description: 'guess what bar',
  })
  bar: number;
}

@command({
  description: 'Foo bar',
})
export default class extends Command {
  @metadata
  execute(options: FooBarOptions) {
    return JSON.stringify(options, undefined, 2);
  }
}
