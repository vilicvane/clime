# Clime

The Command Line Interface Framework for TypeScript.

# Features

- Schema based parameter casting.
- Automatic usage generating.




Testable:

```ts
class TestingShell {
    prepare() {

    }
}

let shell = new TestingShell({
    templateDir: ''
});

shell.prepare({
    ssid: 'nanchao-1',
    password: ''
}, context => {
    command.execute('', 0, [1, 2, 3], context);
});
```


