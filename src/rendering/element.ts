import type { Child, Elementish, Props } from "../types";
import { SVG_NS, SVG_TAGS } from "../utils/constants";
import { appendChildSmart } from "./children";
import { setProp } from "./props";

export function h(tag: unknown, props: Props, ...children: Child[]): Node {
  // Componente (função) — pode retornar qualquer Child; empacotar se não for Node
  if (typeof tag === "function") {
    const out = (tag as (p: Record<string, unknown>) => Node | Child)({
      ...(props || {}),
      children,
    });
    if (out instanceof Node) return out;
    const frag = document.createDocumentFragment();
    appendChildSmart(frag, out as Child);
    return frag;
  }

  // Tag nativa
  const tagName = String(tag || "div");
  const el = (
    SVG_TAGS.has(tagName)
      ? document.createElementNS(SVG_NS, tagName)
      : document.createElement(tagName)
  ) as Elementish;

  if (props) {
    for (const [k, v] of Object.entries(props)) setProp(el, k, v);
  }
  for (const ch of children) appendChildSmart(el, ch);
  return el;
}
