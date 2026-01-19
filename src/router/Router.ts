import type { Child } from "../types";
import { router } from "./state";

export type RouterProps = {
  location?: string;
  children: () => Child;
};

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
export function Router(props: RouterProps) {
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
  } else if (typeof window !== "undefined") {
    // CSR Mode: usar window.location inicial
    const pathname = window.location.pathname;
    const search = window.location.search.slice(1); // Remove '?'

    router._setState({
      pathname,
      search,
      params: {},
      isNavigating: false,
    });
  }

  // Executar children DEPOIS de configurar o estado
  // API imperativa garante ordem de execução consistente em SSR e CSR
  return props.children();
}
