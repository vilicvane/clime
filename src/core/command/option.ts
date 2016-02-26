export interface OptionOptions<T> {
    type?: Constructor<T>;
    flag?: string;
    required?: boolean;
    toggle?: boolean;
    default?: T;
    description?: string;
}

export interface OptionDefinition<T> {
    name: string;
    flag: string;
    toggle: boolean;
    type: Constructor<T>;
    description: string;
    required: boolean;
    default: T;
}

export class Options {
    private _optionsMark: void;

    static definitions: OptionDefinition<any>[];
}

export function option<T>(
    {
        type,
        flag,
        toggle,
        required,
        default: defaultValue,
        description
    }: OptionOptions<T> = {}
) {
    return (target: Options, name: string) => {
        let constructor = target.constructor as typeof Options;
        let definitions = constructor.definitions;

        if (definitions) {
            definitions = constructor.definitions;
        } else {
            definitions = constructor.definitions = [];
        }

        type = type || Reflect.getMetadata('design:type', target, name);

        definitions.push({
            name,
            type,
            flag,
            toggle,
            default: defaultValue,
            required,
            description
        });
    };
}
