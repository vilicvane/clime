import * as FS from 'fs';
import * as Path from 'path';

import * as v from 'villa';

export async function safeStat(path: string): Promise<FS.Stats | void> {
    return await v.call(FS.stat, path).catch(v.bear);
}

export function joinPaths(roots: string[], relPath: string): string[] {
    return roots.map(root => Path.join(root, relPath));
}

export type PathType = 'file' | 'dir';

export async function findPaths(type: PathType, roots: string[], relPath?: string): Promise<string[] | undefined> {
    let paths = relPath ? joinPaths(roots, relPath) : roots;

    paths = await v.filter(paths, async path => {
        let stats = await safeStat(path);

        if (!stats) {
            return false;
        }

        switch (type) {
            case 'file':
                return stats.isFile();
            case 'dir':
                return stats.isDirectory();
        }
    });

    return paths.length ? paths : undefined;
}
