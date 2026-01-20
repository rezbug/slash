import { createState } from "../state";
import type { Reactive } from "../types";
import type { LoaderState, RouteLoader } from "./types";

// Cache com TTL de 5 minutos
const CACHE_TTL = 5 * 60 * 1000;
const loaderCache = new Map<string, { data: unknown; timestamp: number }>();

// Cria cache key baseado em loader, params e query
function createCacheKey(params: Record<string, string>, query: URLSearchParams): string {
  const paramsStr = JSON.stringify(params);
  const queryStr = query.toString();
  return `${paramsStr}:${queryStr}`;
}

// Verifica se cache ainda é válido
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// Limpa todo o cache de loaders
export function clearLoaderCache(): void {
  loaderCache.clear();
}

// Tipo de retorno do runLoader
type LoaderResult<Data> = {
  loading: Reactive<boolean>;
  data: Reactive<Data | null>;
  error: Reactive<Error | null>;
};

// Executa e gerencia loaders de rota
export function runLoader<Params extends Record<string, string>, Data>(
  loader: RouteLoader<Params, Data>,
  params: Params,
  query: URLSearchParams,
): LoaderResult<Data> {
  // Criar estado reativo para o loader
  const loaderState = createState<LoaderState<Data>>({
    loading: false,
    data: null,
    error: null,
  });

  // Helper para criar Reactive de uma propriedade específica
  const createPropertyReactive = <K extends keyof LoaderState<Data>>(
    key: K
  ): Reactive<LoaderState<Data>[K]> => {
    return {
      get: () => loaderState.get()[key],
      subscribe: (fn: (v: LoaderState<Data>[K]) => void) => {
        return loaderState.watch((state) => fn(state[key]));
      },
    };
  };

  // Criar o objeto de retorno uma única vez
  const loaderResult: LoaderResult<Data> = {
    loading: createPropertyReactive("loading"),
    data: createPropertyReactive("data"),
    error: createPropertyReactive("error"),
  };

  // Criar cache key
  const cacheKey = createCacheKey(params, query);

  // Verificar se existe cache válido
  const cached = loaderCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    loaderState.set({
      loading: false,
      data: cached.data as Data,
      error: null,
    });
    return loaderResult;
  }

  // Executar loader
  try {
    const result = loader(params, query);

    // Verificar se é Promise (assíncrono)
    if (result instanceof Promise) {
      loaderState.set({
        loading: true,
        data: null,
        error: null,
      });

      result
        .then((data) => {
          loaderState.set({
            loading: false,
            data,
            error: null,
          });

          // Cachear resultado
          loaderCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        })
        .catch((error) => {
          loaderState.set({
            loading: false,
            data: null,
            error: error as Error,
          });
        });
    } else {
      // Loader síncrono
      loaderState.set({
        loading: false,
        data: result,
        error: null,
      });

      // Cachear resultado
      loaderCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    // Erro síncrono
    loaderState.set({
      loading: false,
      data: null,
      error: error as Error,
    });
  }

  return loaderResult;
}
