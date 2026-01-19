import type { GuardResult, RouteGuard } from "./types";

/**
 * Execute a route guard function
 * @param guard - Guard function to execute
 * @param params - Route parameters
 * @param query - URL search params
 * @returns Promise resolving to boolean (allow/deny) or string (redirect path)
 */
export async function executeGuard<Params extends Record<string, string> = Record<string, string>>(
  guard: RouteGuard<Params>,
  params: Params,
  query: URLSearchParams,
): Promise<GuardResult> {
  const result = guard(params, query);

  // Handle async guards
  if (result instanceof Promise) {
    return await result;
  }

  // Handle sync guards
  return result;
}

/**
 * Combine multiple guards into a single guard
 * Executes guards in sequence, stops at first failure
 * @param guards - Guard functions to combine
 * @returns Combined guard function
 */
export function combineGuards<Params extends Record<string, string> = Record<string, string>>(
  ...guards: RouteGuard<Params>[]
): RouteGuard<Params> {
  return async (params: Params, query: URLSearchParams): Promise<GuardResult> => {
    for (const guard of guards) {
      const result = await executeGuard(guard, params, query);

      // Stop at first failure (false or redirect string)
      if (result !== true) {
        return result;
      }
    }

    // All guards passed
    return true;
  };
}
