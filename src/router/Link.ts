import { html as clientHtml } from "../hyper";
import { htmlString } from "../server-render";
import type { Child } from "../types";
import { prefetch } from "./prefetch";
import { router } from "./state";

declare global {
  var __SLASH_SSR__: boolean | undefined;
}

export type LinkProps = {
  to: string;
  children: Child;
  activeClass?: string;
  class?: string;
  /** Enable prefetching on hover (default: true, client-only) */
  prefetch?: boolean;
  /** Delay before prefetching in ms (default: 50) */
  prefetchDelay?: number;
};

/**
 * Componente Link
 * Link de navegação que intercepta clicks no CSR
 * Suporta prefetching automático no hover (client-only)
 */
export function Link(props: LinkProps): Child {
  // Detecta SSR: sem window OU flag global __SLASH_SSR__
  const isServer = typeof window === "undefined" || globalThis.__SLASH_SSR__ === true;

  // Determinar se o link está ativo
  const pathname = router.pathname.get();
  const isActive = pathname === props.to.split("?")[0];

  // Classes CSS
  const classes = [props.class, isActive ? props.activeClass || "active" : ""]
    .filter(Boolean)
    .join(" ");

  if (isServer) {
    // SSR Mode: renderizar <a> normal
    return htmlString`<a href="${props.to}" class="${classes}">${props.children}</a>`;
  }

  // CSR Mode: renderizar <a> com onClick interceptor e prefetch
  const shouldPrefetch = props.prefetch !== false; // default: true
  const delay = props.prefetchDelay ?? 50;

  const handleClick = (e: Event) => {
    e.preventDefault();
    router.navigate(props.to);
  };

  const handleMouseEnter = shouldPrefetch
    ? () => {
        prefetch(props.to, { delay });
      }
    : undefined;

  return clientHtml`<a
    href="${props.to}"
    class="${classes}"
    onClick=${handleClick}
    onMouseEnter=${handleMouseEnter}
  >${props.children}</a>`;
}
