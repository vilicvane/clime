export function deduplicate<T>(values: T[]): T[] {
  let set = new Set<T>();
  return values.filter(value => {
    if (set.has(value)) {
      return false;
    } else {
      set.add(value);
      return true;
    }
  })
}
