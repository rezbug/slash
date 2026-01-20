import { createState } from "../state";
import type { Reactive } from "../types";
import type { NavigateOptions, RouterState } from "./types";

declare global {
  var __SLASH_SSR__: boolean | undefined;
}

// Detecta SSR: sem window OU flag global __SLASH_SSR__
const isSSR = () => typeof window === "undefined" || globalThis.__SLASH_SSR__ === true;

const initialState: RouterState = {
  pathname: "/",
  params: {},
  search: "",
  isNavigating: false,
};

const routerState = createState(initialState);

// Helper para criar Reactive de uma propriedade específica
const createPropertyReactive = <K extends keyof RouterState>(
  key: K
): Reactive<RouterState[K]> => {
  return {
    get: () => routerState.get()[key],
    subscribe: (fn: (v: RouterState[K]) => void) => {
      return routerState.watch((state) => fn(state[key]));
    },
  };
};

// Helper reativo para query (URLSearchParams)
const createQueryReactive = (): Reactive<URLSearchParams> => {
  return {
    get: () => new URLSearchParams(routerState.get().search),
    subscribe: (fn: (v: URLSearchParams) => void) => {
      return routerState.watch((state) => {
        fn(new URLSearchParams(state.search));
      });
    },
  };
};

export const router = {
  // Propriedades reativas
  pathname: createPropertyReactive("pathname"),
  params: createPropertyReactive("params"),
  query: createQueryReactive(),
  isNavigating: createPropertyReactive("isNavigating"),

  // Métodos de navegação
  navigate(to: string, options?: NavigateOptions) {
    if (isSSR()) {
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
    if (!isSSR() && window.history) {
      window.history.back();
    }
  },

  forward() {
    if (!isSSR() && window.history) {
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
