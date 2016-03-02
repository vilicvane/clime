import { GeneralValidator } from './';

export interface OptionOptions<T> {
    name?: string;
    flag?: string;
    placeholder?: string;
    type?: Clime.Constructor<T>;
    required?: boolean;
    validator?: GeneralValidator<T>;
    validators?: GeneralValidator<T>[];
    toggle?: boolean;
    default?: T;
    description?: string;
}

export interface OptionDefinition<T> {
    name: string;
    key: string;
    flag: string;
    placeholder: string;
    toggle: boolean;
    type: Clime.Constructor<T>;
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
        name: optionName,
        flag,
        placeholder,
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
            name: optionName || name,
            key: name,
            flag,
            placeholder,
            toggle,
            type,
            required,
            validators,
            default: defaultValue,
            description
        });
    };
}
