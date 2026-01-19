import { createState } from "../state";
import type { Reactive } from "../types";
import type { NavigateOptions, RouterState } from "./types";

// Detecta SSR: sem window OU running em Bun test
const IS_SSR = typeof window === "undefined" || (typeof Bun !== "undefined" && (Bun as any)?.jest);

const initialState: RouterState = {
  pathname: "/",
  params: {},
  search: "",
  isNavigating: false,
};

const routerState = createState(initialState);

// Helper reativo para query (URLSearchParams)
const createQueryReactive = () => {
  return {
    get: () => new URLSearchParams(routerState.search.get()),
    subscribe: (fn: (v: URLSearchParams) => void) => {
      return routerState.search.subscribe((search) => {
        fn(new URLSearchParams(search));
      });
    },
  } as Reactive<URLSearchParams>;
};

export const router = {
  // Propriedades reativas (Proxy cria Reactive<T> automaticamente)
  pathname: routerState.pathname as Reactive<string>,
  params: routerState.params as Reactive<Record<string, string>>,
  query: createQueryReactive(),
  isNavigating: routerState.isNavigating as Reactive<boolean>,

  // Métodos de navegação
  navigate(to: string, options?: NavigateOptions) {
    if (IS_SSR) {
      // No servidor, apenas atualiza o estado (noop para navegação real)
      return;
    }

    const currentState = routerState.get();

    // Parsear URL
    const [pathname, search] = to.split("?");

    // Atualizar estado
    routerState.set({
      ...currentState,
      pathname: pathname || "/",
      search: search || "",
      isNavigating: false,
    });

    // Atualizar History API
    const method = options?.replace ? "replaceState" : "pushState";
    window.history[method](options?.state || null, "", to);
  },

  back() {
    if (!IS_SSR && window.history) {
      window.history.back();
    }
  },

  forward() {
    if (!IS_SSR && window.history) {
      window.history.forward();
    }
  },

  replace(to: string) {
    router.navigate(to, { replace: true });
  },

  // API interna para Router.ts
  _setState: (newState: Partial<RouterState>) => {
    const current = routerState.get();
    routerState.set({ ...current, ...newState });
  },

  _getState: () => routerState.get(),

  _watch: (callback: (state: RouterState) => void) => routerState.watch(callback),
};

// Listener para popstate (back/forward)
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const pathname = window.location.pathname;
    const search = window.location.search.slice(1); // Remove o '?'

    router._setState({
      pathname,
      search,
      isNavigating: false,
    });
  });
}
