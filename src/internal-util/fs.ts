import * as FS from 'fs';
import * as Path from 'path';

import * as v from 'villa';

export async function safeStat(path: string): Promise<FS.Stats | undefined> {
  return v.call(FS.stat, path).catch(v.bear);
}

export function existsFile(
  path: string,
  filename: string = 'default',
): string | undefined {
  const checkPaths = [Path.join(path, filename)];

  if (filename === 'default') {
    checkPaths.unshift(path);
  }

  for (const check of checkPaths) {
    try {
      return require.resolve(check);
    } catch {
      continue;
    }
  }

  return undefined;
}

export async function existsDir(path: string): Promise<boolean> {
  let stats = await safeStat(path);
  return !!stats && stats.isDirectory();
}
