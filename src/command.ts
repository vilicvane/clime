import { Resolvable } from 'thenfail';

export interface CommandOption<T> {
    description?: string;
    required?: boolean;
    default?: T;
}

export interface ParamOptions<T> extends CommandOption<T> { }
export interface OptionOptions<T> extends CommandOption<T> { }

export function param<T>(options: ParamOptions<T> = {}): ParameterDecorator {
    return (target: Command, key: string, index: number) => {
        
    };
}

export interface OptionDefinition {
    type: Function;
    required: boolean;
}

interface OptionsSchema {
    _options: HashTable<OptionDefinition>;
}

export function option<T>(options: OptionOptions<T> = {}): PropertyDecorator {
    return (target: Object, key: string) => {
        let optionMap = (target as OptionsSchema)._options;
        
        optionMap[key] = {
            type: Reflect.getMetadata('design:type', target),
            required: options.required
        };
    };
}

// export function command(): ClassDecorator {
//     return (target: typeof Command) => {
        
//     };
// }

export interface OptionsOptions {
    
}

export interface OptionSchema {
    
}

export interface ParamSchema {
    
}

export abstract class Command {
    optionSchema: OptionSchema[];
    paramSchema: ParamSchema[];
    
    constructor(filename: string, cwd?: string) {
        
    }
    
    abstract execute(...args: any[]): Resolvable<void>;
}
