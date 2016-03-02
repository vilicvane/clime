declare namespace Clime {
    interface HashTable<T> {
        [key: string]: T;
    }

    interface Constructor<T> {
        new(...args: any[]): T;
    }
}
