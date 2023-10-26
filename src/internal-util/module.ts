export function dynamicImport(path: string): Promise<any> {
  try {
    return require(path);
  } catch {
    // @ts-ignore
    const url = require('url').pathToFileURL(path).toString();
    return eval(`import(url)`);
  }
}
