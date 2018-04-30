import * as FS from 'fs';
import * as Path from 'path';

import * as v from 'villa';

export async function safeStat(path: string): Promise<FS.Stats | undefined> {
  return v.call(FS.stat, path).catch(v.bear);
}

export async function existsFile(path: string): Promise<boolean> {
  let stats = await safeStat(path);
  return !!stats && stats.isFile();
}

export async function existsSourceFile(path: string, filename: string = 'default'): Promise<string | undefined> {
  const checkPaths = [
    Path.join(path, `${filename}.js`),
    Path.join(path, `${filename}.ts`),
  ];

  if (filename === 'default') {
    checkPaths.unshift(
      `${path}.js`,
      `${path}.ts`,
    )
  }

  for (const check of checkPaths) {
    if (await existsFile(check)) {
      return check;
    }
  }

  return undefined;
}

export async function existsDir(path: string): Promise<boolean> {
  let stats = await safeStat(path);
  return !!stats && stats.isDirectory();
}
