import type { Child } from "../types";

export type SwitchProps = {
  children: Child | Child[];
};

/**
 * Componente Switch
 * Renderiza apenas o primeiro filho (Route) que não é null
 * Útil para garantir que apenas uma rota seja renderizada por vez
 */
export function Switch(props: SwitchProps): Child {
  const children = Array.isArray(props.children) ? props.children : [props.children];

  // Encontrar o primeiro child que não é null/undefined
  for (const child of children) {
    if (child != null && child !== false) {
      return child;
    }
  }

  return null;
}
