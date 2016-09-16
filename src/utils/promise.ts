export function invoke(fn: Function, ...args: any[]): Promise<void>;
export function invoke<T>(fn: Function, ...args: any[]): Promise<T>;
export function invoke<T>(fn: Function, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        fn(...args, (error: any, value: T) => {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}
