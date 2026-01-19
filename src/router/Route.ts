import type { Child } from "../types";
import { executeGuard } from "./guards";
import { useLoader } from "./loaders";
import { matchRoute } from "./matching";
import { router } from "./state";
import type { Transition } from "./transitions";
import { applyEnterTransition } from "./transitions";
import type { LoaderState, ParseParams, RouteGuard, RouteLoader } from "./types";

export type RouteProps<Path extends string = string, Data = unknown> = {
  path: Path;
  component: (props: {
    params: ParseParams<Path>;
    loaderState?: LoaderState<Data>;
    outlet?: Child;
  }) => Child;
  loader?: RouteLoader<ParseParams<Path>, Data>;
  guard?: RouteGuard<ParseParams<Path>>;
  children?: Child;
  transition?: Transition;
};

type GuardExecutionState = {
  executing: boolean;
  result: boolean | string | null;
};

// Cache de resultados de guards por rota
const guardCache = new Map<string, GuardExecutionState>();

/**
 * Limpa o cache de guards (usado principalmente em testes)
 */
export function clearGuardCache(): void {
  guardCache.clear();
}

/**
 * Componente Route
 * Renderiza o component se o path corresponder à rota atual
 */
export function Route<Path extends string, Data = unknown>(props: RouteProps<Path, Data>): Child {
  // Obter pathname atual do router (propriedade reativa)
  const pathname = router.pathname.get();

  // Tentar fazer match
  const match = matchRoute(props.path, pathname);

  if (!match) {
    return null;
  }

  // Atualizar params no router state
  router._setState({ params: match.params });

  // Executar guard se fornecido
  if (props.guard) {
    const query = router.query.get();
    const cacheKey = `${props.path}-${JSON.stringify(match.params)}-${query.toString()}`;

    // Verificar cache
    let guardState = guardCache.get(cacheKey);

    if (!guardState) {
      // Criar novo estado de execução
      guardState = { executing: true, result: null };
      guardCache.set(cacheKey, guardState);

      // Executar guard de forma assíncrona
      executeGuard(props.guard, match.params as ParseParams<Path>, query).then((result) => {
        const cached = guardCache.get(cacheKey);
        if (cached) {
          cached.executing = false;
          cached.result = result;
        }

        // Se resultado é string (redirect), navegar
        if (typeof result === "string") {
          router.navigate(result);
        } else {
          // Forçar re-renderização atualizando o state
          router._setState({ isNavigating: false });
        }
      });
    }

    // Se guard ainda está executando, retornar null (ou loading state)
    if (guardState.executing) {
      return null;
    }

    // Se guard retornou false ou string, bloquear acesso
    if (guardState.result !== true) {
      return null;
    }
  }

  // Executar loader se fornecido
  let loaderState: LoaderState<Data> | undefined;

  if (props.loader) {
    const query = router.query.get();
    loaderState = useLoader(props.loader, match.params as ParseParams<Path>, query);
  }

  // Renderizar component com params, loaderState e outlet (children)
  const result = props.component({
    params: match.params as ParseParams<Path>,
    loaderState,
    outlet: props.children || null,
  });

  // Aplicar transição de entrada (client-only)
  if (props.transition && typeof result === "object" && result !== null && "nodeType" in result) {
    // result é um DOM element, aplicar transição
    applyEnterTransition(result as Element, props.transition);
  }

  return result;
}
