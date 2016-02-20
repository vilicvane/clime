export function memorize(): MethodDecorator {
    return (target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
        let getter = descriptor.get;
        let value = descriptor.value;

        let fn: Function;
        let descriptorItemName: string;

        if (getter) {
            fn = getter;
            descriptorItemName = 'get';
        } else if (typeof value === 'function') {
            fn = value;
            descriptorItemName = 'value';
        }

        if (!fn) {
            throw new TypeError('Invalid decoration');
        }

        let hasCache = false;
        let cache: any;

        return {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            [descriptorItemName]() {
                if (hasCache) {
                    return cache;
                }

                cache = fn.call(this);
                hasCache = true;

                return cache;
            }
        };
    };
}
