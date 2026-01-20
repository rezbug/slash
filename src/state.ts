export type State<T = unknown> = object & T;

export type StateWatcher<T> = (params: T) => void;

export type StateManager<T = unknown> = {
  set: (value: State<T>) => void;
  get: () => State<T>;
  watch: (callback: StateWatcher<T>) => () => void;
};

// Clone profundo que preserva instâncias especiais (Error, Date, etc)
function deepClone<T>(obj: T): T {
  // Primitivos e null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Error objects - preservar sem clonar
  if (obj instanceof Error) {
    return obj;
  }

  // Date objects - criar nova instância
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  // Objects
  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export const createState = <S = unknown>(
  initialState: State<S>,
): StateManager<S> => {
  const _state = deepClone(initialState);
  const _watchers = new Set<StateWatcher<S>>();

  const _notifyHandlers = (payload: State<S>) => {
    for (const stateWatcher of _watchers) {
      stateWatcher(payload);
    }
  };

  const set = (payload: State<S>) => {
    Object.assign(_state, deepClone(payload));
    _notifyHandlers(deepClone(_state));
  };

  const get = (): State<S> => {
    // Notificar sistema de rastreamento de componentes (se existir)
    if (typeof globalThis !== "undefined" && (globalThis as any).__SLASH_TRACK_STATE__) {
      (globalThis as any).__SLASH_TRACK_STATE__(stateManager);
    }
    const cloned = deepClone(_state);

    // Em SSR, criar Proxy para rastrear acessos a propriedades
    if (typeof globalThis !== "undefined" && (globalThis as any).__SLASH_SSR__ && typeof cloned === 'object' && cloned !== null) {
      const handler: ProxyHandler<any> = {
        get(target, prop) {
          let value = target[prop];

          // Se o valor é um array, criar Proxy para interceptar métodos como .map()
          if (Array.isArray(value)) {
            const arrayHandler: ProxyHandler<any[]> = {
              get(arrTarget, arrProp) {
                const arrValue = arrTarget[arrProp as any];

                // Interceptar métodos que retornam novos arrays
                if (arrProp === 'map' || arrProp === 'filter' || arrProp === 'slice') {
                  return function(...args: any[]) {
                    const result = (arrValue as Function).apply(arrTarget, args);
                    // Rastrear o resultado do método
                    if ((globalThis as any).__SLASH_TRACK_ACCESS__) {
                      (globalThis as any).__SLASH_TRACK_ACCESS__(stateManager, arrProp, result);
                    }
                    return result;
                  };
                }

                return arrValue;
              }
            };
            const arrayProxy = new Proxy(value, arrayHandler);

            // Notificar sobre acesso ao array (agora com Proxy)
            if ((globalThis as any).__SLASH_TRACK_ACCESS__) {
              (globalThis as any).__SLASH_TRACK_ACCESS__(stateManager, prop, arrayProxy);
            }

            return arrayProxy;
          }

          // Notificar sistema de rastreamento sobre acesso específico
          if ((globalThis as any).__SLASH_TRACK_ACCESS__) {
            (globalThis as any).__SLASH_TRACK_ACCESS__(stateManager, prop, value);
          }

          return value;
        }
      };
      return new Proxy(cloned, handler);
    }

    return cloned;
  };

  const watch = (callback: StateWatcher<S>): (() => void) => {
    _watchers.add(callback);
    // Retornar função de unwatch
    return () => {
      _watchers.delete(callback);
    };
  };

  const stateManager = { set, get, watch };
  return stateManager;
};
