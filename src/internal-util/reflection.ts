export function parseFunctionParameterNames(fn: Function): string[] | undefined {
  let groups = fn
    .toString()
    .match(/^[^{=]*\(([\w\d$-,\s]*)\)/);

  return groups ? groups[1].trim().split(/\s*,\s*/) : undefined;
}

export function getFunctionParameterName(fn: Function, index: number): string {
  let paramNames: string[] | undefined;

  if ((<any>fn).__paramNames) {
    paramNames = (<any>fn).__paramNames;
  } else {
    paramNames = (<any>fn).__paramNames = parseFunctionParameterNames(fn);
  }

  return paramNames && paramNames[index] || 'param' + index;
}
