import * as FS from 'fs';
import * as Path from 'path';

import * as v from 'villa';

import {CastingContext, ExpectedError} from '../core';

export class File {
  readonly baseName: string;
  readonly fullName: string;
  readonly default: boolean;

  private constructor(
    readonly source: string,
    readonly cwd: string,
    usingDefault: boolean,
  ) {
    this.baseName = Path.basename(source);
    this.fullName = Path.resolve(cwd, source);
    this.default = usingDefault;
  }

  require<T>(): T {
    try {
      return require(this.fullName);
    } catch (error) {
      throw new ExpectedError(`Error requiring file "${this.source}"`);
    }
  }

  async buffer(): Promise<Buffer> {
    await this.assert();
    return v.call<Buffer>(FS.readFile, this.fullName);
  }

  async text(encoding = 'utf-8'): Promise<string> {
    await this.assert();
    return v.call<string>(FS.readFile, this.fullName, encoding);
  }

  async json<T>(encoding?: string): Promise<T> {
    let json = await this.text(encoding);
    return JSON.parse(json);
  }

  async assert(exists = true): Promise<void> {
    let stats = await v.call(FS.stat, this.fullName).catch(v.bear);

    if (exists) {
      if (!stats) {
        throw new ExpectedError(`File "${this.source}" does not exist`);
      }

      if (!stats.isFile()) {
        throw new ExpectedError(
          `Object "${this.source}" is expected to be a file`,
        );
      }
    } else if (stats) {
      throw new ExpectedError(`Object "${this.source}" already exists`);
    }
  }

  async exists(): Promise<boolean>;
  async exists(extensions: string[]): Promise<string | undefined>;
  async exists(extensions?: string[]): Promise<boolean | string | undefined> {
    let extensionsSpecified = !!extensions;

    for (let extension of extensions || ['']) {
      let path = this.fullName + extension;
      let stats = await v.call(FS.stat, path).catch(v.bear);

      if (stats && stats.isFile()) {
        return extensionsSpecified ? path : true;
      }
    }

    return extensionsSpecified ? undefined : false;
  }

  static cast(name: string, context: CastingContext<File>): File {
    return new this(name, context.cwd, context.default);
  }
}

export class Directory {
  readonly baseName: string;
  readonly fullName: string;
  readonly default: boolean;

  private constructor(
    readonly source: string,
    readonly cwd: string,
    usingDefault: boolean,
  ) {
    this.baseName = Path.basename(source);
    this.fullName = Path.resolve(cwd, source);
    this.default = usingDefault;
  }

  async assert(exists = true): Promise<void> {
    let stats = await v.call(FS.stat, this.fullName).catch(v.bear);

    if (exists) {
      if (!stats) {
        throw new ExpectedError(`Directory "${this.source}" does not exist`);
      }

      if (!stats.isDirectory()) {
        throw new ExpectedError(
          `Object "${this.source}" is expected to be a directory`,
        );
      }
    } else if (stats) {
      throw new ExpectedError(`Object "${this.source}" already exists`);
    }
  }

  async exists(): Promise<boolean> {
    let stats = await v.call(FS.stat, this.fullName).catch(v.bear);
    return !!stats && stats.isDirectory();
  }

  static cast(name: string, context: CastingContext<Directory>): Directory {
    return new this(name, context.cwd, context.default);
  }
}
