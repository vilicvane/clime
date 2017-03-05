interface Promise<T> {
  /** This is to ensure TypeScript checks the generic type of Promise. */
  __generic__: T;
}

interface PromiseLike<T> {
  /** This is to ensure TypeScript checks the generic type of Promise. */
  __generic__: T;
}
