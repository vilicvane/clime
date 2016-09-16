import * as FS from 'fs';

export function safeStat(path: string): Promise<FS.Stats | undefined> {
    return new Promise<FS.Stats | undefined>(resolve => {
        FS.stat(path, (error, stats) => {
            resolve(error ? undefined : stats);
        });
    });
}
