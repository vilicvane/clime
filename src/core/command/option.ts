import { GeneralValidator } from './';

export interface OptionOptions<T> {
    flag?: string;
    type?: Constructor<T>;
    required?: boolean;
    validator?: GeneralValidator<T>;
    validators?: GeneralValidator<T>[];
    toggle?: boolean;
    default?: T;
    description?: string;
}

export interface OptionDefinition<T> {
    name: string;
    flag: string;
    toggle: boolean;
    type: Constructor<T>;
    required: boolean;
    validators: GeneralValidator<T>[];
    default: T;
    description: string;
}

export class Options {
    private _optionsMark: void;
    static definitions: OptionDefinition<any>[];
}

export function option<T>(
    {
        flag,
        toggle,
        type,
        required,
        validator,
        validators,
        default: defaultValue,
        description
    }: OptionOptions<T> = {}
) {
    if (!validators) {
        validators = validator ? [validator] : [];
    }

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
            flag,
            toggle,
            type,
            required,
            validators,
            default: defaultValue,
            description
        });
    };
}
