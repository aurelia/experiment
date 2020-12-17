/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
/**
 * @internal - Shouldn't be used directly
 */
export interface IParsedQuery {
  parameters: Record<Exclude<string, '-unnamed'>, string> | (Record<Exclude<string, '-unnamed'>, string> & Record<'-unnamed', string[]>);
  list: string[];
}

/**
 * @internal - Shouldn't be used directly
 */
export interface IMergedParameters {
  namedParameters: Record<string, string>;
  parameterList: string[];
  merged: string[] | Record<string, string>;
}

/**
 * @internal - Shouldn't be used directly
 */
export function parseQuery(query: string | null | undefined): Record<string, string> {
  if (!query || !query.length) {
    return {};
  }
  const parameters: Record<string, string> = {};
  // TODO: Deal with complex parameters such as lists and objects
  const params: string[] = query.replace('+', ' ').split('&');
  for (const param of params) {
    const [key, value] = param.split('=');
    parameters[decodeURIComponent(key)] = decodeURIComponent(value !== void 0 ? value : key);
  }
  return parameters;
}
