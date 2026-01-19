import type { Reactive } from "./types";

export type State<T> = {
  get(): T;
  set(payload: T | ((prev: T) => T)): void;
  watch(callback: (payload: T) => void): () => void;
  subscribe(fn: (v: T) => void): () => void;
};

// Reactive estendido com map para arrays
export type ReactiveArray<T> = Reactive<T[]> & {
  map<R>(mapper: (item: T, index: number) => R): Reactive<R[]>;
};

// Tipo que mapeia cada propriedade de T para Reactive<T[key]>
type ReactiveProps<T> = {
  [K in keyof T]: T[K] extends Array<infer U> ? ReactiveArray<U> : Reactive<T[K]>;
};

export function createState<T extends object>(initialState: T): State<T> & ReactiveProps<T> {
  let state = deepClone(initialState);
  const watchers = new Set<(payload: T) => void>();

  const stateObj = {
    set: (payload: T | ((prev: T) => T)) => {
      const next = typeof payload === "function" ? (payload as (prev: T) => T)(state) : payload;
      if (isEqual(next, state)) return;
      state = deepClone(next);
      watchers.forEach((fn) => fn(state));
    },
    get: () => deepClone(state),
    watch: (callback: (payload: T) => void) => {
      watchers.add(callback);
      return () => watchers.delete(callback);
    },
    subscribe: (fn: (v: T) => void) => {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
  };

  // Proxy para acesso direto: counter.count
  return new Proxy(stateObj, {
    get(target, prop) {
      // Métodos do State
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      // Propriedades do estado - retorna Reactive
      if (prop in state) {
        return createDerivedProperty(target, prop as keyof T);
      }
      return undefined;
    },
  }) as State<T> & ReactiveProps<T>;
}

function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj)) as T;
}

function isEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!isEqual((a as any)[key], (b as any)[key])) {
      return false;
    }
  }

  return true;
}

// Cria um "signal" para cada propriedade acessada
function createDerivedProperty<T, K extends keyof T>(
  parent: { get(): T; subscribe(fn: (v: T) => void): () => void },
  key: K,
) {
  const reactive = {
    get: () => parent.get()[key],
    subscribe: (fn: (v: T[K]) => void) => {
      return parent.subscribe((fullState) => fn(fullState[key]));
    },
  };

  // Se for um array, adiciona o método map
  const value = parent.get()[key];
  if (Array.isArray(value)) {
    return {
      ...reactive,
      map: <R>(mapper: (item: any, index: number) => R): Reactive<R[]> => {
        return {
          get: () => (reactive.get() as any[]).map(mapper),
          subscribe: (fn: (v: R[]) => void) => {
            return reactive.subscribe((arr) => fn((arr as any[]).map(mapper)));
          },
        };
      },
    };
  }

  return reactive;
}
