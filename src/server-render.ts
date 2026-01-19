// src/server-render.ts
import htm from "htm";
import type { Child, Props, Reactive } from "./types";

// Registry de reactive objects para serialização
const signalRegistry = new Map<string, unknown>();
let signalCounter = 0;

// Void elements que não têm tag de fechamento
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Helpers
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isReactive(x: unknown): x is Reactive {
  return (
    !!x &&
    typeof (x as Record<string, unknown>).get === "function" &&
    typeof (x as Record<string, unknown>).subscribe === "function"
  );
}

function captureSignal(signal: Reactive): string {
  const id = `s${signalCounter++}`;
  signalRegistry.set(id, signal.get());
  return id;
}

function processClass(val: unknown): string {
  if (val == null || val === false) return "";
  if (typeof val === "string") return val;

  if (Array.isArray(val)) {
    return val.filter(Boolean).map(String).join(" ");
  }

  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>)
      .filter(([, on]) => Boolean(on))
      .map(([k]) => k)
      .join(" ");
  }

  return String(val);
}

// Conversão de props para atributos HTML
function propsToAttrs(props: Props | null): string {
  if (!props) return "";

  let result = "";

  for (const [key, val] of Object.entries(props)) {
    if (key === "children") continue;

    // Pular event handlers (só funcionam no cliente)
    if (key.startsWith("on") && key[2]?.toUpperCase() === key[2]) {
      continue;
    }

    // Signals: capturar valor + marcar para hidratação
    if (isReactive(val)) {
      const id = captureSignal(val);
      const value = val.get();

      if (key === "class" || key === "className") {
        const className = processClass(value);
        if (className) {
          result += ` class="${escapeHtml(className)}" data-reactive-class="${id}"`;
        }
      } else if (key === "value") {
        result += ` value="${escapeHtml(String(value ?? ""))}" data-reactive-value="${id}"`;
      } else if (key === "checked") {
        if (value) result += " checked";
        result += ` data-reactive-checked="${id}"`;
      } else {
        result += ` ${key}="${escapeHtml(String(value))}" data-reactive-${key}="${id}"`;
      }
      continue;
    }

    // Classes normais
    if (key === "class" || key === "className") {
      const className = processClass(val);
      if (className) {
        result += ` class="${escapeHtml(className)}"`;
      }
      continue;
    }

    // Style object
    if (key === "style" && val && typeof val === "object") {
      const styleStr = Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => {
          const kebab = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          return `${kebab}: ${v}`;
        })
        .join("; ");
      if (styleStr) {
        result += ` style="${escapeHtml(styleStr)}"`;
      }
      continue;
    }

    // Boolean attributes
    if (["checked", "selected", "disabled", "readonly"].includes(key)) {
      if (val) result += ` ${key}`;
      continue;
    }

    // Atributos normais
    if (val != null && val !== false) {
      result += ` ${key}="${escapeHtml(String(val))}"`;
    }
  }

  return result;
}

// Conversão de children para HTML string
function childToString(child: Child): string {
  if (child == null || child === false) return "";

  // Função: executar e processar resultado (para .map() e tracking automático)
  if (typeof child === "function") {
    const result = (child as () => unknown)();
    return childToString(result as Child);
  }

  // Signal: capturar e renderizar com marcadores
  if (isReactive(child)) {
    const id = captureSignal(child);
    const value = child.get();

    if (Array.isArray(value)) {
      return `<!--reactive-start:${id}-->${value.map(childToString).join("")}<!--reactive-end:${id}-->`;
    }

    return `<!--reactive-start:${id}-->${escapeHtml(String(value ?? ""))}<!--reactive-end:${id}-->`;
  }

  // Array
  if (Array.isArray(child)) {
    return child.map(childToString).join("");
  }

  // String (retornada por htmlString)
  if (typeof child === "string") {
    return child; // Já é HTML, não escapar
  }

  // Node ou outros objetos (não devem acontecer no SSR)
  if (typeof child === "object") {
    console.warn(
      "[slash] SSR: Unexpected object in child position. Use htmlString instead of html.",
    );
    return "[Object]";
  }

  // Primitivo
  return escapeHtml(String(child));
}

// h() versão string (chamado pelo HTM)
export function hString(tag: unknown, props: Props | null, ...children: Child[]): string {
  // Componente função
  if (typeof tag === "function") {
    const result = (tag as (p: Record<string, unknown>) => Child | string)({
      ...(props || {}),
      children,
    });
    return typeof result === "string" ? result : childToString(result);
  }

  // Elemento nativo
  const tagName = String(tag || "div");
  const attrs = propsToAttrs(props);
  const childHtml = children.map(childToString).join("");

  // Void elements (auto-fecham)
  if (VOID_ELEMENTS.has(tagName)) {
    return `<${tagName}${attrs}>`;
  }

  // Regular elements
  return `<${tagName}${attrs}>${childHtml}</${tagName}>`;
}

// Template literal tag usando HTM (versão string)
// O HTM não precisa saber que retorna string - funciona normalmente
export const htmlString = (htm as any).bind(hString) as (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => string;

// API principal
export function renderToString(view: Child | (() => Child)): {
  html: string;
  state: Record<string, unknown>;
} {
  // Reset do registry
  signalRegistry.clear();
  signalCounter = 0;

  // Resolver view
  const resolved = typeof view === "function" ? view() : view;

  // Renderizar para string
  const html = childToString(resolved as Child);
  const state = Object.fromEntries(signalRegistry);

  return { html, state };
}

// Streaming SSR: renderiza para ReadableStream
export async function* renderToStream(
  view: Child | (() => Child),
): AsyncGenerator<string, void, unknown> {
  // Reset do registry
  signalRegistry.clear();
  signalCounter = 0;

  // Resolver view
  const resolved = typeof view === "function" ? view() : view;

  // Renderizar para string em chunks
  const html = childToString(resolved as Child);

  // Yield HTML em chunks de 16KB para melhor performance
  const chunkSize = 16384;
  for (let i = 0; i < html.length; i += chunkSize) {
    yield html.slice(i, i + chunkSize);
  }

  // Yield estado serializado no final
  const state = Object.fromEntries(signalRegistry);
  yield `<script id="__SLASH_STATE__" type="application/json">${JSON.stringify(state)}</script>`;
}

// Repeat para SSR: renderiza lista reativa como string
export function Repeat<T>(
  listSig: Reactive<T[]>,
  keyOf: (item: T) => string | number,
  renderItem: (item: T) => Child,
): string {
  const id = captureSignal(listSig);
  const items = listSig.get();

  const html = items
    .map((item) => {
      const key = keyOf(item);
      const itemHtml = childToString(renderItem(item));
      return `<!--repeat-item:${id}:${key}-->${itemHtml}<!--/repeat-item-->`;
    })
    .join("");

  return `<!--repeat-start:${id}-->${html}<!--repeat-end:${id}-->`;
}
