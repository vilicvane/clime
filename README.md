# Clime

The Command Line Interface Framework for TypeScript.


```ts
import {
    Command,
    command,
    param
} from '../../';

@command({
    description: 'Hello, Clime!'
})
export default class extends Command {
    execute(
        @param({
            required: true
        })
        foo: string,

        @param({
            default: 0
        })
        bar: number
    ) {
        console.log('foo', typeof foo, foo);
        console.log('bar', typeof bar, bar);
    }
}
```

# Features

- Schema based parameter casting.
- Automatic usage generating.

# Roadmap

- Interaction integration.


