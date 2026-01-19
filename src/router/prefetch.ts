/**
 * Pre-fetching system for routes
 * Client-only functionality
 *
 * @module router/prefetch
 */

import type { LazyImport } from "./lazy";
import { isLazyLoaded, preloadLazy } from "./lazy";
import type { RouteLoader } from "./types";

/**
 * Prefetch options
 */
export interface PrefetchOptions {
  /** Delay in ms before prefetching (default: 50ms) */
  delay?: number;
  /** Whether to prefetch loader data (default: true) */
  data?: boolean;
  /** Whether to prefetch lazy component (default: true) */
  component?: boolean;
}

/**
 * Route configuration for prefetching
 */
export interface PrefetchRoute {
  /** Path of the route to prefetch */
  path: string;
  /** Lazy component import function */
  component?: LazyImport<any>;
  /** Route data loader */
  loader?: RouteLoader<any>;
}

// Registry of routes for prefetching
const routeRegistry = new Map<string, PrefetchRoute>();

// Track prefetch timers for debouncing
const prefetchTimers = new Map<string, number>();

// Track what has been prefetched to avoid duplicates
const prefetched = new Set<string>();

/**
 * Register a route for prefetching
 * Call this when defining routes to make them prefetchable
 */
export function registerRoute(path: string, config: Omit<PrefetchRoute, "path">): void {
  routeRegistry.set(path, { path, ...config });
}

/**
 * Prefetch a route (component and/or loader data)
 * Client-only - noop on server
 *
 * @example
 * ```ts
 * // Prefetch everything
 * prefetch('/users/123')
 *
 * // Prefetch only component
 * prefetch('/users/123', { data: false })
 *
 * // Custom delay
 * prefetch('/users/123', { delay: 100 })
 * ```
 */
export function prefetch(path: string, options: PrefetchOptions = {}): void {
  // Noop on server
  if (typeof window === "undefined") {
    return;
  }

  const { delay = 50, data: prefetchData = true, component: prefetchComponent = true } = options;

  // Cancel any pending prefetch for this path
  const existingTimer = prefetchTimers.get(path);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Debounce prefetching
  const timer = setTimeout(() => {
    prefetchTimers.delete(path);
    doPrefetch(path, prefetchComponent, prefetchData);
  }, delay) as unknown as number;

  prefetchTimers.set(path, timer);
}

/**
 * Internal function to actually perform prefetch
 */
async function doPrefetch(
  path: string,
  shouldPrefetchComponent: boolean,
  shouldPrefetchData: boolean,
): Promise<void> {
  // Check if already prefetched
  const cacheKey = `${path}:${shouldPrefetchComponent}:${shouldPrefetchData}`;
  if (prefetched.has(cacheKey)) {
    return;
  }

  const route = routeRegistry.get(path);
  if (!route) {
    // Route not registered - can't prefetch
    return;
  }

  // Mark as prefetched before starting to avoid duplicate requests
  prefetched.add(cacheKey);

  try {
    // Prefetch component if needed
    if (shouldPrefetchComponent && route.component) {
      // Only prefetch if not already loaded
      if (!isLazyLoaded(route.component)) {
        await preloadLazy(route.component);
      }
    }

    // Prefetch loader data if needed
    if (shouldPrefetchData && route.loader) {
      // Extract params from path (simple implementation)
      const params = extractParamsFromPath(path);
      const query = new URLSearchParams();

      // Execute loader (result will be handled by useLoader when route is actually navigated to)
      // We just want to warm up any external caches (API calls, etc)
      try {
        await route.loader({ params, query });
      } catch {
        // Ignore loader errors during prefetch - they'll be handled properly during actual navigation
      }
    }
  } catch (error) {
    // Remove from prefetched set on error so we can retry
    prefetched.delete(cacheKey);

    // Silent failure - prefetch is optimization, not critical
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Slash Router] Failed to prefetch ${path}:`, error);
    }
  }
}

/**
 * Extract params from a path (simplified - doesn't handle patterns)
 * For full param extraction, the router would need to match against route patterns
 */
function extractParamsFromPath(_path: string): Record<string, string> {
  // This is a simplified version - in real usage, the router would
  // match the path against route patterns to extract params
  // For prefetching, we often don't need params anyway
  return {};
}

/**
 * Clear all prefetch caches and timers
 * Useful for testing
 */
export function clearPrefetchCache(): void {
  // Clear timers
  for (const timer of prefetchTimers.values()) {
    clearTimeout(timer);
  }
  prefetchTimers.clear();

  // Clear prefetched tracking
  prefetched.clear();

  // Note: Don't clear routeRegistry as routes are defined at module level
}

/**
 * Check if a path has been prefetched
 * Useful for testing
 */
export function isPrefetched(path: string, component = true, data = true): boolean {
  const cacheKey = `${path}:${component}:${data}`;
  return prefetched.has(cacheKey);
}
