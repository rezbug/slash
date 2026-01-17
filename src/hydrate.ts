// src/hydrate.ts
import { createSignal } from "./signals";
import type { Signal, Child } from "./types";

type HydrateOptions = {
  state: Record<string, unknown>;
};

// Cleanup (reusar pattern de hyper.ts)
const CLEANUPS = new WeakMap<Node, Array<() => void>>();

function addCleanup(node: Node, fn: () => void): void {
  const arr = CLEANUPS.get(node);
  if (arr) arr.push(fn);
  else CLEANUPS.set(node, [fn]);
}

// Helper para processar valores de classe
function processClassValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, on]) => Boolean(on))
      .map(([k]) => k)
      .join(" ");
  }
  return "";
}

// Hidratar atributos com signals
function hydrateSignalAttributes(
  element: Element,
  signals: Map<string, Signal<unknown>>
): void {
  const attrs = Array.from(element.attributes);

  for (const attr of attrs) {
    if (!attr.name.startsWith("data-signal-")) continue;

    const prop = attr.name.replace("data-signal-", "");
    const signalId = attr.value;
    const signal = signals.get(signalId);

    if (!signal) continue;

    // Subscrever atualizações
    const unsub = signal.subscribe((value) => {
      if (prop === "value") {
        (element as HTMLInputElement).value = String(value ?? "");
      } else if (prop === "checked") {
        (element as HTMLInputElement).checked = Boolean(value);
      } else if (prop === "class") {
        element.className = processClassValue(value);
      } else {
        element.setAttribute(prop, String(value ?? ""));
      }
    });

    addCleanup(element, unsub);
    element.removeAttribute(attr.name);
  }
}

// Hidratar nós com signals interpolados
function hydrateSignalNodes(
  container: Node,
  signals: Map<string, Signal<unknown>>
): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT);

  const signalNodes: Array<{
    start: Comment;
    end: Comment;
    id: string;
  }> = [];

  let node: Comment | null;
  while ((node = walker.nextNode() as Comment | null)) {
    const match = node.textContent?.match(/^signal-start:(.+)$/);
    if (match) {
      const id = match[1];
      let current: Node | null = node.nextSibling;

      while (current) {
        if (
          current.nodeType === Node.COMMENT_NODE &&
          (current as Comment).textContent === `signal-end:${id}`
        ) {
          signalNodes.push({ start: node, end: current as Comment, id });
          break;
        }
        current = current.nextSibling;
      }
    }
  }

  // Hidratar cada signal
  for (const { start, end, id } of signalNodes) {
    const signal = signals.get(id);
    if (!signal) continue;

    const unsub = signal.subscribe((value) => {
      // Limpar entre marcadores
      let current = start.nextSibling;
      while (current && current !== end) {
        const next = current.nextSibling;
        current.parentNode?.removeChild(current);
        current = next;
      }

      // Inserir novo conteúdo
      const parent = start.parentNode;
      if (!parent) return;

      if (value == null || value === false) {
        // Nada
      } else if (Array.isArray(value)) {
        const frag = document.createDocumentFragment();
        for (const item of value) {
          if (item instanceof Node) {
            frag.appendChild(item.cloneNode(true));
          } else {
            frag.appendChild(document.createTextNode(String(item ?? "")));
          }
        }
        parent.insertBefore(frag, end);
      } else if (value instanceof Node) {
        parent.insertBefore(value.cloneNode(true), end);
      } else {
        parent.insertBefore(document.createTextNode(String(value)), end);
      }
    });

    addCleanup(start, unsub);
  }
}

// Caminhar DOM e hidratar
function walkAndHydrate(
  node: Node,
  signals: Map<string, Signal<unknown>>
): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;

    hydrateSignalAttributes(element, signals);

    for (const child of Array.from(element.childNodes)) {
      walkAndHydrate(child, signals);
    }
  }
}

// API principal
/**
 * @deprecated Use render() instead - it auto-detects hydration mode
 *
 * render() will automatically detect when the container has pre-rendered HTML
 * and a __SLASH_STATE__ script tag, and will hydrate instead of re-rendering.
 *
 * Migration:
 * ```ts
 * // Old:
 * hydrate(() => App(), "#app", { state: window.__SLASH_STATE__ });
 *
 * // New (just use render):
 * render(() => App(), "#app");
 * ```
 */
export function hydrate(
  view: Child | (() => Child),
  container: Element | string,
  options: HydrateOptions = { state: {} }
): void {
  console.warn("[slash] hydrate() is deprecated. Use render() - it auto-detects hydration.");

  // Injetar estado no DOM para render() detectar
  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.type = "application/json";
  stateScript.textContent = JSON.stringify(options.state);
  document.body.appendChild(stateScript);

  // Importar render dinamicamente para evitar dependência circular
  import("./hyper").then(({ render }) => {
    render(view, container);
  });
}
