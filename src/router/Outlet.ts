import type { Child } from "../types";
import { executeGuard } from "./guards";
import { runLoader } from "./loaders";
import { matchRoute } from "./matching";
import { router } from "./state";
import type { LoaderState, OutletProps } from "./types";

// Cache de resultados de guards por rota (similar ao Route.ts)
const guardCache = new Map<string, { executing: boolean; result: boolean | string | null }>();

/**
 * Limpa o cache de guards do Outlet
 */
export function clearOutletGuardCache(): void {
  guardCache.clear();
}

/**
 * Componente Outlet
 * Renderiza rotas aninhadas (nested routes)
 */
export function Outlet(props: OutletProps): Child {
  const { routes, parentPath = "", parentParams = {} } = props;

  if (!routes || routes.length === 0) {
    return null;
  }

  const pathname = router.pathname.get();

  // Tentar fazer match com cada rota
  for (const route of routes) {
    // Combinar parentPath com path da rota
    const fullPath = combinePaths(parentPath, route.path);

    // Se a rota tem children, verificar se pathname começa com fullPath
    // Caso contrário, fazer match exato
    let match: ReturnType<typeof matchRoute> | null = null;

    if (route.children && route.children.length > 0) {
      // Para rotas com children, verificar prefixo
      if (pathname.startsWith(fullPath)) {
        // Simular match com params vazios (será preenchido recursivamente)
        match = { path: fullPath, params: {}, score: 0 };
      }
    } else {
      // Para rotas sem children, fazer match exato
      match = matchRoute(fullPath, pathname);
    }

    if (match) {
      // Mesclar params do parent com params da rota
      const allParams = { ...parentParams, ...match.params };

      // Atualizar params no router state
      router._setState({ params: allParams });

      // Executar guard se fornecido
      if (route.guard) {
        const query = router.query.get();
        const cacheKey = `${fullPath}-${JSON.stringify(allParams)}-${query.toString()}`;

        let guardState = guardCache.get(cacheKey);

        if (!guardState) {
          guardState = { executing: true, result: null };
          guardCache.set(cacheKey, guardState);

          executeGuard(route.guard, allParams, query).then((result) => {
            const cached = guardCache.get(cacheKey);
            if (cached) {
              cached.executing = false;
              cached.result = result;
            }

            if (typeof result === "string") {
              router.navigate(result);
            } else {
              router._setState({ isNavigating: false });
            }
          });
        }

        if (guardState.executing) {
          return null;
        }

        if (guardState.result !== true) {
          return null;
        }
      }

      // Executar loader se fornecido
      let loaderState: unknown;

      if (route.loader) {
        const query = router.query.get();
        loaderState = runLoader(route.loader, allParams, query);
      }

      // Se a rota tem children, tentar renderizar children
      let outlet: Child = null;

      if (route.children && route.children.length > 0) {
        outlet = Outlet({
          routes: route.children,
          parentPath: fullPath,
          parentParams: allParams,
        });
      }

      // Renderizar o componente da rota
      return route.component({
        params: allParams,
        loaderState,
        outlet,
      });
    }
  }

  return null;
}

/**
 * Combina dois paths
 * @param parent - Path do parent
 * @param child - Path do child
 * @returns Path combinado
 */
function combinePaths(parent: string, child: string): string {
  // Normalizar paths (remover trailing slashes)
  const normalizedParent = parent.replace(/\/$/, "");
  const normalizedChild = child.startsWith("/") ? child : `/${child}`;

  // Se parent está vazio, retornar apenas child
  if (!normalizedParent) {
    return normalizedChild;
  }

  // Combinar paths
  return normalizedParent + normalizedChild;
}
