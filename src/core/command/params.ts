import {
    Command
} from './command';

export interface ParamsOptions<T> {
    type: Constructor<T>;
    required?: boolean;
    description?: string;
}

export interface ParamsDefinition<T> {
    name: string;
    index: number;
    type: Constructor<T>;
    required: boolean;
    description: string;
}

export function params<T>(options: ParamsOptions<T>) {
    return (target: Command, name: 'execute', index: number) => {
        let constructor = target.constructor as typeof Command;

        if (constructor.paramsDefinition) {
            throw new Error('Can only define one `params` parameter');
        }

        let paramDefinitions = constructor.paramDefinitions || [];

        let type = options.type ||
            Reflect.getMetadata('design:paramtypes', target, 'execute')[index] as Constructor<T>;

        // TODO: Avoid unnecessary parsing.
        let groups = target
            .execute
            .toString()
            .match(/^[^{=]*\(([\w\d$-,\s]*)\)/);

        let paramNames = groups && groups[1].trim().split(/\s*,\s*/);
        let paramName: string;

        if (paramNames && paramNames.length > index) {
            paramName = paramNames[index];
        } else {
            paramName = 'params';
        }

        constructor.paramsDefinition = {
            name: paramName,
            index,
            type,
            required: options.required,
            description: options.description
        };
    };
}
