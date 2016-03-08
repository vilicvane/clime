export function parseFunctionParameterNames(fn: Function): string[] {
    let groups = fn
        .toString()
        .match(/^[^{=]*\(([\w\d$-,\s]*)\)/);

    return groups && groups[1].trim().split(/\s*,\s*/);
}

export function getFunctionParameterName(fn: Function, index: number): string {
    let paramNames: string[];

    if ((<any>fn).__paramNames) {
        paramNames = (<any>fn).__paramNames;
    } else {
        paramNames = (<any>fn).__paramNames = parseFunctionParameterNames(fn);
    }

    return paramNames[index] || 'param' + index;
}
