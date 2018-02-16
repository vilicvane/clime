import {
  Command,
  ExpectedError,
  Options,
  Validation,
  command,
  option,
  param,
  params,
} from '../../../../..';

export class FooOptions extends Options {
  @option({
    description: 'Foo description',
    validator: Validation.integer,
  })
  foo: number;

  @option({
    description: 'Bar description',
    validators: [Validation.integer, Validation.range(10, 20)],
  })
  bar: number;
}

@command({
  description: 'Foo bar',
})
export default class extends Command {
  execute(
    @param({
      validator: /yoha/,
    })
    foo: string,
    @param({
      validators: [
        (value: number, {name}) => {
          if (value !== 123) {
            throw new ExpectedError(`Value of ${name} is not valid`);
          }
        },
      ],
    })
    bar: number,
    @params({
      type: Number,
      validator: Validation.integer,
    })
    args: number[],
    options: FooOptions,
  ) {
    let data = Object.assign(
      {
        args: [foo, bar, ...args],
      },
      options,
    );

    return JSON.stringify(data, undefined, 2);
  }
}
