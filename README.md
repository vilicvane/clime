# Clime

The command-line interface framework for TypeScript.

```ts
@command()
export default class extends Command {
    execute() {
        return 'Hello, Clime!';
    }
}
```

# Features

- ☑ Type and schema based parameters/options casting.
- ☑ Object and promise based architecture.
- ☑ File path based multi-level sub commands.
- ☑ Automatic usage generating.
- ☐ Interaction integration.

## Parameter types and options schema

Clime provides a way in which you can get parameters and options you really want to: **typed** at compile time and **casted** at run time.
To make this work, you'll need to set both of `experimentalDecorators` and `emitDecoratorMetadata` in your `tsconfig.json` to `true`.

```ts
export class SomeOptions extends Options {
    @option({
        flag: 't',
        description: 'timeout that does nothing'
    })
    timeout: number;

    // You can also create methods and properties.
    get timeoutInSeconds(): number {
        return this.timeout / 1000;
    }
}

@command()
export default class extends Command {
    execute(
        @param({
            required: true,
            description: 'required parameter foo'
        })
        foo: string,

        @param({
            description: 'optional parameter bar'
        })
        bar: number,

        @params({
            type: String,
            description: 'extra parameters'
        })
        args: string[],

        options: SomeOptions
    ) {
        return 'Hello, Clime!';
    }
}
```

And this is what you get for usage/help information:

```shell
USAGE

  command <foo> [bar] [...args] [...options]

  foo  - required parameter foo
  bar  - optional parameter bar
  args - extra parameters

OPTIONS

  -t, --timeout <timeout> - timeout that does nothing

```

### Casting from string

Clime will automatically cast parameters to `number`, `boolean` based on their types.
It also defines interface `StringCastable` that allows user-defined classes to be casted from parameters.

For example:

```ts
class File implements StringCastable {
    constructor(
        public path: string
    ) { }

    static cast(path: string, context: Context): File {
        return new File(Path.resolve(context.cwd, path));
    }
}
```

### Validators

A `validator` or `validators` can be specified for parameters and options validation.
A validator can either be an instance of interface `Validator<T>` or a regular expression.

### Expected error

A useful way to distinguish expected errors (e.g., errors that might be caused by incorrect user input) from other errors is to use `ExpectedError` class when throwing.
And a validator for example, usually throw instances of `ExpectedError`.

### Preserving metadata without command-line parameters

As TypeScript only emits metadata for target decorated by decorators, if no command-line parameter added, Clime won't be able to know information of options and context parameter.
Thus a `@metadata` decorator that does nothing at run time is provided for preserving these metadata:

```ts
@command()
export default class extends Command {
    @metadata
    execute(options: SomeOptions) {
        return 'Hello, Clime!';
    }
}
```

It is required to have this `@metadata` decorator if no other decorator is applied to method `execute`.

### Context

Context is an object contains information like current working directory and commands sequence.
You can have `context` passed in by adding the last parameter of `execute` method with type `Context`:

```ts
@command()
export default class extends Command {
    @metadata
    execute(context: Context) {
        return 'Hello, Clime!';
    }
}
```

## Sub commands

Clime provides an easy way to create sub commands. The default entry of a clime command is `default.js` (`default.ts` before compilation).
Any other `.js` files under the same folder are considered as sub-command files.

Clime allows multi-level sub commands via folders, for three-level commands like:

```text
command

command foo
command foo biu
command foo yo

command bar
command bar bia
command bar pia
```

The file structure could be:

```text
- commands
  - default.ts
  - foo.ts
  - foo
    - biu.ts
    - yo.ts
  - bar
    - default.ts
    - bia.ts
    - pia.ts
```

You may notice that the level-n entry could be either at the same level of the level-(n+1) commands with name `default.ts` (like `default.ts` in `bar`),
or at the same level of the folder of level-(n+1) commands (like `foo.ts` and folder `foo`).

### Command entry with description only

Clime allows an entry of a group of sub commands to provide only descriptions rather than an actual command.
Just export `description` and `brief` directly from the entry module to do so:

```ts
export const description = 'Some detailed description';

// Used when listing as sub commands, optional.
export const brief = 'brief description';
```

# CLI and shim

Clime in its core provides an object-based command line structure, a pure Clime CLI object could be like this:

```ts
// The second parameter is the path to folder that contains command files.
let cli = new CLI('command', Path.join(__dirname, 'commands'));
```

To make it work with stdio-based shell, we need to apply a shim:

```ts
let shim = new Shim(cli);
shim.execute(process.argv);
```

If you look into the code of objects like `HelpInfo`, you will find it implements the `Printable` interface.
This is how the shim going to print an object to stdout or stderr.

# Install

```shell
npm install clime --save
```

# License

MIT License.
