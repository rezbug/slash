import htm from "htm";
import { setListRendererImpl, createSignal, effect } from "./signals";
import type {
  HTMTemplate,
  HTMModule,
  Props,
  Child,
  Elementish,
  EventHandler,
  EventOptions,
  EventTuple,
  Key,
  ReadonlySignal,
  Signal,
  SignalLike,
} from "./types";

/* -------------------------------------------------------------
 * Tipos e utilitários
 * ----------------------------------------------------------- */

type HydrateContext = {
  cursor: Node | null;        // Ponteiro para nó atual do DOM
  root: Element;              // Container raiz
  signals: Map<string, Signal<unknown>>; // Signals restaurados
};

let hydrateContext: HydrateContext | null = null;

// WeakMap para rastrear event handlers anexados aos elementos
const elementEventHandlers = new WeakMap<Element, Map<string, EventListenerOrEventListenerObject>>();

export function setHydrateContext(ctx: HydrateContext | null): void {
  hydrateContext = ctx;
}

function isSignalLike(x: unknown): x is SignalLike {
  return (
    !!x &&
    typeof (x as Record<string, unknown>).get === "function" &&
    typeof (x as Record<string, unknown>).subscribe === "function"
  );
}

function toStr(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v : String(v);
}

/* -------------------------------------------------------------
 * Cleanups por nó (lifecycle básico)
 * ----------------------------------------------------------- */

const CLEANUPS = new WeakMap<Node, Array<() => void>>();

function addCleanup(node: Node, fn: () => void): void {
  const arr = CLEANUPS.get(node);
  if (arr) arr.push(fn);
  else CLEANUPS.set(node, [fn]);
}

export function destroyNode(node: Node): void {
  const fns = CLEANUPS.get(node);
  if (fns) {
    for (const f of fns) {
      try {
        f();
      } catch { }
    }
    CLEANUPS.delete(node);
  }
  if (node instanceof Element && node.hasChildNodes()) {
    node.childNodes.forEach((child) => destroyNode(child));
  }
}

/* -------------------------------------------------------------
 * Children com reatividade (interpolações)
 * ----------------------------------------------------------- */

// Renderiza um SignalLike<unknown> como bloco reativo entre marcadores
function appendReactiveChild(parent: Node, sig: SignalLike<unknown>): void {
  const start = document.createComment("sig:start");
  const end   = document.createComment("sig:end");
  parent.appendChild(start);
  parent.appendChild(end);

  const renderBetween = (value: unknown): void => {
    // limpa nós atuais entre start e end
    let n = start.nextSibling;
    while (n && n !== end) {
      const next = n.nextSibling;
      destroyNode(n);
      parent.removeChild(n);
      n = next;
    }

    // insere o novo conteúdo antes do marcador 'end'
    const frag = document.createDocumentFragment();
    if (value == null || value === false) {
      // nada a inserir
    } else if (Array.isArray(value)) {
      for (const v of value) appendChildSmart(frag, v as Child);
    } else if (value instanceof Node) {
      appendNodeSafe(frag, value);
    } else {
      // string/number/boolean -> texto
      frag.appendChild(document.createTextNode(toStr(value)));
    }
    parent.insertBefore(frag, end);
  };

  // 1ª pintura + assinatura reativa
  renderBetween(sig.get());
  const unsub = sig.subscribe(renderBetween);
  // cleanup quando o bloco sair do DOM
  addCleanup(start, unsub);
}

// Executa uma função em modo tracking e re-executa quando dependências mudam
function appendReactiveFunction(parent: Node, fn: () => unknown): void {
  const start = document.createComment("fn:start");
  const end   = document.createComment("fn:end");
  parent.appendChild(start);
  parent.appendChild(end);

  const renderBetween = (value: unknown): void => {
    // limpa nós atuais entre start e end
    let n = start.nextSibling;
    while (n && n !== end) {
      const next = n.nextSibling;
      destroyNode(n);
      parent.removeChild(n);
      n = next;
    }

    // insere o novo conteúdo antes do marcador 'end'
    const frag = document.createDocumentFragment();
    if (value == null || value === false) {
      // nada a inserir
    } else if (Array.isArray(value)) {
      for (const v of value) appendChildSmart(frag, v as Child);
    } else if (value instanceof Node) {
      appendNodeSafe(frag, value);
    } else {
      // string/number/boolean -> texto
      frag.appendChild(document.createTextNode(toStr(value)));
    }
    parent.insertBefore(frag, end);
  };

  // Usar effect() para tracking automático de dependências
  const unsub = effect(() => {
    const result = fn();
    renderBetween(result);
  });

  // cleanup quando o bloco sair do DOM
  addCleanup(start, unsub);
}


// 1) helper para anexar um Node com segurança (sem mover/exaurir)
function appendNodeSafe(parent: Node, node: Node): void {
  // Fragment: é consumido ao append, então clone sempre
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    parent.appendChild(node.cloneNode(true));
    return;
  }
  // Node já está em outro parent? clone para não mover
  if (node.parentNode && node.parentNode !== parent) {
    parent.appendChild(node.cloneNode(true));
    return;
  }
  parent.appendChild(node);
}

// 2) use o helper dentro de appendChildSmart
function appendChildSmart(parent: Node, child: Child): void {
  if (child == null || child === false) return;

  if (isSignalLike(child)) {
    appendReactiveChild(parent, child);   // <- antes era appendReactiveText
    return;
  }

  // Função: executar em modo tracking para detecção automática de dependências
  if (typeof child === "function") {
    appendReactiveFunction(parent, child as () => unknown);
    return;
  }

  if (Array.isArray(child)) {
    for (const c of child) appendChildSmart(parent, c as Child);
    return;
  }

  if (child instanceof Node) {
    appendNodeSafe(parent, child);
    return;
  }

  appendNodeSafe(parent, document.createTextNode(toStr(child)));
}

/* -------------------------------------------------------------
 * Props/attrs/eventos (com suporte reativo)
 * ----------------------------------------------------------- */

function applyClass(el: HTMLElement, v: unknown): void {
  if (v == null || v === false) {
    el.className = "";
    return;
  }
  if (typeof v === "string") {
    el.className = v;
    return;
  }
  if (Array.isArray(v)) {
    el.className = v.filter(Boolean).map((x) => String(x)).join(" ");
    return;
  }
  if (typeof v === "object") {
    const list = Object.entries(v as Record<string, unknown>)
      .filter(([, on]) => Boolean(on))
      .map(([k]) => k);
    el.className = list.join(" ");
    return;
  }
  el.className = String(v);
}

/* ==== Guards de evento (seguros) ==== */

function isEventHandler(x: unknown): x is EventHandler {
  return (
    typeof x === "function" ||
    (typeof x === "object" && x !== null && "handleEvent" in (x as Record<string, unknown>))
  );
}

function isEventOptions(x: unknown): x is EventOptions {
  return typeof x === "boolean" || (typeof x === "object" && x !== null);
}

function isEventTuple(x: unknown): x is EventTuple {
  if (!Array.isArray(x)) return false;
  if (x.length === 0) return false;
  const fn0: unknown = x[0];
  if (!isEventHandler(fn0)) return false;
  const maybeOpts: unknown = x.length > 1 ? x[1] : undefined;
  if (maybeOpts !== undefined && !isEventOptions(maybeOpts)) return false;
  return true;
}

function parseEventProp(x: unknown): { handler: EventHandler; options?: EventOptions } | null {
  if (isEventHandler(x)) {
    return { handler: x };
  }
  if (isEventTuple(x)) {
    const handler = x[0];
    const options = x.length > 1 ? x[1] : undefined;
    return { handler, options };
  }
  return null;
}

/* ==== setEvent com assinatura única ==== */
function setEvent(el: Element, type: string, handler: EventHandler, opts?: EventOptions): void {
  el.addEventListener(type, handler, opts);
  addCleanup(el, () => el.removeEventListener(type, handler, opts));
}

/* ==== props reativas ==== */
// === REATIVO: aplica valor vindo de Signal e mantém DOM sincronizado ===
function setPropReactive(el: Elementish, key: string, sig: SignalLike<unknown>): void {
  const apply = (v: unknown): void => {
    // classes reativas
    if (key === "class" || key === "className") {
      applyClass(el as HTMLElement, v);
      return;
    }

    // estilo reativo por objeto
    if (key === "style" && v && typeof v === "object") {
      Object.assign((el as HTMLElement).style, v as Record<string, unknown>);
      return;
    }

    // inputs/textarea/select: controlled value
    if (key === "value") {
      const ctl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const next = v == null ? "" : String(v);

      // texto
      if (ctl.value !== next) ctl.value = next;

      // manter defaultValue alinhado (enter/reset etc.)
      if ("defaultValue" in ctl) {
        const t = ctl as HTMLInputElement | HTMLTextAreaElement;
        if (t.defaultValue !== next) t.defaultValue = next;
      }

      // select: marcar option selecionado
      if (ctl instanceof HTMLSelectElement) {
        for (const opt of Array.from(ctl.options)) {
          opt.selected = opt.value === next;
        }
      }
      return;
    }

    // checkbox/radio: controlled checked
    if (key === "checked") {
      const box = el as HTMLInputElement;
      const next = Boolean(v);
      if (box.checked !== next) box.checked = next;
      if (box.defaultChecked !== next) box.defaultChecked = next;
      return;
    }

    // propriedade direta se existir; senão atributo
    if (key in el) {
      const ok = Reflect.set(el as object, key, v);
      if (!ok) {
        if (v == null || v === false) el.removeAttribute(key);
        else el.setAttribute(key, String(v));
      }
    } else {
      if (v == null || v === false) el.removeAttribute(key);
      else el.setAttribute(key, String(v));
    }
  };

  // aplica estado atual e assina mudanças
  apply(sig.get());
  const unsub = sig.subscribe(apply);
  addCleanup(el, unsub);
}

// === NÃO REATIVO: aplica valor literal, events, classes, estilo, etc. ===
function setProp(el: Elementish, key: string, val: unknown): void {
  if (key === "children") return;

  // 1) Signals primeiro: converte para prop reativo
  if (isSignalLike(val)) {
    setPropReactive(el, key, val);
    return;
  }

  // 2) Eventos: onClick / onInput / onChange / ...
  if (key.startsWith("on") && key[2] === key[2]?.toUpperCase()) {
    const type = key.slice(2).toLowerCase();
    const parsed = parseEventProp(val);
    if (parsed) {
      el.addEventListener(type, parsed.handler, parsed.options);
      addCleanup(el, () => el.removeEventListener(type, parsed.handler, parsed.options));

      // Rastrear handler para hidratação
      let handlers = elementEventHandlers.get(el);
      if (!handlers) {
        handlers = new Map();
        elementEventHandlers.set(el, handlers);
      }
      handlers.set(type, parsed.handler);
    }
    return;
  }

  // 3) Estilo por objeto
  if (key === "style" && val && typeof val === "object") {
    Object.assign((el as HTMLElement).style, val as Record<string, unknown>);
    return;
  }

  // 4) Classes
  if (key === "class" || key === "className") {
    applyClass(el as HTMLElement, val);
    return;
  }

  // 5) Inputs/textarea/select controlados (setup inicial mesmo sem signal)
  if (key === "value") {
    const ctl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const next = val == null ? "" : String(val);

    if (ctl.value !== next) ctl.value = next;
    if ("defaultValue" in ctl) {
      const t = ctl as HTMLInputElement | HTMLTextAreaElement;
      if (t.defaultValue !== next) t.defaultValue = next;
    }
    if (ctl instanceof HTMLSelectElement) {
      for (const opt of Array.from(ctl.options)) {
        opt.selected = opt.value === next;
      }
    }
    return;
  }

  if (key === "checked") {
    const box = el as HTMLInputElement;
    const next = Boolean(val);
    if (box.checked !== next) box.checked = next;
    if (box.defaultChecked !== next) box.defaultChecked = next;
    return;
  }

  // 6) Propriedade direta ou atributo
  if (key in el) {
    const ok = Reflect.set(el as object, key, val);
    if (!ok) {
      if (val == null || val === false) el.removeAttribute(key);
      else el.setAttribute(key, String(val));
    }
  } else {
    if (val == null || val === false) el.removeAttribute(key);
    else el.setAttribute(key, String(val));
  }
}

/* -------------------------------------------------------------
 * Hidratação - Helpers
 * ----------------------------------------------------------- */

// Helper para processar valores de classe (copiado de hydrate.ts)
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

// Hidratar atributos com signals (copiado de hydrate.ts)
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

// Hidratar nós com signals interpolados (copiado de hydrate.ts)
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

// Caminhar DOM e hidratar (copiado de hydrate.ts)
function walkAndHydrateSignalAttributes(
  node: Node,
  signals: Map<string, Signal<unknown>>
): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;

    hydrateSignalAttributes(element, signals);

    for (const child of Array.from(element.childNodes)) {
      walkAndHydrateSignalAttributes(child, signals);
    }
  }
}

function skipSignalMarkers(): void {
  if (!hydrateContext) return;

  let current = hydrateContext.cursor;
  let depth = 0;

  while (current) {
    if (current.nodeType === Node.COMMENT_NODE) {
      const text = (current as Comment).textContent;
      if (text?.startsWith("signal-start:")) {
        depth++;
      } else if (text?.startsWith("signal-end:")) {
        if (depth === 0) {
          hydrateContext.cursor = current.nextSibling;
          return;
        }
        depth--;
      }
    }
    current = current.nextSibling;
  }
}

function hydrateChild(child: Child): void {
  if (!hydrateContext) return;

  if (child == null || child === false) {
    return;
  }

  if (Array.isArray(child)) {
    for (const c of child) hydrateChild(c);
    return;
  }

  if (isSignalLike(child)) {
    // Signals interpolados: pular (marcadores já existem)
    // Serão reconectados por hydrateSignalNodes()
    skipSignalMarkers();
    return;
  }

  if (child instanceof Node) {
    // Já foi processado por h()
    return;
  }

  // Texto: avançar cursor
  if (hydrateContext.cursor?.nodeType === Node.TEXT_NODE) {
    hydrateContext.cursor = hydrateContext.cursor.nextSibling;
  }
}

function hHydrate(tag: unknown, props: Props, ...children: Child[]): Node {
  if (!hydrateContext) throw new Error("[slash] hHydrate called without context");

  console.log("[slash] hHydrate chamado com tag:", tag, "props:", props);

  // Componentes: executar e continuar hidratação
  if (typeof tag === "function") {
    const out = (tag as (p: Record<string, unknown>) => Node | Child)({
      ...(props || {}),
      children,
    });
    return out instanceof Node ? out : document.createTextNode(String(out));
  }

  // Buscar elemento existente no cursor
  const existingNode = hydrateContext.cursor;
  console.log("[slash] Cursor atual:", existingNode?.nodeName);

  if (!existingNode || existingNode.nodeType !== Node.ELEMENT_NODE) {
    console.warn("[slash] Hydrate mismatch: expected element, creating new");
    // Fallback: criar novo elemento
    const savedCtx = hydrateContext;
    hydrateContext = null;
    const el = h(tag, props, ...children);
    hydrateContext = savedCtx;
    return el;
  }

  const el = existingNode as Element;

  // Anexar APENAS event listeners (outros props já estão no HTML)
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      // Event handlers: anexar ao elemento existente
      if (k.startsWith("on") && k[2] === k[2]?.toUpperCase()) {
        console.log(`[slash] Anexando event handler ${k} ao elemento`, el.tagName);
        setProp(el as Elementish, k, v);
      }
      // Signals em atributos: serão reconectados depois
      // Outros atributos: já estão no HTML, pular
    }
  }

  // Hidratar children recursivamente
  const oldCursor = hydrateContext.cursor;
  console.log("[slash] Movendo cursor para firstChild de", el.tagName);
  hydrateContext.cursor = el.firstChild;

  for (const child of children) {
    console.log("[slash] Processando child:", child);
    hydrateChild(child);
  }

  // Avançar cursor para próximo sibling
  console.log("[slash] Avançando cursor de", el.tagName, "para nextSibling");
  hydrateContext.cursor = oldCursor?.nextSibling || null;

  return el;
}

/* -------------------------------------------------------------
 * h() + html (HTM)
 * ----------------------------------------------------------- */

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set<string>([
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "defs",
  "use",
  "clipPath",
  "mask",
  "pattern",
  "text",
]);

export function h(tag: unknown, props: Props, ...children: Child[]): Node {
  // MODO HYDRATE: Reutilizar DOM existente
  if (hydrateContext) {
    return hHydrate(tag, props, ...children);
  }

  // MODO NORMAL: Criar elementos novos
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
  const el = (SVG_TAGS.has(tagName)
    ? document.createElementNS(SVG_NS, tagName)
    : document.createElement(tagName)) as Elementish;

  if (props) {
    for (const [k, v] of Object.entries(props)) setProp(el, k, v);
  }
  for (const ch of children) appendChildSmart(el, ch);
  return el;
}

export const html: HTMTemplate = (htm as unknown as HTMModule).bind(h);

/* -------------------------------------------------------------
 * render: aceita qualquer Child ou função que retorne Child
 * ----------------------------------------------------------- */

type RootView = Child | (() => Child);
type RenderContainer = Element | string | null | undefined;
const isDev =
  typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";

function callerInfo(): string | undefined {
  try {
    const stack = new Error().stack?.split("\n").slice(3);
    if (!stack?.length) return undefined;
    const frame = stack.find((line) => /\.(ts|tsx|js)/.test(line));
    if (!frame) return undefined;
    const match = frame.match(/at\s+(?:.*\()?([^():]+):(\d+):\d+\)?/);
    if (!match) return undefined;
    return `${match[1]}:${match[2]}`;
  } catch {
    return undefined;
  }
}

function resolveContainer(target: RenderContainer): Element {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el) {
      const hint = isDev ? callerInfo() : undefined;
      const extra = hint ? ` (called from ${hint})` : "";
      throw new Error(`[slash] render(): selector \"${target}\" not found — ensure the element exists before calling render()${extra}`);
    }
    return el;
  }
  if (target instanceof Element) return target;
  const hint = isDev ? callerInfo() : undefined;
  const extra = hint ? ` (called from ${hint})` : "";
  throw new Error(`[slash] render(): container Element is required (received null/undefined)${extra}`);
}

// Função interna de hydrate
function hydrateInternal(
  view: RootView,
  container: Element,
  state: Record<string, unknown>
): Node | Node[] {
  console.log("[slash] Iniciando hidratação (nova abordagem simplificada)...");
  console.log("[slash] Estado recebido:", state);

  // PROBLEMA: Os signals são criados no nível do módulo (app.ts linhas 10-12)
  // Quando renderizamos a view, ela usa esses signals originais
  // Mas o estado serializado tem os VALORES que queremos restaurar

  // SOLUÇÃO: Encontrar os signals usados pela view e atualizar seus valores
  // Em vez de criar novos signals, vamos atualizar os existentes

  // Primeiro, precisamos encontrar os signals. Vamos renderizar em modo especial
  // para capturar os signals usados

  // Por enquanto: renderizar normalmente (isso vai usar os signals originais do módulo)
  // Os signals já têm os valores corretos? NÃO! Eles têm os valores iniciais

  // O problema é que não temos acesso aos signals originais aqui!
  // Precisamos de uma forma de "injetar" os valores do estado nos signals existentes

  // NOVA ABORDAGEM: Simplesmente renderizar do zero
  // A hidratação SSR tradicional não funciona bem com signals em nível de módulo
  // Vamos apenas limpar o container e renderizar normalmente
  console.log("[slash] Removendo conteúdo SSR e renderizando do zero...");

  // Limpar container
  container.innerHTML = "";

  // Renderizar view normalmente (isso vai criar subscriptions corretamente)
  const out = typeof view === "function" ? view() : view;
  const parts = Array.isArray(out) ? out : [out];

  for (const p of parts) {
    appendChildSmart(container, p);
  }

  console.log("[slash] Renderização concluída!");

  const nodes = Array.from(container.childNodes) as Node[];
  return nodes.length === 1 ? nodes[0]! : nodes;
}

// Copia event handlers de source para target recursivamente
function copyEventHandlers(source: Element | null, target: Element | null): void {
  if (!source || !target) return;

  // Pegar todos os event listeners anexados ao source
  const handlers = elementEventHandlers.get(source);
  if (handlers) {
    for (const [eventType, handler] of handlers) {
      console.log(`[slash] Copiando event listener ${eventType} para`, target.tagName);
      target.addEventListener(eventType, handler);
      // Adicionar cleanup ao target também
      addCleanup(target, () => target.removeEventListener(eventType, handler));
    }
  }

  // Recursivamente copiar para children
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  for (let i = 0; i < Math.min(sourceChildren.length, targetChildren.length); i++) {
    copyEventHandlers(sourceChildren[i] as Element, targetChildren[i] as Element);
  }
}

export function render(view: RootView, container: RenderContainer): Node | Node[] {
  const resolved = resolveContainer(container);

  // DETECÇÃO AUTOMÁTICA DE MODO

  // Modo Hydrate: container tem conteúdo + script de estado
  const stateScript = typeof document !== "undefined"
    ? document.getElementById("__SLASH_STATE__")
    : null;

  if (resolved.childNodes.length > 0 && stateScript) {
    // MODO HYDRATE
    console.log("[slash] Iniciando hidratação...");
    const state = JSON.parse(stateScript.textContent || "{}");
    stateScript.remove();
    return hydrateInternal(view, resolved, state);
  }

  // Modo Normal: limpar e renderizar
  const prevNodes = Array.from(resolved.childNodes) as Node[];
  for (const node of prevNodes) destroyNode(node);
  resolved.textContent = "";

  // resolve view
  const out = typeof view === "function" ? (view as () => Child)() : view;
  const parts = Array.isArray(out) ? out : [out];

  for (const p of parts) appendChildSmart(resolved, p);

  const inserted = Array.from(resolved.childNodes) as Node[];
  return inserted.length === 1 ? inserted[0]! : inserted;
}

/* -------------------------------------------------------------
 * Repeat: keyed diff com blocos movíveis (suporta múltiplos nós por item)
 * ----------------------------------------------------------- */

type RenderItem<T> = (item: T) => Child;

function removeBlockRange(start: Node, end: Node): void {
  const parent = start.parentNode;
  if (!parent) return;
  let n: Node | null = start;
  while (n) {
    const nxt: Node | null = n.nextSibling;
    destroyNode(n);
    parent.removeChild(n);
    if (n === end) break;
    n = nxt;
  }
}

function moveBlockBefore(start: Node, end: Node, ref: Node | null): void {
  const parent = start.parentNode;
  if (!parent) return;
  const frag = document.createDocumentFragment();
  let n: Node | null = start;
  while (n) {
    const nxt: Node | null = n.nextSibling;
    frag.appendChild(n);
    if (n === end) break;
    n = nxt;
  }
  parent.insertBefore(frag, ref);
}

function createBlockBefore<T>(
  parent: Node,
  ref: Node | null,
  renderItem: RenderItem<T>,
  item: T
): { start: Comment; end: Comment } {
  const start = document.createComment("repeat:start");
  const end = document.createComment("repeat:end");
  const frag = document.createDocumentFragment();

  frag.appendChild(start);
  const out = renderItem(item);
  appendChildSmart(frag, out);
  frag.appendChild(end);

  parent.insertBefore(frag, ref);
  return { start, end };
}

export function Repeat<T>(
  listSig: ReadonlySignal<T[]> | Signal<T[]>,
  keyOf: (item: T) => Key,
  renderItem: RenderItem<T>
): Node {
  const anchor = document.createTextNode("");
  const byKey = new Map<Key, { start: Comment; end: Comment }>();

  function mountInitial(items: T[]): void {
    const parent = anchor.parentNode!;
    let ref: Node | null = anchor.nextSibling;
    for (const it of items) {
      const k = keyOf(it);
      const blk = createBlockBefore(parent, ref, renderItem, it);
      byKey.set(k, blk);
      ref = blk.end.nextSibling;
    }
  }



  function patch(nextItems: T[]): void {
    const parent = anchor.parentNode!;
    const seen = new Set<Key>();
    let cursor: Node = anchor;

    for (const it of nextItems) {
      const k = keyOf(it);
      seen.add(k);
      const exist = byKey.get(k);

      if (!exist) {
        const blk = createBlockBefore(parent, cursor.nextSibling, renderItem, it);
        byKey.set(k, blk);
        cursor = blk.end;
      } else {
        const shouldBeRef: Node | null = cursor.nextSibling;
        if (exist.start !== shouldBeRef) {
          moveBlockBefore(exist.start, exist.end, shouldBeRef);
        }
        cursor = exist.end;
      }
    }

    for (const [k, blk] of byKey) {
      if (!seen.has(k)) {
        removeBlockRange(blk.start, blk.end);
        byKey.delete(k);
      }
    }
  }

  // monta quando a âncora estiver no DOM
  queueMicrotask(() => mountInitial((listSig as ReadonlySignal<T[]>).get()));

  const unsub = (listSig as ReadonlySignal<T[]>).subscribe((arr) => patch(arr));
  addCleanup(anchor, unsub);

  return anchor;
}

setListRendererImpl(<T>(
  listSig: ReadonlySignal<T[]>,
  keyOf: (item: T) => Key,
  renderItem: (item: T) => Child
): Node => Repeat(listSig, keyOf, renderItem));
