import {
    Command
} from './command';

export interface ParamOptions<T> {
    type?: Constructor<T>;
    description?: string;
    required?: boolean;
    default?: T;
}

export interface ParamDefinition<T> {
    name: string;
    type: Constructor<T>;
    description: string;
    required: boolean;
    default: T;
}

export function param<T>(options: ParamOptions<T> = {}) {
    return (target: Command, name: 'execute', index: number) => {
        let constructor = target.constructor as typeof Command;
        let definitions = constructor.paramDefinitions;

        if (constructor.paramDefinitions) {
            definitions = constructor.paramDefinitions;
        } else {
            definitions = constructor.paramDefinitions = [];
        }

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
            paramName = 'param' + index;
        }

        definitions[index] = {
            name: paramName,
            type,
            required: options.required,
            default: options.default,
            description: options.description
        };
    };
}
