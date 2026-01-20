import type { Child } from "../types";
import { router } from "./state";
import type { RouterProps } from "./types";

/**
 * Componente Router
 * Gerencia navegação e renderiza rotas filhas
 *
 * @example
 * // SSR
 * Router({
 *   location: req.url,
 *   children: () => Route({ path: '/', component: Home })
 * })
 *
 * @example
 * // CSR
 * Router({
 *   children: () => Route({ path: '/', component: Home })
 * })
 */
export function Router(props: RouterProps): Child {
  // Atualizar estado PRIMEIRO, antes de processar children
  // Se location é fornecida, usar ela (SSR ou teste)
  if (props.location !== undefined) {
    // SSR Mode ou teste: usar location prop fornecida
    const [pathname, search] = props.location.split("?");

    router._setState({
      pathname: pathname || "/",
      search: search || "",
      params: {},
      isNavigating: false,
    });

    // SSR: executar children uma vez e retornar (não é reativo)
    return props.children();
  }

  // CSR Mode: configurar estado inicial
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const search = window.location.search.slice(1); // Remove '?'

    router._setState({
      pathname,
      search,
      params: {},
      isNavigating: false,
    });
  }

  // CSR: retornar uma função que acessa state e automaticamente se inscreve
  // O sistema de tracking automático detecta router.pathname.get() e router.params.get()
  // e registra watchers automaticamente
  return () => {
    // Acessar pathname e params para criar dependência reativa automática
    router.pathname.get();
    router.params.get();

    // Re-executar children quando pathname ou params mudam
    return props.children();
  };
}
