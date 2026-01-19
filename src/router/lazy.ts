/**
 * Lazy loading system for routes
 *
 * Provides code splitting capabilities to load route components on demand.
 * In SSR mode, components must be pre-loaded before rendering.
 * In CSR mode, components are loaded dynamically with loading state.
 */

import { createState } from "../state";
import type { Child, Component } from "../types";

// Detecta SSR: sem window OU running em Bun test
const IS_SSR = typeof window === "undefined" || (typeof Bun !== "undefined" && (Bun as any)?.jest);

/**
 * Lazy component import function
 */
export type LazyImport<P = any> = () => Promise<{ default: Component<P> }>;

/**
 * Lazy component state
 */
export interface LazyState<P = any> {
  loading: boolean;
  component: Component<P> | null;
  error: Error | null;
}

/**
 * Cache for loaded lazy components
 * Using Map with function reference as key for proper identity tracking
 */
const lazyCache = new Map<LazyImport, Component>();

/**
 * Cache for loading promises (prevents duplicate loads)
 */
const loadingPromises = new Map<LazyImport, Promise<Component>>();

/**
 * Creates a lazy-loaded component wrapper
 *
 * @param importFn - Function that returns a Promise with the component module
 * @param fallback - Optional fallback to show during loading (default: null)
 * @returns Component that loads dynamically on first render
 *
 * @example
 * ```typescript
 * const LazyAbout = lazy(() => import('./About'))
 *
 * <Route path="/about" component=${LazyAbout} />
 * ```
 *
 * SSR behavior:
 * - Components must be pre-loaded before rendering via preloadLazy()
 * - If not pre-loaded, returns fallback (or null)
 *
 * CSR behavior:
 * - Loads component dynamically on first render
 * - Shows fallback during loading
 * - Caches component after first load
 */
export function lazy<P = any>(importFn: LazyImport<P>, fallback?: Child): Component<P> {
  // Wrapper component
  return (props: P): Child => {
    // Check cache first
    const cached = lazyCache.get(importFn);
    if (cached) {
      return (cached as Component<P>)(props);
    }

    // SSR: return fallback if not pre-loaded
    if (IS_SSR) {
      return fallback || null;
    }

    // CSR: load component dynamically
    // Create reactive state for this lazy component
    const state = createState<LazyState<P>>({
      loading: true,
      component: null,
      error: null,
    });

    // Check if already loading
    let loadPromise = loadingPromises.get(importFn);

    if (!loadPromise) {
      // Start loading
      loadPromise = importFn()
        .then((module) => {
          const component = module.default;
          lazyCache.set(importFn, component);
          loadingPromises.delete(importFn);

          state.set({
            loading: false,
            component,
            error: null,
          });

          return component;
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          loadingPromises.delete(importFn);

          state.set({
            loading: false,
            component: null,
            error,
          });

          throw error;
        });

      loadingPromises.set(importFn, loadPromise);
    }

    // Get current state
    const currentState = state.get();

    // Show error state
    if (currentState.error) {
      return null;
    }

    // Show loading state
    if (currentState.loading || !currentState.component) {
      return fallback || null;
    }

    // Render loaded component
    return currentState.component(props);
  };
}

/**
 * Pre-loads a lazy component (useful for SSR or prefetching)
 *
 * @param importFn - Lazy import function
 * @returns Promise that resolves to the loaded component
 *
 * @example
 * ```typescript
 * // SSR: Pre-load all lazy components before rendering
 * await Promise.all([
 *   preloadLazy(() => import('./About')),
 *   preloadLazy(() => import('./Dashboard'))
 * ])
 *
 * const html = renderToString(app)
 * ```
 */
export async function preloadLazy<P = any>(importFn: LazyImport<P>): Promise<Component<P>> {
  // Check cache first
  const cached = lazyCache.get(importFn);
  if (cached) {
    return cached as Component<P>;
  }

  // Check if already loading
  const loading = loadingPromises.get(importFn);
  if (loading) {
    return loading as Promise<Component<P>>;
  }

  // Load component
  const loadPromise = importFn()
    .then((module) => {
      const component = module.default;
      lazyCache.set(importFn, component);
      loadingPromises.delete(importFn);
      return component;
    })
    .catch((err) => {
      loadingPromises.delete(importFn);
      throw err;
    });

  loadingPromises.set(importFn, loadPromise);
  return loadPromise as Promise<Component<P>>;
}

/**
 * Checks if a lazy component is already loaded
 *
 * @param importFn - Lazy import function
 * @returns true if component is loaded and cached
 */
export function isLazyLoaded(importFn: LazyImport): boolean {
  return lazyCache.has(importFn);
}

/**
 * Clears the lazy component cache
 * Useful for testing or forcing reloads
 */
export function clearLazyCache(): void {
  lazyCache.clear();
  loadingPromises.clear();
}
