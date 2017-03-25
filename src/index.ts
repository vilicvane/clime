import 'reflect-metadata';

import './lang';

export * from './core';
export * from './shim';

import * as CastableObject from './castable-object';
import * as Validation from './validation';

export {
  CastableObject,
  CastableObject as Object,
  Validation,
};
