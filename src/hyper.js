// ../../node_modules/.bun/htm@3.1.1/node_modules/htm/dist/htm.module.js
var n = function(t, s, r, e) {
  var u;
  s[0] = 0;
  for (var h = 1;h < s.length; h++) {
    var p = s[h++], a = s[h] ? (s[0] |= p ? 1 : 2, r[s[h++]]) : s[++h];
    p === 3 ? e[0] = a : p === 4 ? e[1] = Object.assign(e[1] || {}, a) : p === 5 ? (e[1] = e[1] || {})[s[++h]] = a : p === 6 ? e[1][s[++h]] += a + "" : p ? (u = t.apply(a, n(t, a, r, ["", null])), e.push(u), a[0] ? s[0] |= 2 : (s[h - 2] = 0, s[h] = u)) : e.push(a);
  }
  return e;
};
var t = new Map;
function htm_module_default(s) {
  var r = t.get(this);
  return r || (r = new Map, t.set(this, r)), (r = n(this, r.get(s) || (r.set(s, r = function(n2) {
    for (var t2, s2, r2 = 1, e = "", u = "", h = [0], p = function(n3) {
      r2 === 1 && (n3 || (e = e.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? h.push(0, n3, e) : r2 === 3 && (n3 || e) ? (h.push(3, n3, e), r2 = 2) : r2 === 2 && e === "..." && n3 ? h.push(4, n3, 0) : r2 === 2 && e && !n3 ? h.push(5, 0, true, e) : r2 >= 5 && ((e || !n3 && r2 === 5) && (h.push(r2, 0, e, s2), r2 = 6), n3 && (h.push(r2, n3, 0, s2), r2 = 6)), e = "";
    }, a = 0;a < n2.length; a++) {
      a && (r2 === 1 && p(), p(a));
      for (var l = 0;l < n2[a].length; l++)
        t2 = n2[a][l], r2 === 1 ? t2 === "<" ? (p(), h = [h], r2 = 3) : e += t2 : r2 === 4 ? e === "--" && t2 === ">" ? (r2 = 1, e = "") : e = t2 + e[0] : u ? t2 === u ? u = "" : e += t2 : t2 === '"' || t2 === "'" ? u = t2 : t2 === ">" ? (p(), r2 = 1) : r2 && (t2 === "=" ? (r2 = 5, s2 = e, e = "") : t2 === "/" && (r2 < 5 || n2[a][l + 1] === ">") ? (p(), r2 === 3 && (h = h[0]), r2 = h, (h = h[0]).push(2, 0, r2), r2 = 0) : t2 === " " || t2 === "\t" || t2 === `
` || t2 === "\r" ? (p(), r2 = 2) : e += t2), r2 === 3 && e === "!--" && (r2 = 4, h = h[0]);
    }
    return p(), h;
  }(s)), r), arguments, [])).length > 1 ? r : r[0];
}

// ../slash/src/signals.ts
var CURRENT = null;
function track(sig) {
  const c = CURRENT;
  if (!c || !c.active || c.links.has(sig))
    return;
  const unsub = sig.subscribe(() => {
    if (c.active)
      c.schedule();
  });
  c.links.set(sig, unsub);
}
var LIST_RENDERER = null;
function setListRendererImpl(fn) {
  LIST_RENDERER = fn;
}
function createSignal(initial) {
  let value = initial;
  const subs = new Set;
  const self = {
    get: () => {
      track(self);
      return value;
    },
    set: (v) => {
      const next = typeof v === "function" ? v(value) : v;
      if (Object.is(next, value))
        return;
      value = next;
      subs.forEach((fn) => fn(value));
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    }
  };
  if (Array.isArray(initial)) {
    const objKeys = new WeakMap;
    const primSeen = new Map;
    const keyOf = (item) => {
      if (item !== null && typeof item === "object") {
        const rec = item;
        if ("id" in rec)
          return rec.id;
        if ("key" in rec)
          return rec.key;
        const o = item;
        const ex = objKeys.get(o);
        if (ex !== undefined)
          return ex;
        const sym = Symbol("item");
        objKeys.set(o, sym);
        return sym;
      }
      const k = `${typeof item}:${String(item)}`;
      if (true) {
        const n2 = (primSeen.get(k) ?? 0) + 1;
        primSeen.set(k, n2);
        if (n2 > 1)
          console.warn("[slash] map(): duplicated primitive key", item);
      }
      return k;
    };
    const listSelf = self;
    listSelf.map = (render) => {
      if (!LIST_RENDERER) {
        throw new Error("[slash] list renderer not registered — ensure `hyper` is imported before using listSignal.map()");
      }
      const sigArr = self;
      return LIST_RENDERER(sigArr, keyOf, (item) => {
        const arr = sigArr.get();
        const idx = arr.indexOf(item);
        return render(item, idx);
      });
    };
    return listSelf;
  }
  return self;
}
function createSignalArray(initial = []) {
  return createSignal(initial);
}

// ../slash/src/hyper.ts
var hydrateContext = null;
function setHydrateContext(ctx) {
  hydrateContext = ctx;
}
function isSignalLike(x) {
  return !!x && typeof x.get === "function" && typeof x.subscribe === "function";
}
function toStr(v) {
  return v == null ? "" : typeof v === "string" ? v : String(v);
}
var CLEANUPS = new WeakMap;
function addCleanup(node, fn) {
  const arr = CLEANUPS.get(node);
  if (arr)
    arr.push(fn);
  else
    CLEANUPS.set(node, [fn]);
}
function destroyNode(node) {
  const fns = CLEANUPS.get(node);
  if (fns) {
    for (const f of fns) {
      try {
        f();
      } catch {}
    }
    CLEANUPS.delete(node);
  }
  if (node instanceof Element && node.hasChildNodes()) {
    node.childNodes.forEach((child) => destroyNode(child));
  }
}
function appendReactiveChild(parent, sig) {
  const start = document.createComment("sig:start");
  const end = document.createComment("sig:end");
  parent.appendChild(start);
  parent.appendChild(end);
  const renderBetween = (value) => {
    let n2 = start.nextSibling;
    while (n2 && n2 !== end) {
      const next = n2.nextSibling;
      destroyNode(n2);
      parent.removeChild(n2);
      n2 = next;
    }
    const frag = document.createDocumentFragment();
    if (value == null || value === false) {} else if (Array.isArray(value)) {
      for (const v of value)
        appendChildSmart(frag, v);
    } else if (value instanceof Node) {
      appendNodeSafe(frag, value);
    } else {
      frag.appendChild(document.createTextNode(toStr(value)));
    }
    parent.insertBefore(frag, end);
  };
  renderBetween(sig.get());
  const unsub = sig.subscribe(renderBetween);
  addCleanup(start, unsub);
}
function appendNodeSafe(parent, node) {
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    parent.appendChild(node.cloneNode(true));
    return;
  }
  if (node.parentNode && node.parentNode !== parent) {
    parent.appendChild(node.cloneNode(true));
    return;
  }
  parent.appendChild(node);
}
function appendChildSmart(parent, child) {
  if (child == null || child === false)
    return;
  if (isSignalLike(child)) {
    appendReactiveChild(parent, child);
    return;
  }
  if (Array.isArray(child)) {
    for (const c of child)
      appendChildSmart(parent, c);
    return;
  }
  if (child instanceof Node) {
    appendNodeSafe(parent, child);
    return;
  }
  appendNodeSafe(parent, document.createTextNode(toStr(child)));
}
function applyClass(el, v) {
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
    const list = Object.entries(v).filter(([, on]) => Boolean(on)).map(([k]) => k);
    el.className = list.join(" ");
    return;
  }
  el.className = String(v);
}
function isEventHandler(x) {
  return typeof x === "function" || typeof x === "object" && x !== null && "handleEvent" in x;
}
function isEventOptions(x) {
  return typeof x === "boolean" || typeof x === "object" && x !== null;
}
function isEventTuple(x) {
  if (!Array.isArray(x))
    return false;
  if (x.length === 0)
    return false;
  const fn0 = x[0];
  if (!isEventHandler(fn0))
    return false;
  const maybeOpts = x.length > 1 ? x[1] : undefined;
  if (maybeOpts !== undefined && !isEventOptions(maybeOpts))
    return false;
  return true;
}
function parseEventProp(x) {
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
function setPropReactive(el, key, sig) {
  const apply = (v) => {
    if (key === "class" || key === "className") {
      applyClass(el, v);
      return;
    }
    if (key === "style" && v && typeof v === "object") {
      Object.assign(el.style, v);
      return;
    }
    if (key === "value") {
      const ctl = el;
      const next = v == null ? "" : String(v);
      if (ctl.value !== next)
        ctl.value = next;
      if ("defaultValue" in ctl) {
        const t2 = ctl;
        if (t2.defaultValue !== next)
          t2.defaultValue = next;
      }
      if (ctl instanceof HTMLSelectElement) {
        for (const opt of Array.from(ctl.options)) {
          opt.selected = opt.value === next;
        }
      }
      return;
    }
    if (key === "checked") {
      const box = el;
      const next = Boolean(v);
      if (box.checked !== next)
        box.checked = next;
      if (box.defaultChecked !== next)
        box.defaultChecked = next;
      return;
    }
    if (key in el) {
      const ok = Reflect.set(el, key, v);
      if (!ok) {
        if (v == null || v === false)
          el.removeAttribute(key);
        else
          el.setAttribute(key, String(v));
      }
    } else {
      if (v == null || v === false)
        el.removeAttribute(key);
      else
        el.setAttribute(key, String(v));
    }
  };
  apply(sig.get());
  const unsub = sig.subscribe(apply);
  addCleanup(el, unsub);
}
function setProp(el, key, val) {
  if (key === "children")
    return;
  if (isSignalLike(val)) {
    setPropReactive(el, key, val);
    return;
  }
  if (key.startsWith("on") && key[2] === key[2]?.toUpperCase()) {
    const type = key.slice(2).toLowerCase();
    const parsed = parseEventProp(val);
    if (parsed) {
      el.addEventListener(type, parsed.handler, parsed.options);
      addCleanup(el, () => el.removeEventListener(type, parsed.handler, parsed.options));
    }
    return;
  }
  if (key === "style" && val && typeof val === "object") {
    Object.assign(el.style, val);
    return;
  }
  if (key === "class" || key === "className") {
    applyClass(el, val);
    return;
  }
  if (key === "value") {
    const ctl = el;
    const next = val == null ? "" : String(val);
    if (ctl.value !== next)
      ctl.value = next;
    if ("defaultValue" in ctl) {
      const t2 = ctl;
      if (t2.defaultValue !== next)
        t2.defaultValue = next;
    }
    if (ctl instanceof HTMLSelectElement) {
      for (const opt of Array.from(ctl.options)) {
        opt.selected = opt.value === next;
      }
    }
    return;
  }
  if (key === "checked") {
    const box = el;
    const next = Boolean(val);
    if (box.checked !== next)
      box.checked = next;
    if (box.defaultChecked !== next)
      box.defaultChecked = next;
    return;
  }
  if (key in el) {
    const ok = Reflect.set(el, key, val);
    if (!ok) {
      if (val == null || val === false)
        el.removeAttribute(key);
      else
        el.setAttribute(key, String(val));
    }
  } else {
    if (val == null || val === false)
      el.removeAttribute(key);
    else
      el.setAttribute(key, String(val));
  }
}
function processClassValue(value) {
  if (typeof value === "string")
    return value;
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value).filter(([, on]) => Boolean(on)).map(([k]) => k).join(" ");
  }
  return "";
}
function hydrateSignalAttributes(element, signals) {
  const attrs = Array.from(element.attributes);
  for (const attr of attrs) {
    if (!attr.name.startsWith("data-signal-"))
      continue;
    const prop = attr.name.replace("data-signal-", "");
    const signalId = attr.value;
    const signal = signals.get(signalId);
    if (!signal)
      continue;
    const unsub = signal.subscribe((value) => {
      if (prop === "value") {
        element.value = String(value ?? "");
      } else if (prop === "checked") {
        element.checked = Boolean(value);
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
function hydrateSignalNodes(container, signals) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT);
  const signalNodes = [];
  let node;
  while (node = walker.nextNode()) {
    const match = node.textContent?.match(/^signal-start:(.+)$/);
    if (match) {
      const id = match[1];
      let current = node.nextSibling;
      while (current) {
        if (current.nodeType === Node.COMMENT_NODE && current.textContent === `signal-end:${id}`) {
          signalNodes.push({ start: node, end: current, id });
          break;
        }
        current = current.nextSibling;
      }
    }
  }
  for (const { start, end, id } of signalNodes) {
    const signal = signals.get(id);
    if (!signal)
      continue;
    const unsub = signal.subscribe((value) => {
      let current = start.nextSibling;
      while (current && current !== end) {
        const next = current.nextSibling;
        current.parentNode?.removeChild(current);
        current = next;
      }
      const parent = start.parentNode;
      if (!parent)
        return;
      if (value == null || value === false) {} else if (Array.isArray(value)) {
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
function walkAndHydrateSignalAttributes(node, signals) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node;
    hydrateSignalAttributes(element, signals);
    for (const child of Array.from(element.childNodes)) {
      walkAndHydrateSignalAttributes(child, signals);
    }
  }
}
function skipSignalMarkers() {
  if (!hydrateContext)
    return;
  let current = hydrateContext.cursor;
  let depth = 0;
  while (current) {
    if (current.nodeType === Node.COMMENT_NODE) {
      const text = current.textContent;
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
function hydrateChild(child) {
  if (!hydrateContext)
    return;
  if (child == null || child === false) {
    return;
  }
  if (Array.isArray(child)) {
    for (const c of child)
      hydrateChild(c);
    return;
  }
  if (isSignalLike(child)) {
    skipSignalMarkers();
    return;
  }
  if (child instanceof Node) {
    return;
  }
  if (hydrateContext.cursor?.nodeType === Node.TEXT_NODE) {
    hydrateContext.cursor = hydrateContext.cursor.nextSibling;
  }
}
function hHydrate(tag, props, ...children) {
  if (!hydrateContext)
    throw new Error("[slash] hHydrate called without context");
  if (typeof tag === "function") {
    const out = tag({
      ...props || {},
      children
    });
    return out instanceof Node ? out : document.createTextNode(String(out));
  }
  const existingNode = hydrateContext.cursor;
  if (!existingNode || existingNode.nodeType !== Node.ELEMENT_NODE) {
    console.warn("[slash] Hydrate mismatch: expected element, creating new");
    const savedCtx = hydrateContext;
    hydrateContext = null;
    const el2 = h(tag, props, ...children);
    hydrateContext = savedCtx;
    return el2;
  }
  const el = existingNode;
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (k.startsWith("on") && k[2] === k[2]?.toUpperCase()) {
        setProp(el, k, v);
      }
    }
  }
  const oldCursor = hydrateContext.cursor;
  hydrateContext.cursor = el.firstChild;
  for (const child of children) {
    hydrateChild(child);
  }
  hydrateContext.cursor = oldCursor?.nextSibling || null;
  return el;
}
var SVG_NS = "http://www.w3.org/2000/svg";
var SVG_TAGS = new Set([
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
  "text"
]);
function h(tag, props, ...children) {
  if (hydrateContext) {
    return hHydrate(tag, props, ...children);
  }
  if (typeof tag === "function") {
    const out = tag({
      ...props || {},
      children
    });
    if (out instanceof Node)
      return out;
    const frag = document.createDocumentFragment();
    appendChildSmart(frag, out);
    return frag;
  }
  const tagName = String(tag || "div");
  const el = SVG_TAGS.has(tagName) ? document.createElementNS(SVG_NS, tagName) : document.createElement(tagName);
  if (props) {
    for (const [k, v] of Object.entries(props))
      setProp(el, k, v);
  }
  for (const ch of children)
    appendChildSmart(el, ch);
  return el;
}
var html = htm_module_default.bind(h);
var isDev = typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";
function callerInfo() {
  try {
    const stack = new Error().stack?.split(`
`).slice(3);
    if (!stack?.length)
      return;
    const frame = stack.find((line) => /\.(ts|tsx|js)/.test(line));
    if (!frame)
      return;
    const match = frame.match(/at\s+(?:.*\()?([^():]+):(\d+):\d+\)?/);
    if (!match)
      return;
    return `${match[1]}:${match[2]}`;
  } catch {
    return;
  }
}
function resolveContainer(target) {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el) {
      const hint2 = isDev ? callerInfo() : undefined;
      const extra2 = hint2 ? ` (called from ${hint2})` : "";
      throw new Error(`[slash] render(): selector "${target}" not found — ensure the element exists before calling render()${extra2}`);
    }
    return el;
  }
  if (target instanceof Element)
    return target;
  const hint = isDev ? callerInfo() : undefined;
  const extra = hint ? ` (called from ${hint})` : "";
  throw new Error(`[slash] render(): container Element is required (received null/undefined)${extra}`);
}
function hydrateInternal(view, container, state) {
  const signals = new Map;
  for (const [id, value] of Object.entries(state)) {
    signals.set(id, createSignal(value));
  }
  const ctx = {
    cursor: container.firstChild,
    root: container,
    signals
  };
  setHydrateContext(ctx);
  try {
    typeof view === "function" && view();
    hydrateSignalNodes(container, signals);
    walkAndHydrateSignalAttributes(container, signals);
  } finally {
    setHydrateContext(null);
  }
  const nodes = Array.from(container.childNodes);
  return nodes.length === 1 ? nodes[0] : nodes;
}
function render(view, container) {
  const resolved = resolveContainer(container);
  const stateScript = typeof document !== "undefined" ? document.getElementById("__SLASH_STATE__") : null;
  if (resolved.childNodes.length > 0 && stateScript) {
    const state = JSON.parse(stateScript.textContent || "{}");
    stateScript.remove();
    return hydrateInternal(view, resolved, state);
  }
  const prevNodes = Array.from(resolved.childNodes);
  for (const node of prevNodes)
    destroyNode(node);
  resolved.textContent = "";
  const out = typeof view === "function" ? view() : view;
  const parts = Array.isArray(out) ? out : [out];
  for (const p of parts)
    appendChildSmart(resolved, p);
  const inserted = Array.from(resolved.childNodes);
  return inserted.length === 1 ? inserted[0] : inserted;
}
function removeBlockRange(start, end) {
  const parent = start.parentNode;
  if (!parent)
    return;
  let n2 = start;
  while (n2) {
    const nxt = n2.nextSibling;
    destroyNode(n2);
    parent.removeChild(n2);
    if (n2 === end)
      break;
    n2 = nxt;
  }
}
function moveBlockBefore(start, end, ref) {
  const parent = start.parentNode;
  if (!parent)
    return;
  const frag = document.createDocumentFragment();
  let n2 = start;
  while (n2) {
    const nxt = n2.nextSibling;
    frag.appendChild(n2);
    if (n2 === end)
      break;
    n2 = nxt;
  }
  parent.insertBefore(frag, ref);
}
function createBlockBefore(parent, ref, renderItem, item) {
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
function Repeat(listSig, keyOf, renderItem) {
  const anchor = document.createTextNode("");
  const byKey = new Map;
  function mountInitial(items) {
    const parent = anchor.parentNode;
    let ref = anchor.nextSibling;
    for (const it of items) {
      const k = keyOf(it);
      const blk = createBlockBefore(parent, ref, renderItem, it);
      byKey.set(k, blk);
      ref = blk.end.nextSibling;
    }
  }
  function patch(nextItems) {
    const parent = anchor.parentNode;
    const seen = new Set;
    let cursor = anchor;
    for (const it of nextItems) {
      const k = keyOf(it);
      seen.add(k);
      const exist = byKey.get(k);
      if (!exist) {
        const blk = createBlockBefore(parent, cursor.nextSibling, renderItem, it);
        byKey.set(k, blk);
        cursor = blk.end;
      } else {
        const shouldBeRef = cursor.nextSibling;
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
  queueMicrotask(() => mountInitial(listSig.get()));
  const unsub = listSig.subscribe((arr) => patch(arr));
  addCleanup(anchor, unsub);
  return anchor;
}
setListRendererImpl((listSig, keyOf, renderItem) => Repeat(listSig, keyOf, renderItem));
export {
  setHydrateContext,
  render,
  html,
  h,
  destroyNode,
  Repeat
};

export { htm_module_default, setListRendererImpl, createSignal, createSignalArray, render };

//# debugId=06F19DA886098B2B64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5idW4vaHRtQDMuMS4xL25vZGVfbW9kdWxlcy9odG0vZGlzdC9odG0ubW9kdWxlLmpzIiwgIi4uLy4uL3NsYXNoL3NyYy9zaWduYWxzLnRzIiwgIi4uLy4uL3NsYXNoL3NyYy9oeXBlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsKICAgICJ2YXIgbj1mdW5jdGlvbih0LHMscixlKXt2YXIgdTtzWzBdPTA7Zm9yKHZhciBoPTE7aDxzLmxlbmd0aDtoKyspe3ZhciBwPXNbaCsrXSxhPXNbaF0/KHNbMF18PXA/MToyLHJbc1toKytdXSk6c1srK2hdOzM9PT1wP2VbMF09YTo0PT09cD9lWzFdPU9iamVjdC5hc3NpZ24oZVsxXXx8e30sYSk6NT09PXA/KGVbMV09ZVsxXXx8e30pW3NbKytoXV09YTo2PT09cD9lWzFdW3NbKytoXV0rPWErXCJcIjpwPyh1PXQuYXBwbHkoYSxuKHQsYSxyLFtcIlwiLG51bGxdKSksZS5wdXNoKHUpLGFbMF0/c1swXXw9Mjooc1toLTJdPTAsc1toXT11KSk6ZS5wdXNoKGEpfXJldHVybiBlfSx0PW5ldyBNYXA7ZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ocyl7dmFyIHI9dC5nZXQodGhpcyk7cmV0dXJuIHJ8fChyPW5ldyBNYXAsdC5zZXQodGhpcyxyKSksKHI9bih0aGlzLHIuZ2V0KHMpfHwoci5zZXQocyxyPWZ1bmN0aW9uKG4pe2Zvcih2YXIgdCxzLHI9MSxlPVwiXCIsdT1cIlwiLGg9WzBdLHA9ZnVuY3Rpb24obil7MT09PXImJihufHwoZT1lLnJlcGxhY2UoL15cXHMqXFxuXFxzKnxcXHMqXFxuXFxzKiQvZyxcIlwiKSkpP2gucHVzaCgwLG4sZSk6Mz09PXImJihufHxlKT8oaC5wdXNoKDMsbixlKSxyPTIpOjI9PT1yJiZcIi4uLlwiPT09ZSYmbj9oLnB1c2goNCxuLDApOjI9PT1yJiZlJiYhbj9oLnB1c2goNSwwLCEwLGUpOnI+PTUmJigoZXx8IW4mJjU9PT1yKSYmKGgucHVzaChyLDAsZSxzKSxyPTYpLG4mJihoLnB1c2gocixuLDAscykscj02KSksZT1cIlwifSxhPTA7YTxuLmxlbmd0aDthKyspe2EmJigxPT09ciYmcCgpLHAoYSkpO2Zvcih2YXIgbD0wO2w8blthXS5sZW5ndGg7bCsrKXQ9blthXVtsXSwxPT09cj9cIjxcIj09PXQ/KHAoKSxoPVtoXSxyPTMpOmUrPXQ6ND09PXI/XCItLVwiPT09ZSYmXCI+XCI9PT10PyhyPTEsZT1cIlwiKTplPXQrZVswXTp1P3Q9PT11P3U9XCJcIjplKz10OidcIic9PT10fHxcIidcIj09PXQ/dT10OlwiPlwiPT09dD8ocCgpLHI9MSk6ciYmKFwiPVwiPT09dD8ocj01LHM9ZSxlPVwiXCIpOlwiL1wiPT09dCYmKHI8NXx8XCI+XCI9PT1uW2FdW2wrMV0pPyhwKCksMz09PXImJihoPWhbMF0pLHI9aCwoaD1oWzBdKS5wdXNoKDIsMCxyKSxyPTApOlwiIFwiPT09dHx8XCJcXHRcIj09PXR8fFwiXFxuXCI9PT10fHxcIlxcclwiPT09dD8ocCgpLHI9Mik6ZSs9dCksMz09PXImJlwiIS0tXCI9PT1lJiYocj00LGg9aFswXSl9cmV0dXJuIHAoKSxofShzKSksciksYXJndW1lbnRzLFtdKSkubGVuZ3RoPjE/cjpyWzBdfVxuIiwKICAgICIvLyBzcmMvc2lnbmFscy50c1xuaW1wb3J0IHR5cGUge1xuICBTaWduYWwsIFJlYWRvbmx5U2lnbmFsLCBSZWFkb25seVNpZ25hbEFycmF5LCBTaWduYWxBcnJheSxcbiAgTGlzdFJlbmRlcmVyLCBLZXlcbn0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyogbWljcm90YXNrIHNjaGVkdWxlciAqL1xuY29uc3Qgc2NoZWR1bGVNaWNyb3Rhc2s6IChjYjogKCkgPT4gdm9pZCkgPT4gdm9pZCA9XG4gIHR5cGVvZiBxdWV1ZU1pY3JvdGFzayA9PT0gXCJmdW5jdGlvblwiID8gcXVldWVNaWNyb3Rhc2sgOiAoY2IpID0+IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oY2IpO1xuXG4vKiB0cmFja2luZyAqL1xudHlwZSBBbnlTaWduYWwgPSBTaWduYWw8dW5rbm93bj47XG5pbnRlcmZhY2UgQ29tcHV0YXRpb24ge1xuICBhY3RpdmU6IGJvb2xlYW47XG4gIGxpbmtzOiBNYXA8QW55U2lnbmFsLCAoKSA9PiB2b2lkPjtcbiAgY2xlYW51cEZuPzogKCkgPT4gdm9pZDtcbiAgc2NoZWR1bGVkOiBib29sZWFuO1xuICBydW4oKTogdm9pZDtcbiAgc2NoZWR1bGUoKTogdm9pZDtcbn1cbmxldCBDVVJSRU5UOiBDb21wdXRhdGlvbiB8IG51bGwgPSBudWxsO1xuXG5mdW5jdGlvbiBjbGVhbnVwKGNvbXA6IENvbXB1dGF0aW9uKSB7XG4gIGZvciAoY29uc3QgdW4gb2YgY29tcC5saW5rcy52YWx1ZXMoKSkgeyB0cnkgeyB1bigpOyB9IGNhdGNoIHt9IH1cbiAgY29tcC5saW5rcy5jbGVhcigpO1xuICBpZiAoY29tcC5jbGVhbnVwRm4pIHsgY29uc3QgYyA9IGNvbXAuY2xlYW51cEZuOyBjb21wLmNsZWFudXBGbiA9IHVuZGVmaW5lZDsgdHJ5IHsgYygpOyB9IGNhdGNoIHt9IH1cbn1cbmZ1bmN0aW9uIHRyYWNrKHNpZzogQW55U2lnbmFsKSB7XG4gIGNvbnN0IGMgPSBDVVJSRU5UO1xuICBpZiAoIWMgfHwgIWMuYWN0aXZlIHx8IGMubGlua3MuaGFzKHNpZykpIHJldHVybjtcbiAgY29uc3QgdW5zdWIgPSAoc2lnIGFzIFNpZ25hbDx1bmtub3duPikuc3Vic2NyaWJlKCgpID0+IHsgaWYgKGMuYWN0aXZlKSBjLnNjaGVkdWxlKCk7IH0pO1xuICBjLmxpbmtzLnNldChzaWcsIHVuc3ViKTtcbn1cblxuLyogLS0tLSBESSBkbyByZW5kZXJlciBkZSBsaXN0YXMgKHNlbSBpbXBvcnQgZGUgaHlwZXIpIC0tLS0gKi9cbmxldCBMSVNUX1JFTkRFUkVSOiBMaXN0UmVuZGVyZXIgfCBudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBzZXRMaXN0UmVuZGVyZXJJbXBsKGZuOiBMaXN0UmVuZGVyZXIpOiB2b2lkIHtcbiAgTElTVF9SRU5ERVJFUiA9IGZuO1xufVxuXG4vLyDinIUgaGVscGVyOiByZW1vdmUgbyAuc2V0LCBtYW50w6ltIGdldC9zdWJzY3JpYmUvbWFwXG5leHBvcnQgZnVuY3Rpb24gYXNSZWFkb25seUxpc3Q8VD4oczogU2lnbmFsQXJyYXk8VD4pOiBSZWFkb25seVNpZ25hbEFycmF5PFQ+IHtcbiAgcmV0dXJuIHsgZ2V0OiBzLmdldCwgc3Vic2NyaWJlOiBzLnN1YnNjcmliZSwgbWFwOiBzLm1hcCB9O1xufVxuXG4vKiAtLS0tIHNpbmFpcyAtLS0tICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2lnbmFsPFQ+KGluaXRpYWw6IFRbXSk6IFNpZ25hbEFycmF5PFQ+O1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNpZ25hbDxUPihpbml0aWFsOiBUKTogU2lnbmFsPFQ+O1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNpZ25hbDxUPihpbml0aWFsOiBUIHwgVFtdKTogU2lnbmFsPFQ+IHwgU2lnbmFsQXJyYXk8VD4ge1xuICBsZXQgdmFsdWUgPSBpbml0aWFsIGFzIFQ7XG4gIGNvbnN0IHN1YnMgPSBuZXcgU2V0PCh2OiBUKSA9PiB2b2lkPigpO1xuXG4gIGNvbnN0IHNlbGY6IFNpZ25hbDxUPiA9IHtcbiAgICBnZXQ6ICgpID0+IHsgdHJhY2soc2VsZiBhcyB1bmtub3duIGFzIEFueVNpZ25hbCk7IHJldHVybiB2YWx1ZTsgfSxcbiAgICBzZXQ6ICh2KSA9PiB7XG4gICAgICBjb25zdCBuZXh0ID0gdHlwZW9mIHYgPT09IFwiZnVuY3Rpb25cIiA/ICh2IGFzIChwOiBUKSA9PiBUKSh2YWx1ZSkgOiB2O1xuICAgICAgaWYgKE9iamVjdC5pcyhuZXh0LCB2YWx1ZSkpIHJldHVybjtcbiAgICAgIHZhbHVlID0gbmV4dDtcbiAgICAgIHN1YnMuZm9yRWFjaCgoZm4pID0+IGZuKHZhbHVlKSk7XG4gICAgfSxcbiAgICBzdWJzY3JpYmU6IChmbikgPT4geyBzdWJzLmFkZChmbik7IHJldHVybiAoKSA9PiBzdWJzLmRlbGV0ZShmbik7IH0sXG4gIH07XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5pdGlhbCkpIHtcbiAgICAvLyBIZXVyw61zdGljYSBkZSBjaGF2ZTogaWQva2V5IC0+IFdlYWtNYXAgaWRlbnRpZGFkZSAtPiBwcmltaXRpdm9cbiAgICBjb25zdCBvYmpLZXlzID0gbmV3IFdlYWtNYXA8b2JqZWN0LCBLZXk+KCk7XG4gICAgY29uc3QgcHJpbVNlZW4gPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICAgIGNvbnN0IGtleU9mID0gKGl0ZW06IHVua25vd24pOiBLZXkgPT4ge1xuICAgICAgaWYgKGl0ZW0gIT09IG51bGwgJiYgdHlwZW9mIGl0ZW0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgY29uc3QgcmVjID0gaXRlbSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgaWYgKFwiaWRcIiBpbiByZWMpIHJldHVybiByZWMuaWQgYXMgS2V5O1xuICAgICAgICBpZiAoXCJrZXlcIiBpbiByZWMpIHJldHVybiByZWMua2V5IGFzIEtleTtcbiAgICAgICAgY29uc3QgbyA9IGl0ZW0gYXMgb2JqZWN0O1xuICAgICAgICBjb25zdCBleCA9IG9iaktleXMuZ2V0KG8pO1xuICAgICAgICBpZiAoZXggIT09IHVuZGVmaW5lZCkgcmV0dXJuIGV4O1xuICAgICAgICBjb25zdCBzeW0gPSBTeW1ib2woXCJpdGVtXCIpO1xuICAgICAgICBvYmpLZXlzLnNldChvLCBzeW0pO1xuICAgICAgICByZXR1cm4gc3ltO1xuICAgICAgfVxuICAgICAgY29uc3QgayA9IGAke3R5cGVvZiBpdGVtfToke1N0cmluZyhpdGVtKX1gO1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICBjb25zdCBuID0gKHByaW1TZWVuLmdldChrKSA/PyAwKSArIDE7XG4gICAgICAgIHByaW1TZWVuLnNldChrLCBuKTtcbiAgICAgICAgaWYgKG4gPiAxKSBjb25zb2xlLndhcm4oXCJbc2xhc2hdIG1hcCgpOiBkdXBsaWNhdGVkIHByaW1pdGl2ZSBrZXlcIiwgaXRlbSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaztcbiAgICB9O1xuXG4gICAgY29uc3QgbGlzdFNlbGYgPSBzZWxmIGFzIHVua25vd24gYXMgU2lnbmFsQXJyYXk8dW5rbm93bj47XG4gICAgbGlzdFNlbGYubWFwID0gKHJlbmRlcikgPT4ge1xuICAgICAgaWYgKCFMSVNUX1JFTkRFUkVSKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIltzbGFzaF0gbGlzdCByZW5kZXJlciBub3QgcmVnaXN0ZXJlZCDigJQgZW5zdXJlIGBoeXBlcmAgaXMgaW1wb3J0ZWQgYmVmb3JlIHVzaW5nIGxpc3RTaWduYWwubWFwKClcIik7XG4gICAgICB9XG4gICAgICBjb25zdCBzaWdBcnIgPSBzZWxmIGFzIHVua25vd24gYXMgU2lnbmFsPHVua25vd25bXT47XG4gICAgICByZXR1cm4gTElTVF9SRU5ERVJFUihzaWdBcnIsIGtleU9mIGFzICh4OiB1bmtub3duKSA9PiBLZXksIChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IGFyciA9IHNpZ0Fyci5nZXQoKTtcbiAgICAgICAgY29uc3QgaWR4ID0gYXJyLmluZGV4T2YoaXRlbSk7XG4gICAgICAgIHJldHVybiByZW5kZXIoaXRlbSwgaWR4KTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGxpc3RTZWxmIGFzIHVua25vd24gYXMgU2lnbmFsQXJyYXk8VD47XG4gIH1cblxuICByZXR1cm4gc2VsZjtcbn1cblxuICBleHBvcnQgZnVuY3Rpb24gY3JlYXRlU2lnbmFsQXJyYXk8VD4oaW5pdGlhbDogVFtdID0gW10pOiBTaWduYWxBcnJheTxUPiB7XG4gICAgcmV0dXJuIGNyZWF0ZVNpZ25hbDxUPihpbml0aWFsKTtcbiAgfVxuXG5leHBvcnQgZnVuY3Rpb24gZWZmZWN0KHJ1bjogKCkgPT4gdm9pZCB8ICgoKSA9PiB2b2lkKSk6ICgpID0+IHZvaWQge1xuICBjb25zdCBjb21wOiBDb21wdXRhdGlvbiA9IHtcbiAgICBhY3RpdmU6IHRydWUsIGxpbmtzOiBuZXcgTWFwKCksIHNjaGVkdWxlZDogZmFsc2UsXG4gICAgcnVuOiAoKSA9PiB7XG4gICAgICBjb21wLnNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgY2xlYW51cChjb21wKTtcbiAgICAgIGNvbnN0IHByZXYgPSBDVVJSRU5UOyBDVVJSRU5UID0gY29tcDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHJ1bigpOyBpZiAodHlwZW9mIHJldCA9PT0gXCJmdW5jdGlvblwiKSBjb21wLmNsZWFudXBGbiA9IHJldDtcbiAgICAgIH0gZmluYWxseSB7IENVUlJFTlQgPSBwcmV2OyB9XG4gICAgfSxcbiAgICBzY2hlZHVsZTogKCkgPT4ge1xuICAgICAgaWYgKGNvbXAuc2NoZWR1bGVkIHx8ICFjb21wLmFjdGl2ZSkgcmV0dXJuO1xuICAgICAgY29tcC5zY2hlZHVsZWQgPSB0cnVlO1xuICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soKCkgPT4geyBpZiAoY29tcC5hY3RpdmUpIGNvbXAucnVuKCk7IH0pO1xuICAgIH0sXG4gIH07XG4gIGNvbXAucnVuKCk7XG4gIHJldHVybiAoKSA9PiB7IGNvbXAuYWN0aXZlID0gZmFsc2U7IGNsZWFudXAoY29tcCk7IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlZDxUPihjYWxjOiAoKSA9PiBUKTogUmVhZG9ubHlTaWduYWw8VD4ge1xuICBjb25zdCBvdXQgPSBjcmVhdGVTaWduYWw8VD4odW5kZWZpbmVkIGFzIHVua25vd24gYXMgVCk7XG4gIGxldCBpbml0ZWQgPSBmYWxzZTtcbiAgY29uc3Qgc3RvcCA9IGVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IGNhbGMoKTtcbiAgICBpZiAoIWluaXRlZCB8fCAhT2JqZWN0LmlzKG91dC5nZXQoKSwgbmV4dCkpIHsgb3V0LnNldChuZXh0KTsgaW5pdGVkID0gdHJ1ZTsgfVxuICB9KTtcbiAgdm9pZCBzdG9wO1xuICByZXR1cm4geyBnZXQ6IG91dC5nZXQsIHN1YnNjcmliZTogb3V0LnN1YnNjcmliZSB9O1xufVxuZXhwb3J0IGNvbnN0IG1lbW8gPSBjb21wdXRlZDtcblxuIiwKICAgICJpbXBvcnQgaHRtIGZyb20gXCJodG1cIjtcbmltcG9ydCB7IHNldExpc3RSZW5kZXJlckltcGwsIGNyZWF0ZVNpZ25hbCB9IGZyb20gXCIuL3NpZ25hbHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgSFRNVGVtcGxhdGUsXG4gIEhUTU1vZHVsZSxcbiAgUHJvcHMsXG4gIENoaWxkLFxuICBFbGVtZW50aXNoLFxuICBFdmVudEhhbmRsZXIsXG4gIEV2ZW50T3B0aW9ucyxcbiAgRXZlbnRUdXBsZSxcbiAgS2V5LFxuICBSZWFkb25seVNpZ25hbCxcbiAgU2lnbmFsLFxuICBTaWduYWxMaWtlLFxufSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBUaXBvcyBlIHV0aWxpdMOhcmlvc1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxudHlwZSBIeWRyYXRlQ29udGV4dCA9IHtcbiAgY3Vyc29yOiBOb2RlIHwgbnVsbDsgICAgICAgIC8vIFBvbnRlaXJvIHBhcmEgbsOzIGF0dWFsIGRvIERPTVxuICByb290OiBFbGVtZW50OyAgICAgICAgICAgICAgLy8gQ29udGFpbmVyIHJhaXpcbiAgc2lnbmFsczogTWFwPHN0cmluZywgU2lnbmFsPHVua25vd24+PjsgLy8gU2lnbmFscyByZXN0YXVyYWRvc1xufTtcblxubGV0IGh5ZHJhdGVDb250ZXh0OiBIeWRyYXRlQ29udGV4dCB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0SHlkcmF0ZUNvbnRleHQoY3R4OiBIeWRyYXRlQ29udGV4dCB8IG51bGwpOiB2b2lkIHtcbiAgaHlkcmF0ZUNvbnRleHQgPSBjdHg7XG59XG5cbmZ1bmN0aW9uIGlzU2lnbmFsTGlrZSh4OiB1bmtub3duKTogeCBpcyBTaWduYWxMaWtlIHtcbiAgcmV0dXJuIChcbiAgICAhIXggJiZcbiAgICB0eXBlb2YgKHggYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLmdldCA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgdHlwZW9mICh4IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5zdWJzY3JpYmUgPT09IFwiZnVuY3Rpb25cIlxuICApO1xufVxuXG5mdW5jdGlvbiB0b1N0cih2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIHYgPT0gbnVsbCA/IFwiXCIgOiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBTdHJpbmcodik7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIENsZWFudXBzIHBvciBuw7MgKGxpZmVjeWNsZSBiw6FzaWNvKVxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuY29uc3QgQ0xFQU5VUFMgPSBuZXcgV2Vha01hcDxOb2RlLCBBcnJheTwoKSA9PiB2b2lkPj4oKTtcblxuZnVuY3Rpb24gYWRkQ2xlYW51cChub2RlOiBOb2RlLCBmbjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICBjb25zdCBhcnIgPSBDTEVBTlVQUy5nZXQobm9kZSk7XG4gIGlmIChhcnIpIGFyci5wdXNoKGZuKTtcbiAgZWxzZSBDTEVBTlVQUy5zZXQobm9kZSwgW2ZuXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95Tm9kZShub2RlOiBOb2RlKTogdm9pZCB7XG4gIGNvbnN0IGZucyA9IENMRUFOVVBTLmdldChub2RlKTtcbiAgaWYgKGZucykge1xuICAgIGZvciAoY29uc3QgZiBvZiBmbnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGYoKTtcbiAgICAgIH0gY2F0Y2ggeyB9XG4gICAgfVxuICAgIENMRUFOVVBTLmRlbGV0ZShub2RlKTtcbiAgfVxuICBpZiAobm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgJiYgbm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICBub2RlLmNoaWxkTm9kZXMuZm9yRWFjaCgoY2hpbGQpID0+IGRlc3Ryb3lOb2RlKGNoaWxkKSk7XG4gIH1cbn1cblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogQ2hpbGRyZW4gY29tIHJlYXRpdmlkYWRlIChpbnRlcnBvbGHDp8O1ZXMpXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4vLyBSZW5kZXJpemEgdW0gU2lnbmFsTGlrZTx1bmtub3duPiBjb21vIGJsb2NvIHJlYXRpdm8gZW50cmUgbWFyY2Fkb3Jlc1xuZnVuY3Rpb24gYXBwZW5kUmVhY3RpdmVDaGlsZChwYXJlbnQ6IE5vZGUsIHNpZzogU2lnbmFsTGlrZTx1bmtub3duPik6IHZvaWQge1xuICBjb25zdCBzdGFydCA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCJzaWc6c3RhcnRcIik7XG4gIGNvbnN0IGVuZCAgID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcInNpZzplbmRcIik7XG4gIHBhcmVudC5hcHBlbmRDaGlsZChzdGFydCk7XG4gIHBhcmVudC5hcHBlbmRDaGlsZChlbmQpO1xuXG4gIGNvbnN0IHJlbmRlckJldHdlZW4gPSAodmFsdWU6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICAvLyBsaW1wYSBuw7NzIGF0dWFpcyBlbnRyZSBzdGFydCBlIGVuZFxuICAgIGxldCBuID0gc3RhcnQubmV4dFNpYmxpbmc7XG4gICAgd2hpbGUgKG4gJiYgbiAhPT0gZW5kKSB7XG4gICAgICBjb25zdCBuZXh0ID0gbi5uZXh0U2libGluZztcbiAgICAgIGRlc3Ryb3lOb2RlKG4pO1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG4pO1xuICAgICAgbiA9IG5leHQ7XG4gICAgfVxuXG4gICAgLy8gaW5zZXJlIG8gbm92byBjb250ZcO6ZG8gYW50ZXMgZG8gbWFyY2Fkb3IgJ2VuZCdcbiAgICBjb25zdCBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xuICAgICAgLy8gbmFkYSBhIGluc2VyaXJcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgdmFsdWUpIGFwcGVuZENoaWxkU21hcnQoZnJhZywgdiBhcyBDaGlsZCk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgIGFwcGVuZE5vZGVTYWZlKGZyYWcsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc3RyaW5nL251bWJlci9ib29sZWFuIC0+IHRleHRvXG4gICAgICBmcmFnLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRvU3RyKHZhbHVlKSkpO1xuICAgIH1cbiAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGZyYWcsIGVuZCk7XG4gIH07XG5cbiAgLy8gMcKqIHBpbnR1cmEgKyBhc3NpbmF0dXJhIHJlYXRpdmFcbiAgcmVuZGVyQmV0d2VlbihzaWcuZ2V0KCkpO1xuICBjb25zdCB1bnN1YiA9IHNpZy5zdWJzY3JpYmUocmVuZGVyQmV0d2Vlbik7XG4gIC8vIGNsZWFudXAgcXVhbmRvIG8gYmxvY28gc2FpciBkbyBET01cbiAgYWRkQ2xlYW51cChzdGFydCwgdW5zdWIpO1xufVxuXG5cbi8vIDEpIGhlbHBlciBwYXJhIGFuZXhhciB1bSBOb2RlIGNvbSBzZWd1cmFuw6dhIChzZW0gbW92ZXIvZXhhdXJpcilcbmZ1bmN0aW9uIGFwcGVuZE5vZGVTYWZlKHBhcmVudDogTm9kZSwgbm9kZTogTm9kZSk6IHZvaWQge1xuICAvLyBGcmFnbWVudDogw6kgY29uc3VtaWRvIGFvIGFwcGVuZCwgZW50w6NvIGNsb25lIHNlbXByZVxuICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFKSB7XG4gICAgcGFyZW50LmFwcGVuZENoaWxkKG5vZGUuY2xvbmVOb2RlKHRydWUpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gTm9kZSBqw6EgZXN0w6EgZW0gb3V0cm8gcGFyZW50PyBjbG9uZSBwYXJhIG7Do28gbW92ZXJcbiAgaWYgKG5vZGUucGFyZW50Tm9kZSAmJiBub2RlLnBhcmVudE5vZGUgIT09IHBhcmVudCkge1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChub2RlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHBhcmVudC5hcHBlbmRDaGlsZChub2RlKTtcbn1cblxuLy8gMikgdXNlIG8gaGVscGVyIGRlbnRybyBkZSBhcHBlbmRDaGlsZFNtYXJ0XG5mdW5jdGlvbiBhcHBlbmRDaGlsZFNtYXJ0KHBhcmVudDogTm9kZSwgY2hpbGQ6IENoaWxkKTogdm9pZCB7XG4gIGlmIChjaGlsZCA9PSBudWxsIHx8IGNoaWxkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gIGlmIChpc1NpZ25hbExpa2UoY2hpbGQpKSB7XG4gICAgYXBwZW5kUmVhY3RpdmVDaGlsZChwYXJlbnQsIGNoaWxkKTsgICAvLyA8LSBhbnRlcyBlcmEgYXBwZW5kUmVhY3RpdmVUZXh0XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIGNoaWxkKSBhcHBlbmRDaGlsZFNtYXJ0KHBhcmVudCwgYyBhcyBDaGlsZCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGNoaWxkIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGFwcGVuZE5vZGVTYWZlKHBhcmVudCwgY2hpbGQpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGFwcGVuZE5vZGVTYWZlKHBhcmVudCwgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodG9TdHIoY2hpbGQpKSk7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIFByb3BzL2F0dHJzL2V2ZW50b3MgKGNvbSBzdXBvcnRlIHJlYXRpdm8pXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5mdW5jdGlvbiBhcHBseUNsYXNzKGVsOiBIVE1MRWxlbWVudCwgdjogdW5rbm93bik6IHZvaWQge1xuICBpZiAodiA9PSBudWxsIHx8IHYgPT09IGZhbHNlKSB7XG4gICAgZWwuY2xhc3NOYW1lID0gXCJcIjtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XG4gICAgZWwuY2xhc3NOYW1lID0gdjtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkodikpIHtcbiAgICBlbC5jbGFzc05hbWUgPSB2LmZpbHRlcihCb29sZWFuKS5tYXAoKHgpID0+IFN0cmluZyh4KSkuam9pbihcIiBcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2YgdiA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IGxpc3QgPSBPYmplY3QuZW50cmllcyh2IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVxuICAgICAgLmZpbHRlcigoWywgb25dKSA9PiBCb29sZWFuKG9uKSlcbiAgICAgIC5tYXAoKFtrXSkgPT4gayk7XG4gICAgZWwuY2xhc3NOYW1lID0gbGlzdC5qb2luKFwiIFwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZWwuY2xhc3NOYW1lID0gU3RyaW5nKHYpO1xufVxuXG4vKiA9PT09IEd1YXJkcyBkZSBldmVudG8gKHNlZ3Vyb3MpID09PT0gKi9cblxuZnVuY3Rpb24gaXNFdmVudEhhbmRsZXIoeDogdW5rbm93bik6IHggaXMgRXZlbnRIYW5kbGVyIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT09IG51bGwgJiYgXCJoYW5kbGVFdmVudFwiIGluICh4IGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KSlcbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNFdmVudE9wdGlvbnMoeDogdW5rbm93bik6IHggaXMgRXZlbnRPcHRpb25zIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSBcImJvb2xlYW5cIiB8fCAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGlzRXZlbnRUdXBsZSh4OiB1bmtub3duKTogeCBpcyBFdmVudFR1cGxlIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHgpKSByZXR1cm4gZmFsc2U7XG4gIGlmICh4Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBmbjA6IHVua25vd24gPSB4WzBdO1xuICBpZiAoIWlzRXZlbnRIYW5kbGVyKGZuMCkpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgbWF5YmVPcHRzOiB1bmtub3duID0geC5sZW5ndGggPiAxID8geFsxXSA6IHVuZGVmaW5lZDtcbiAgaWYgKG1heWJlT3B0cyAhPT0gdW5kZWZpbmVkICYmICFpc0V2ZW50T3B0aW9ucyhtYXliZU9wdHMpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBwYXJzZUV2ZW50UHJvcCh4OiB1bmtub3duKTogeyBoYW5kbGVyOiBFdmVudEhhbmRsZXI7IG9wdGlvbnM/OiBFdmVudE9wdGlvbnMgfSB8IG51bGwge1xuICBpZiAoaXNFdmVudEhhbmRsZXIoeCkpIHtcbiAgICByZXR1cm4geyBoYW5kbGVyOiB4IH07XG4gIH1cbiAgaWYgKGlzRXZlbnRUdXBsZSh4KSkge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB4WzBdO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB4Lmxlbmd0aCA+IDEgPyB4WzFdIDogdW5kZWZpbmVkO1xuICAgIHJldHVybiB7IGhhbmRsZXIsIG9wdGlvbnMgfTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyogPT09PSBzZXRFdmVudCBjb20gYXNzaW5hdHVyYSDDum5pY2EgPT09PSAqL1xuZnVuY3Rpb24gc2V0RXZlbnQoZWw6IEVsZW1lbnQsIHR5cGU6IHN0cmluZywgaGFuZGxlcjogRXZlbnRIYW5kbGVyLCBvcHRzPzogRXZlbnRPcHRpb25zKTogdm9pZCB7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgb3B0cyk7XG4gIGFkZENsZWFudXAoZWwsICgpID0+IGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgb3B0cykpO1xufVxuXG4vKiA9PT09IHByb3BzIHJlYXRpdmFzID09PT0gKi9cbi8vID09PSBSRUFUSVZPOiBhcGxpY2EgdmFsb3IgdmluZG8gZGUgU2lnbmFsIGUgbWFudMOpbSBET00gc2luY3Jvbml6YWRvID09PVxuZnVuY3Rpb24gc2V0UHJvcFJlYWN0aXZlKGVsOiBFbGVtZW50aXNoLCBrZXk6IHN0cmluZywgc2lnOiBTaWduYWxMaWtlPHVua25vd24+KTogdm9pZCB7XG4gIGNvbnN0IGFwcGx5ID0gKHY6IHVua25vd24pOiB2b2lkID0+IHtcbiAgICAvLyBjbGFzc2VzIHJlYXRpdmFzXG4gICAgaWYgKGtleSA9PT0gXCJjbGFzc1wiIHx8IGtleSA9PT0gXCJjbGFzc05hbWVcIikge1xuICAgICAgYXBwbHlDbGFzcyhlbCBhcyBIVE1MRWxlbWVudCwgdik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZXN0aWxvIHJlYXRpdm8gcG9yIG9iamV0b1xuICAgIGlmIChrZXkgPT09IFwic3R5bGVcIiAmJiB2ICYmIHR5cGVvZiB2ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBPYmplY3QuYXNzaWduKChlbCBhcyBIVE1MRWxlbWVudCkuc3R5bGUsIHYgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGlucHV0cy90ZXh0YXJlYS9zZWxlY3Q6IGNvbnRyb2xsZWQgdmFsdWVcbiAgICBpZiAoa2V5ID09PSBcInZhbHVlXCIpIHtcbiAgICAgIGNvbnN0IGN0bCA9IGVsIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICBjb25zdCBuZXh0ID0gdiA9PSBudWxsID8gXCJcIiA6IFN0cmluZyh2KTtcblxuICAgICAgLy8gdGV4dG9cbiAgICAgIGlmIChjdGwudmFsdWUgIT09IG5leHQpIGN0bC52YWx1ZSA9IG5leHQ7XG5cbiAgICAgIC8vIG1hbnRlciBkZWZhdWx0VmFsdWUgYWxpbmhhZG8gKGVudGVyL3Jlc2V0IGV0Yy4pXG4gICAgICBpZiAoXCJkZWZhdWx0VmFsdWVcIiBpbiBjdGwpIHtcbiAgICAgICAgY29uc3QgdCA9IGN0bCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICAgICAgaWYgKHQuZGVmYXVsdFZhbHVlICE9PSBuZXh0KSB0LmRlZmF1bHRWYWx1ZSA9IG5leHQ7XG4gICAgICB9XG5cbiAgICAgIC8vIHNlbGVjdDogbWFyY2FyIG9wdGlvbiBzZWxlY2lvbmFkb1xuICAgICAgaWYgKGN0bCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB7XG4gICAgICAgIGZvciAoY29uc3Qgb3B0IG9mIEFycmF5LmZyb20oY3RsLm9wdGlvbnMpKSB7XG4gICAgICAgICAgb3B0LnNlbGVjdGVkID0gb3B0LnZhbHVlID09PSBuZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY2hlY2tib3gvcmFkaW86IGNvbnRyb2xsZWQgY2hlY2tlZFxuICAgIGlmIChrZXkgPT09IFwiY2hlY2tlZFwiKSB7XG4gICAgICBjb25zdCBib3ggPSBlbCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgY29uc3QgbmV4dCA9IEJvb2xlYW4odik7XG4gICAgICBpZiAoYm94LmNoZWNrZWQgIT09IG5leHQpIGJveC5jaGVja2VkID0gbmV4dDtcbiAgICAgIGlmIChib3guZGVmYXVsdENoZWNrZWQgIT09IG5leHQpIGJveC5kZWZhdWx0Q2hlY2tlZCA9IG5leHQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gcHJvcHJpZWRhZGUgZGlyZXRhIHNlIGV4aXN0aXI7IHNlbsOjbyBhdHJpYnV0b1xuICAgIGlmIChrZXkgaW4gZWwpIHtcbiAgICAgIGNvbnN0IG9rID0gUmVmbGVjdC5zZXQoZWwgYXMgb2JqZWN0LCBrZXksIHYpO1xuICAgICAgaWYgKCFvaykge1xuICAgICAgICBpZiAodiA9PSBudWxsIHx8IHYgPT09IGZhbHNlKSBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgZWxzZSBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBTdHJpbmcodikpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodiA9PSBudWxsIHx8IHYgPT09IGZhbHNlKSBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIGVsc2UgZWwuc2V0QXR0cmlidXRlKGtleSwgU3RyaW5nKHYpKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gYXBsaWNhIGVzdGFkbyBhdHVhbCBlIGFzc2luYSBtdWRhbsOnYXNcbiAgYXBwbHkoc2lnLmdldCgpKTtcbiAgY29uc3QgdW5zdWIgPSBzaWcuc3Vic2NyaWJlKGFwcGx5KTtcbiAgYWRkQ2xlYW51cChlbCwgdW5zdWIpO1xufVxuXG4vLyA9PT0gTsODTyBSRUFUSVZPOiBhcGxpY2EgdmFsb3IgbGl0ZXJhbCwgZXZlbnRzLCBjbGFzc2VzLCBlc3RpbG8sIGV0Yy4gPT09XG5mdW5jdGlvbiBzZXRQcm9wKGVsOiBFbGVtZW50aXNoLCBrZXk6IHN0cmluZywgdmFsOiB1bmtub3duKTogdm9pZCB7XG4gIGlmIChrZXkgPT09IFwiY2hpbGRyZW5cIikgcmV0dXJuO1xuXG4gIC8vIDEpIFNpZ25hbHMgcHJpbWVpcm86IGNvbnZlcnRlIHBhcmEgcHJvcCByZWF0aXZvXG4gIGlmIChpc1NpZ25hbExpa2UodmFsKSkge1xuICAgIHNldFByb3BSZWFjdGl2ZShlbCwga2V5LCB2YWwpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIDIpIEV2ZW50b3M6IG9uQ2xpY2sgLyBvbklucHV0IC8gb25DaGFuZ2UgLyAuLi5cbiAgaWYgKGtleS5zdGFydHNXaXRoKFwib25cIikgJiYga2V5WzJdID09PSBrZXlbMl0/LnRvVXBwZXJDYXNlKCkpIHtcbiAgICBjb25zdCB0eXBlID0ga2V5LnNsaWNlKDIpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VFdmVudFByb3AodmFsKTtcbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHBhcnNlZC5oYW5kbGVyLCBwYXJzZWQub3B0aW9ucyk7XG4gICAgICBhZGRDbGVhbnVwKGVsLCAoKSA9PiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIHBhcnNlZC5oYW5kbGVyLCBwYXJzZWQub3B0aW9ucykpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyAzKSBFc3RpbG8gcG9yIG9iamV0b1xuICBpZiAoa2V5ID09PSBcInN0eWxlXCIgJiYgdmFsICYmIHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcbiAgICBPYmplY3QuYXNzaWduKChlbCBhcyBIVE1MRWxlbWVudCkuc3R5bGUsIHZhbCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gNCkgQ2xhc3Nlc1xuICBpZiAoa2V5ID09PSBcImNsYXNzXCIgfHwga2V5ID09PSBcImNsYXNzTmFtZVwiKSB7XG4gICAgYXBwbHlDbGFzcyhlbCBhcyBIVE1MRWxlbWVudCwgdmFsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyA1KSBJbnB1dHMvdGV4dGFyZWEvc2VsZWN0IGNvbnRyb2xhZG9zIChzZXR1cCBpbmljaWFsIG1lc21vIHNlbSBzaWduYWwpXG4gIGlmIChrZXkgPT09IFwidmFsdWVcIikge1xuICAgIGNvbnN0IGN0bCA9IGVsIGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgY29uc3QgbmV4dCA9IHZhbCA9PSBudWxsID8gXCJcIiA6IFN0cmluZyh2YWwpO1xuXG4gICAgaWYgKGN0bC52YWx1ZSAhPT0gbmV4dCkgY3RsLnZhbHVlID0gbmV4dDtcbiAgICBpZiAoXCJkZWZhdWx0VmFsdWVcIiBpbiBjdGwpIHtcbiAgICAgIGNvbnN0IHQgPSBjdGwgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgICBpZiAodC5kZWZhdWx0VmFsdWUgIT09IG5leHQpIHQuZGVmYXVsdFZhbHVlID0gbmV4dDtcbiAgICB9XG4gICAgaWYgKGN0bCBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50KSB7XG4gICAgICBmb3IgKGNvbnN0IG9wdCBvZiBBcnJheS5mcm9tKGN0bC5vcHRpb25zKSkge1xuICAgICAgICBvcHQuc2VsZWN0ZWQgPSBvcHQudmFsdWUgPT09IG5leHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChrZXkgPT09IFwiY2hlY2tlZFwiKSB7XG4gICAgY29uc3QgYm94ID0gZWwgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBjb25zdCBuZXh0ID0gQm9vbGVhbih2YWwpO1xuICAgIGlmIChib3guY2hlY2tlZCAhPT0gbmV4dCkgYm94LmNoZWNrZWQgPSBuZXh0O1xuICAgIGlmIChib3guZGVmYXVsdENoZWNrZWQgIT09IG5leHQpIGJveC5kZWZhdWx0Q2hlY2tlZCA9IG5leHQ7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gNikgUHJvcHJpZWRhZGUgZGlyZXRhIG91IGF0cmlidXRvXG4gIGlmIChrZXkgaW4gZWwpIHtcbiAgICBjb25zdCBvayA9IFJlZmxlY3Quc2V0KGVsIGFzIG9iamVjdCwga2V5LCB2YWwpO1xuICAgIGlmICghb2spIHtcbiAgICAgIGlmICh2YWwgPT0gbnVsbCB8fCB2YWwgPT09IGZhbHNlKSBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIGVsc2UgZWwuc2V0QXR0cmlidXRlKGtleSwgU3RyaW5nKHZhbCkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAodmFsID09IG51bGwgfHwgdmFsID09PSBmYWxzZSkgZWwucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgZWxzZSBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBTdHJpbmcodmFsKSk7XG4gIH1cbn1cblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogSGlkcmF0YcOnw6NvIC0gSGVscGVyc1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuLy8gSGVscGVyIHBhcmEgcHJvY2Vzc2FyIHZhbG9yZXMgZGUgY2xhc3NlIChjb3BpYWRvIGRlIGh5ZHJhdGUudHMpXG5mdW5jdGlvbiBwcm9jZXNzQ2xhc3NWYWx1ZSh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHJldHVybiB2YWx1ZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLmZpbHRlcihCb29sZWFuKS5qb2luKFwiIFwiKTtcbiAgfVxuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVxuICAgICAgLmZpbHRlcigoWywgb25dKSA9PiBCb29sZWFuKG9uKSlcbiAgICAgIC5tYXAoKFtrXSkgPT4gaylcbiAgICAgIC5qb2luKFwiIFwiKTtcbiAgfVxuICByZXR1cm4gXCJcIjtcbn1cblxuLy8gSGlkcmF0YXIgYXRyaWJ1dG9zIGNvbSBzaWduYWxzIChjb3BpYWRvIGRlIGh5ZHJhdGUudHMpXG5mdW5jdGlvbiBoeWRyYXRlU2lnbmFsQXR0cmlidXRlcyhcbiAgZWxlbWVudDogRWxlbWVudCxcbiAgc2lnbmFsczogTWFwPHN0cmluZywgU2lnbmFsPHVua25vd24+PlxuKTogdm9pZCB7XG4gIGNvbnN0IGF0dHJzID0gQXJyYXkuZnJvbShlbGVtZW50LmF0dHJpYnV0ZXMpO1xuXG4gIGZvciAoY29uc3QgYXR0ciBvZiBhdHRycykge1xuICAgIGlmICghYXR0ci5uYW1lLnN0YXJ0c1dpdGgoXCJkYXRhLXNpZ25hbC1cIikpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgcHJvcCA9IGF0dHIubmFtZS5yZXBsYWNlKFwiZGF0YS1zaWduYWwtXCIsIFwiXCIpO1xuICAgIGNvbnN0IHNpZ25hbElkID0gYXR0ci52YWx1ZTtcbiAgICBjb25zdCBzaWduYWwgPSBzaWduYWxzLmdldChzaWduYWxJZCk7XG5cbiAgICBpZiAoIXNpZ25hbCkgY29udGludWU7XG5cbiAgICAvLyBTdWJzY3JldmVyIGF0dWFsaXphw6fDtWVzXG4gICAgY29uc3QgdW5zdWIgPSBzaWduYWwuc3Vic2NyaWJlKCh2YWx1ZSkgPT4ge1xuICAgICAgaWYgKHByb3AgPT09IFwidmFsdWVcIikge1xuICAgICAgICAoZWxlbWVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9IFN0cmluZyh2YWx1ZSA/PyBcIlwiKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvcCA9PT0gXCJjaGVja2VkXCIpIHtcbiAgICAgICAgKGVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCA9IEJvb2xlYW4odmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChwcm9wID09PSBcImNsYXNzXCIpIHtcbiAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBwcm9jZXNzQ2xhc3NWYWx1ZSh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShwcm9wLCBTdHJpbmcodmFsdWUgPz8gXCJcIikpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgYWRkQ2xlYW51cChlbGVtZW50LCB1bnN1Yik7XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoYXR0ci5uYW1lKTtcbiAgfVxufVxuXG4vLyBIaWRyYXRhciBuw7NzIGNvbSBzaWduYWxzIGludGVycG9sYWRvcyAoY29waWFkbyBkZSBoeWRyYXRlLnRzKVxuZnVuY3Rpb24gaHlkcmF0ZVNpZ25hbE5vZGVzKFxuICBjb250YWluZXI6IE5vZGUsXG4gIHNpZ25hbHM6IE1hcDxzdHJpbmcsIFNpZ25hbDx1bmtub3duPj5cbik6IHZvaWQge1xuICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKGNvbnRhaW5lciwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQpO1xuXG4gIGNvbnN0IHNpZ25hbE5vZGVzOiBBcnJheTx7XG4gICAgc3RhcnQ6IENvbW1lbnQ7XG4gICAgZW5kOiBDb21tZW50O1xuICAgIGlkOiBzdHJpbmc7XG4gIH0+ID0gW107XG5cbiAgbGV0IG5vZGU6IENvbW1lbnQgfCBudWxsO1xuICB3aGlsZSAoKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSBhcyBDb21tZW50IHwgbnVsbCkpIHtcbiAgICBjb25zdCBtYXRjaCA9IG5vZGUudGV4dENvbnRlbnQ/Lm1hdGNoKC9ec2lnbmFsLXN0YXJ0OiguKykkLyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBjb25zdCBpZCA9IG1hdGNoWzFdO1xuICAgICAgbGV0IGN1cnJlbnQ6IE5vZGUgfCBudWxsID0gbm9kZS5uZXh0U2libGluZztcblxuICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGN1cnJlbnQubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFICYmXG4gICAgICAgICAgKGN1cnJlbnQgYXMgQ29tbWVudCkudGV4dENvbnRlbnQgPT09IGBzaWduYWwtZW5kOiR7aWR9YFxuICAgICAgICApIHtcbiAgICAgICAgICBzaWduYWxOb2Rlcy5wdXNoKHsgc3RhcnQ6IG5vZGUsIGVuZDogY3VycmVudCBhcyBDb21tZW50LCBpZCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBIaWRyYXRhciBjYWRhIHNpZ25hbFxuICBmb3IgKGNvbnN0IHsgc3RhcnQsIGVuZCwgaWQgfSBvZiBzaWduYWxOb2Rlcykge1xuICAgIGNvbnN0IHNpZ25hbCA9IHNpZ25hbHMuZ2V0KGlkKTtcbiAgICBpZiAoIXNpZ25hbCkgY29udGludWU7XG5cbiAgICBjb25zdCB1bnN1YiA9IHNpZ25hbC5zdWJzY3JpYmUoKHZhbHVlKSA9PiB7XG4gICAgICAvLyBMaW1wYXIgZW50cmUgbWFyY2Fkb3Jlc1xuICAgICAgbGV0IGN1cnJlbnQgPSBzdGFydC5uZXh0U2libGluZztcbiAgICAgIHdoaWxlIChjdXJyZW50ICYmIGN1cnJlbnQgIT09IGVuZCkge1xuICAgICAgICBjb25zdCBuZXh0ID0gY3VycmVudC5uZXh0U2libGluZztcbiAgICAgICAgY3VycmVudC5wYXJlbnROb2RlPy5yZW1vdmVDaGlsZChjdXJyZW50KTtcbiAgICAgICAgY3VycmVudCA9IG5leHQ7XG4gICAgICB9XG5cbiAgICAgIC8vIEluc2VyaXIgbm92byBjb250ZcO6ZG9cbiAgICAgIGNvbnN0IHBhcmVudCA9IHN0YXJ0LnBhcmVudE5vZGU7XG4gICAgICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgLy8gTmFkYVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBjb25zdCBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoaXRlbS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFN0cmluZyhpdGVtID8/IFwiXCIpKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZnJhZywgZW5kKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUuY2xvbmVOb2RlKHRydWUpLCBlbmQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJpbmcodmFsdWUpKSwgZW5kKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGFkZENsZWFudXAoc3RhcnQsIHVuc3ViKTtcbiAgfVxufVxuXG4vLyBDYW1pbmhhciBET00gZSBoaWRyYXRhciAoY29waWFkbyBkZSBoeWRyYXRlLnRzKVxuZnVuY3Rpb24gd2Fsa0FuZEh5ZHJhdGVTaWduYWxBdHRyaWJ1dGVzKFxuICBub2RlOiBOb2RlLFxuICBzaWduYWxzOiBNYXA8c3RyaW5nLCBTaWduYWw8dW5rbm93bj4+XG4pOiB2b2lkIHtcbiAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IG5vZGUgYXMgRWxlbWVudDtcblxuICAgIGh5ZHJhdGVTaWduYWxBdHRyaWJ1dGVzKGVsZW1lbnQsIHNpZ25hbHMpO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2RlcykpIHtcbiAgICAgIHdhbGtBbmRIeWRyYXRlU2lnbmFsQXR0cmlidXRlcyhjaGlsZCwgc2lnbmFscyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNraXBTaWduYWxNYXJrZXJzKCk6IHZvaWQge1xuICBpZiAoIWh5ZHJhdGVDb250ZXh0KSByZXR1cm47XG5cbiAgbGV0IGN1cnJlbnQgPSBoeWRyYXRlQ29udGV4dC5jdXJzb3I7XG4gIGxldCBkZXB0aCA9IDA7XG5cbiAgd2hpbGUgKGN1cnJlbnQpIHtcbiAgICBpZiAoY3VycmVudC5ub2RlVHlwZSA9PT0gTm9kZS5DT01NRU5UX05PREUpIHtcbiAgICAgIGNvbnN0IHRleHQgPSAoY3VycmVudCBhcyBDb21tZW50KS50ZXh0Q29udGVudDtcbiAgICAgIGlmICh0ZXh0Py5zdGFydHNXaXRoKFwic2lnbmFsLXN0YXJ0OlwiKSkge1xuICAgICAgICBkZXB0aCsrO1xuICAgICAgfSBlbHNlIGlmICh0ZXh0Py5zdGFydHNXaXRoKFwic2lnbmFsLWVuZDpcIikpIHtcbiAgICAgICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgaHlkcmF0ZUNvbnRleHQuY3Vyc29yID0gY3VycmVudC5uZXh0U2libGluZztcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGgtLTtcbiAgICAgIH1cbiAgICB9XG4gICAgY3VycmVudCA9IGN1cnJlbnQubmV4dFNpYmxpbmc7XG4gIH1cbn1cblxuZnVuY3Rpb24gaHlkcmF0ZUNoaWxkKGNoaWxkOiBDaGlsZCk6IHZvaWQge1xuICBpZiAoIWh5ZHJhdGVDb250ZXh0KSByZXR1cm47XG5cbiAgaWYgKGNoaWxkID09IG51bGwgfHwgY2hpbGQgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XG4gICAgZm9yIChjb25zdCBjIG9mIGNoaWxkKSBoeWRyYXRlQ2hpbGQoYyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGlzU2lnbmFsTGlrZShjaGlsZCkpIHtcbiAgICAvLyBTaWduYWxzIGludGVycG9sYWRvczogcHVsYXIgKG1hcmNhZG9yZXMgasOhIGV4aXN0ZW0pXG4gICAgLy8gU2Vyw6NvIHJlY29uZWN0YWRvcyBwb3IgaHlkcmF0ZVNpZ25hbE5vZGVzKClcbiAgICBza2lwU2lnbmFsTWFya2VycygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChjaGlsZCBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAvLyBKw6EgZm9pIHByb2Nlc3NhZG8gcG9yIGgoKVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFRleHRvOiBhdmFuw6dhciBjdXJzb3JcbiAgaWYgKGh5ZHJhdGVDb250ZXh0LmN1cnNvcj8ubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgaHlkcmF0ZUNvbnRleHQuY3Vyc29yID0gaHlkcmF0ZUNvbnRleHQuY3Vyc29yLm5leHRTaWJsaW5nO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhIeWRyYXRlKHRhZzogdW5rbm93biwgcHJvcHM6IFByb3BzLCAuLi5jaGlsZHJlbjogQ2hpbGRbXSk6IE5vZGUge1xuICBpZiAoIWh5ZHJhdGVDb250ZXh0KSB0aHJvdyBuZXcgRXJyb3IoXCJbc2xhc2hdIGhIeWRyYXRlIGNhbGxlZCB3aXRob3V0IGNvbnRleHRcIik7XG5cbiAgLy8gQ29tcG9uZW50ZXM6IGV4ZWN1dGFyIGUgY29udGludWFyIGhpZHJhdGHDp8Ojb1xuICBpZiAodHlwZW9mIHRhZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY29uc3Qgb3V0ID0gKHRhZyBhcyAocDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IE5vZGUgfCBDaGlsZCkoe1xuICAgICAgLi4uKHByb3BzIHx8IHt9KSxcbiAgICAgIGNoaWxkcmVuLFxuICAgIH0pO1xuICAgIHJldHVybiBvdXQgaW5zdGFuY2VvZiBOb2RlID8gb3V0IDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKG91dCkpO1xuICB9XG5cbiAgLy8gQnVzY2FyIGVsZW1lbnRvIGV4aXN0ZW50ZSBubyBjdXJzb3JcbiAgY29uc3QgZXhpc3RpbmdOb2RlID0gaHlkcmF0ZUNvbnRleHQuY3Vyc29yO1xuXG4gIGlmICghZXhpc3RpbmdOb2RlIHx8IGV4aXN0aW5nTm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbc2xhc2hdIEh5ZHJhdGUgbWlzbWF0Y2g6IGV4cGVjdGVkIGVsZW1lbnQsIGNyZWF0aW5nIG5ld1wiKTtcbiAgICAvLyBGYWxsYmFjazogY3JpYXIgbm92byBlbGVtZW50b1xuICAgIGNvbnN0IHNhdmVkQ3R4ID0gaHlkcmF0ZUNvbnRleHQ7XG4gICAgaHlkcmF0ZUNvbnRleHQgPSBudWxsO1xuICAgIGNvbnN0IGVsID0gaCh0YWcsIHByb3BzLCAuLi5jaGlsZHJlbik7XG4gICAgaHlkcmF0ZUNvbnRleHQgPSBzYXZlZEN0eDtcbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBjb25zdCBlbCA9IGV4aXN0aW5nTm9kZSBhcyBFbGVtZW50O1xuXG4gIC8vIEFuZXhhciBBUEVOQVMgZXZlbnQgbGlzdGVuZXJzIChvdXRyb3MgcHJvcHMgasOhIGVzdMOjbyBubyBIVE1MKVxuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhwcm9wcykpIHtcbiAgICAgIC8vIEV2ZW50IGhhbmRsZXJzOiBhbmV4YXIgYW8gZWxlbWVudG8gZXhpc3RlbnRlXG4gICAgICBpZiAoay5zdGFydHNXaXRoKFwib25cIikgJiYga1syXSA9PT0ga1syXT8udG9VcHBlckNhc2UoKSkge1xuICAgICAgICBzZXRQcm9wKGVsIGFzIEVsZW1lbnRpc2gsIGssIHYpO1xuICAgICAgfVxuICAgICAgLy8gU2lnbmFscyBlbSBhdHJpYnV0b3M6IHNlcsOjbyByZWNvbmVjdGFkb3MgZGVwb2lzXG4gICAgICAvLyBPdXRyb3MgYXRyaWJ1dG9zOiBqw6EgZXN0w6NvIG5vIEhUTUwsIHB1bGFyXG4gICAgfVxuICB9XG5cbiAgLy8gSGlkcmF0YXIgY2hpbGRyZW4gcmVjdXJzaXZhbWVudGVcbiAgY29uc3Qgb2xkQ3Vyc29yID0gaHlkcmF0ZUNvbnRleHQuY3Vyc29yO1xuICBoeWRyYXRlQ29udGV4dC5jdXJzb3IgPSBlbC5maXJzdENoaWxkO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICBoeWRyYXRlQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgLy8gQXZhbsOnYXIgY3Vyc29yIHBhcmEgcHLDs3hpbW8gc2libGluZ1xuICBoeWRyYXRlQ29udGV4dC5jdXJzb3IgPSBvbGRDdXJzb3I/Lm5leHRTaWJsaW5nIHx8IG51bGw7XG5cbiAgcmV0dXJuIGVsO1xufVxuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBoKCkgKyBodG1sIChIVE0pXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5jb25zdCBTVkdfTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG5jb25zdCBTVkdfVEFHUyA9IG5ldyBTZXQ8c3RyaW5nPihbXG4gIFwic3ZnXCIsXG4gIFwicGF0aFwiLFxuICBcImdcIixcbiAgXCJjaXJjbGVcIixcbiAgXCJyZWN0XCIsXG4gIFwibGluZVwiLFxuICBcInBvbHlsaW5lXCIsXG4gIFwicG9seWdvblwiLFxuICBcImVsbGlwc2VcIixcbiAgXCJkZWZzXCIsXG4gIFwidXNlXCIsXG4gIFwiY2xpcFBhdGhcIixcbiAgXCJtYXNrXCIsXG4gIFwicGF0dGVyblwiLFxuICBcInRleHRcIixcbl0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaCh0YWc6IHVua25vd24sIHByb3BzOiBQcm9wcywgLi4uY2hpbGRyZW46IENoaWxkW10pOiBOb2RlIHtcbiAgLy8gTU9ETyBIWURSQVRFOiBSZXV0aWxpemFyIERPTSBleGlzdGVudGVcbiAgaWYgKGh5ZHJhdGVDb250ZXh0KSB7XG4gICAgcmV0dXJuIGhIeWRyYXRlKHRhZywgcHJvcHMsIC4uLmNoaWxkcmVuKTtcbiAgfVxuXG4gIC8vIE1PRE8gTk9STUFMOiBDcmlhciBlbGVtZW50b3Mgbm92b3NcbiAgLy8gQ29tcG9uZW50ZSAoZnVuw6fDo28pIOKAlCBwb2RlIHJldG9ybmFyIHF1YWxxdWVyIENoaWxkOyBlbXBhY290YXIgc2UgbsOjbyBmb3IgTm9kZVxuICBpZiAodHlwZW9mIHRhZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY29uc3Qgb3V0ID0gKHRhZyBhcyAocDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IE5vZGUgfCBDaGlsZCkoe1xuICAgICAgLi4uKHByb3BzIHx8IHt9KSxcbiAgICAgIGNoaWxkcmVuLFxuICAgIH0pO1xuICAgIGlmIChvdXQgaW5zdGFuY2VvZiBOb2RlKSByZXR1cm4gb3V0O1xuICAgIGNvbnN0IGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgYXBwZW5kQ2hpbGRTbWFydChmcmFnLCBvdXQgYXMgQ2hpbGQpO1xuICAgIHJldHVybiBmcmFnO1xuICB9XG5cbiAgLy8gVGFnIG5hdGl2YVxuICBjb25zdCB0YWdOYW1lID0gU3RyaW5nKHRhZyB8fCBcImRpdlwiKTtcbiAgY29uc3QgZWwgPSAoU1ZHX1RBR1MuaGFzKHRhZ05hbWUpXG4gICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCB0YWdOYW1lKVxuICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKSkgYXMgRWxlbWVudGlzaDtcblxuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhwcm9wcykpIHNldFByb3AoZWwsIGssIHYpO1xuICB9XG4gIGZvciAoY29uc3QgY2ggb2YgY2hpbGRyZW4pIGFwcGVuZENoaWxkU21hcnQoZWwsIGNoKTtcbiAgcmV0dXJuIGVsO1xufVxuXG5leHBvcnQgY29uc3QgaHRtbDogSFRNVGVtcGxhdGUgPSAoaHRtIGFzIHVua25vd24gYXMgSFRNTW9kdWxlKS5iaW5kKGgpO1xuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiByZW5kZXI6IGFjZWl0YSBxdWFscXVlciBDaGlsZCBvdSBmdW7Dp8OjbyBxdWUgcmV0b3JuZSBDaGlsZFxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxudHlwZSBSb290VmlldyA9IENoaWxkIHwgKCgpID0+IENoaWxkKTtcbnR5cGUgUmVuZGVyQ29udGFpbmVyID0gRWxlbWVudCB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG5jb25zdCBpc0RldiA9XG4gIHR5cGVvZiBwcm9jZXNzICE9PSBcInVuZGVmaW5lZFwiICYmIHByb2Nlc3M/LmVudj8uTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiO1xuXG5mdW5jdGlvbiBjYWxsZXJJbmZvKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaz8uc3BsaXQoXCJcXG5cIikuc2xpY2UoMyk7XG4gICAgaWYgKCFzdGFjaz8ubGVuZ3RoKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGNvbnN0IGZyYW1lID0gc3RhY2suZmluZCgobGluZSkgPT4gL1xcLih0c3x0c3h8anMpLy50ZXN0KGxpbmUpKTtcbiAgICBpZiAoIWZyYW1lKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGNvbnN0IG1hdGNoID0gZnJhbWUubWF0Y2goL2F0XFxzKyg/Oi4qXFwoKT8oW14oKTpdKyk6KFxcZCspOlxcZCtcXCk/Lyk7XG4gICAgaWYgKCFtYXRjaCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gYCR7bWF0Y2hbMV19OiR7bWF0Y2hbMl19YDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlQ29udGFpbmVyKHRhcmdldDogUmVuZGVyQ29udGFpbmVyKTogRWxlbWVudCB7XG4gIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7XG4gICAgaWYgKCFlbCkge1xuICAgICAgY29uc3QgaGludCA9IGlzRGV2ID8gY2FsbGVySW5mbygpIDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZXh0cmEgPSBoaW50ID8gYCAoY2FsbGVkIGZyb20gJHtoaW50fSlgIDogXCJcIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgW3NsYXNoXSByZW5kZXIoKTogc2VsZWN0b3IgXFxcIiR7dGFyZ2V0fVxcXCIgbm90IGZvdW5kIOKAlCBlbnN1cmUgdGhlIGVsZW1lbnQgZXhpc3RzIGJlZm9yZSBjYWxsaW5nIHJlbmRlcigpJHtleHRyYX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xuICB9XG4gIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBFbGVtZW50KSByZXR1cm4gdGFyZ2V0O1xuICBjb25zdCBoaW50ID0gaXNEZXYgPyBjYWxsZXJJbmZvKCkgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGV4dHJhID0gaGludCA/IGAgKGNhbGxlZCBmcm9tICR7aGludH0pYCA6IFwiXCI7XG4gIHRocm93IG5ldyBFcnJvcihgW3NsYXNoXSByZW5kZXIoKTogY29udGFpbmVyIEVsZW1lbnQgaXMgcmVxdWlyZWQgKHJlY2VpdmVkIG51bGwvdW5kZWZpbmVkKSR7ZXh0cmF9YCk7XG59XG5cbi8vIEZ1bsOnw6NvIGludGVybmEgZGUgaHlkcmF0ZVxuZnVuY3Rpb24gaHlkcmF0ZUludGVybmFsKFxuICB2aWV3OiBSb290VmlldyxcbiAgY29udGFpbmVyOiBFbGVtZW50LFxuICBzdGF0ZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbik6IE5vZGUgfCBOb2RlW10ge1xuICAvLyAxLiBSZXN0YXVyYXIgc2lnbmFsc1xuICBjb25zdCBzaWduYWxzID0gbmV3IE1hcDxzdHJpbmcsIFNpZ25hbDx1bmtub3duPj4oKTtcbiAgZm9yIChjb25zdCBbaWQsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzdGF0ZSkpIHtcbiAgICBzaWduYWxzLnNldChpZCwgY3JlYXRlU2lnbmFsKHZhbHVlKSk7XG4gIH1cblxuICAvLyAyLiBBdGl2YXIgbW9kbyBoeWRyYXRlXG4gIGNvbnN0IGN0eDogSHlkcmF0ZUNvbnRleHQgPSB7XG4gICAgY3Vyc29yOiBjb250YWluZXIuZmlyc3RDaGlsZCxcbiAgICByb290OiBjb250YWluZXIsXG4gICAgc2lnbmFscyxcbiAgfTtcblxuICBzZXRIeWRyYXRlQ29udGV4dChjdHgpO1xuXG4gIHRyeSB7XG4gICAgLy8gMy4gUmUtZXhlY3V0YXIgdmlldyBwYXJhIGFuZXhhciBldmVudG9zXG4gICAgdHlwZW9mIHZpZXcgPT09IFwiZnVuY3Rpb25cIiA/IHZpZXcoKSA6IHZpZXc7XG5cbiAgICAvLyA0LiBSZWNvbmVjdGFyIHNpZ25hbHMgYW9zIG1hcmNhZG9yZXNcbiAgICBoeWRyYXRlU2lnbmFsTm9kZXMoY29udGFpbmVyLCBzaWduYWxzKTtcbiAgICB3YWxrQW5kSHlkcmF0ZVNpZ25hbEF0dHJpYnV0ZXMoY29udGFpbmVyLCBzaWduYWxzKTtcbiAgfSBmaW5hbGx5IHtcbiAgICAvLyA1LiBEZXNhdGl2YXIgbW9kbyBoeWRyYXRlXG4gICAgc2V0SHlkcmF0ZUNvbnRleHQobnVsbCk7XG4gIH1cblxuICBjb25zdCBub2RlcyA9IEFycmF5LmZyb20oY29udGFpbmVyLmNoaWxkTm9kZXMpIGFzIE5vZGVbXTtcbiAgcmV0dXJuIG5vZGVzLmxlbmd0aCA9PT0gMSA/IG5vZGVzWzBdISA6IG5vZGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyKHZpZXc6IFJvb3RWaWV3LCBjb250YWluZXI6IFJlbmRlckNvbnRhaW5lcik6IE5vZGUgfCBOb2RlW10ge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVDb250YWluZXIoY29udGFpbmVyKTtcblxuICAvLyBERVRFQ8OHw4NPIEFVVE9Nw4FUSUNBIERFIE1PRE9cblxuICAvLyBNb2RvIEh5ZHJhdGU6IGNvbnRhaW5lciB0ZW0gY29udGXDumRvICsgc2NyaXB0IGRlIGVzdGFkb1xuICBjb25zdCBzdGF0ZVNjcmlwdCA9IHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfX1NMQVNIX1NUQVRFX19cIilcbiAgICA6IG51bGw7XG5cbiAgaWYgKHJlc29sdmVkLmNoaWxkTm9kZXMubGVuZ3RoID4gMCAmJiBzdGF0ZVNjcmlwdCkge1xuICAgIC8vIE1PRE8gSFlEUkFURVxuICAgIGNvbnN0IHN0YXRlID0gSlNPTi5wYXJzZShzdGF0ZVNjcmlwdC50ZXh0Q29udGVudCB8fCBcInt9XCIpO1xuICAgIHN0YXRlU2NyaXB0LnJlbW92ZSgpO1xuICAgIHJldHVybiBoeWRyYXRlSW50ZXJuYWwodmlldywgcmVzb2x2ZWQsIHN0YXRlKTtcbiAgfVxuXG4gIC8vIE1vZG8gTm9ybWFsOiBsaW1wYXIgZSByZW5kZXJpemFyXG4gIGNvbnN0IHByZXZOb2RlcyA9IEFycmF5LmZyb20ocmVzb2x2ZWQuY2hpbGROb2RlcykgYXMgTm9kZVtdO1xuICBmb3IgKGNvbnN0IG5vZGUgb2YgcHJldk5vZGVzKSBkZXN0cm95Tm9kZShub2RlKTtcbiAgcmVzb2x2ZWQudGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gIC8vIHJlc29sdmUgdmlld1xuICBjb25zdCBvdXQgPSB0eXBlb2YgdmlldyA9PT0gXCJmdW5jdGlvblwiID8gKHZpZXcgYXMgKCkgPT4gQ2hpbGQpKCkgOiB2aWV3O1xuICBjb25zdCBwYXJ0cyA9IEFycmF5LmlzQXJyYXkob3V0KSA/IG91dCA6IFtvdXRdO1xuXG4gIGZvciAoY29uc3QgcCBvZiBwYXJ0cykgYXBwZW5kQ2hpbGRTbWFydChyZXNvbHZlZCwgcCk7XG5cbiAgY29uc3QgaW5zZXJ0ZWQgPSBBcnJheS5mcm9tKHJlc29sdmVkLmNoaWxkTm9kZXMpIGFzIE5vZGVbXTtcbiAgcmV0dXJuIGluc2VydGVkLmxlbmd0aCA9PT0gMSA/IGluc2VydGVkWzBdISA6IGluc2VydGVkO1xufVxuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBSZXBlYXQ6IGtleWVkIGRpZmYgY29tIGJsb2NvcyBtb3bDrXZlaXMgKHN1cG9ydGEgbcO6bHRpcGxvcyBuw7NzIHBvciBpdGVtKVxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxudHlwZSBSZW5kZXJJdGVtPFQ+ID0gKGl0ZW06IFQpID0+IENoaWxkO1xuXG5mdW5jdGlvbiByZW1vdmVCbG9ja1JhbmdlKHN0YXJ0OiBOb2RlLCBlbmQ6IE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50ID0gc3RhcnQucGFyZW50Tm9kZTtcbiAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgbGV0IG46IE5vZGUgfCBudWxsID0gc3RhcnQ7XG4gIHdoaWxlIChuKSB7XG4gICAgY29uc3Qgbnh0OiBOb2RlIHwgbnVsbCA9IG4ubmV4dFNpYmxpbmc7XG4gICAgZGVzdHJveU5vZGUobik7XG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKG4pO1xuICAgIGlmIChuID09PSBlbmQpIGJyZWFrO1xuICAgIG4gPSBueHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbW92ZUJsb2NrQmVmb3JlKHN0YXJ0OiBOb2RlLCBlbmQ6IE5vZGUsIHJlZjogTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcGFyZW50ID0gc3RhcnQucGFyZW50Tm9kZTtcbiAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgY29uc3QgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgbGV0IG46IE5vZGUgfCBudWxsID0gc3RhcnQ7XG4gIHdoaWxlIChuKSB7XG4gICAgY29uc3Qgbnh0OiBOb2RlIHwgbnVsbCA9IG4ubmV4dFNpYmxpbmc7XG4gICAgZnJhZy5hcHBlbmRDaGlsZChuKTtcbiAgICBpZiAobiA9PT0gZW5kKSBicmVhaztcbiAgICBuID0gbnh0O1xuICB9XG4gIHBhcmVudC5pbnNlcnRCZWZvcmUoZnJhZywgcmVmKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmxvY2tCZWZvcmU8VD4oXG4gIHBhcmVudDogTm9kZSxcbiAgcmVmOiBOb2RlIHwgbnVsbCxcbiAgcmVuZGVySXRlbTogUmVuZGVySXRlbTxUPixcbiAgaXRlbTogVFxuKTogeyBzdGFydDogQ29tbWVudDsgZW5kOiBDb21tZW50IH0ge1xuICBjb25zdCBzdGFydCA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCJyZXBlYXQ6c3RhcnRcIik7XG4gIGNvbnN0IGVuZCA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoXCJyZXBlYXQ6ZW5kXCIpO1xuICBjb25zdCBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gIGZyYWcuYXBwZW5kQ2hpbGQoc3RhcnQpO1xuICBjb25zdCBvdXQgPSByZW5kZXJJdGVtKGl0ZW0pO1xuICBhcHBlbmRDaGlsZFNtYXJ0KGZyYWcsIG91dCk7XG4gIGZyYWcuYXBwZW5kQ2hpbGQoZW5kKTtcblxuICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGZyYWcsIHJlZik7XG4gIHJldHVybiB7IHN0YXJ0LCBlbmQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFJlcGVhdDxUPihcbiAgbGlzdFNpZzogUmVhZG9ubHlTaWduYWw8VFtdPiB8IFNpZ25hbDxUW10+LFxuICBrZXlPZjogKGl0ZW06IFQpID0+IEtleSxcbiAgcmVuZGVySXRlbTogUmVuZGVySXRlbTxUPlxuKTogTm9kZSB7XG4gIGNvbnN0IGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICBjb25zdCBieUtleSA9IG5ldyBNYXA8S2V5LCB7IHN0YXJ0OiBDb21tZW50OyBlbmQ6IENvbW1lbnQgfT4oKTtcblxuICBmdW5jdGlvbiBtb3VudEluaXRpYWwoaXRlbXM6IFRbXSk6IHZvaWQge1xuICAgIGNvbnN0IHBhcmVudCA9IGFuY2hvci5wYXJlbnROb2RlITtcbiAgICBsZXQgcmVmOiBOb2RlIHwgbnVsbCA9IGFuY2hvci5uZXh0U2libGluZztcbiAgICBmb3IgKGNvbnN0IGl0IG9mIGl0ZW1zKSB7XG4gICAgICBjb25zdCBrID0ga2V5T2YoaXQpO1xuICAgICAgY29uc3QgYmxrID0gY3JlYXRlQmxvY2tCZWZvcmUocGFyZW50LCByZWYsIHJlbmRlckl0ZW0sIGl0KTtcbiAgICAgIGJ5S2V5LnNldChrLCBibGspO1xuICAgICAgcmVmID0gYmxrLmVuZC5uZXh0U2libGluZztcbiAgICB9XG4gIH1cblxuXG5cbiAgZnVuY3Rpb24gcGF0Y2gobmV4dEl0ZW1zOiBUW10pOiB2b2lkIHtcbiAgICBjb25zdCBwYXJlbnQgPSBhbmNob3IucGFyZW50Tm9kZSE7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8S2V5PigpO1xuICAgIGxldCBjdXJzb3I6IE5vZGUgPSBhbmNob3I7XG5cbiAgICBmb3IgKGNvbnN0IGl0IG9mIG5leHRJdGVtcykge1xuICAgICAgY29uc3QgayA9IGtleU9mKGl0KTtcbiAgICAgIHNlZW4uYWRkKGspO1xuICAgICAgY29uc3QgZXhpc3QgPSBieUtleS5nZXQoayk7XG5cbiAgICAgIGlmICghZXhpc3QpIHtcbiAgICAgICAgY29uc3QgYmxrID0gY3JlYXRlQmxvY2tCZWZvcmUocGFyZW50LCBjdXJzb3IubmV4dFNpYmxpbmcsIHJlbmRlckl0ZW0sIGl0KTtcbiAgICAgICAgYnlLZXkuc2V0KGssIGJsayk7XG4gICAgICAgIGN1cnNvciA9IGJsay5lbmQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzaG91bGRCZVJlZjogTm9kZSB8IG51bGwgPSBjdXJzb3IubmV4dFNpYmxpbmc7XG4gICAgICAgIGlmIChleGlzdC5zdGFydCAhPT0gc2hvdWxkQmVSZWYpIHtcbiAgICAgICAgICBtb3ZlQmxvY2tCZWZvcmUoZXhpc3Quc3RhcnQsIGV4aXN0LmVuZCwgc2hvdWxkQmVSZWYpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnNvciA9IGV4aXN0LmVuZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtrLCBibGtdIG9mIGJ5S2V5KSB7XG4gICAgICBpZiAoIXNlZW4uaGFzKGspKSB7XG4gICAgICAgIHJlbW92ZUJsb2NrUmFuZ2UoYmxrLnN0YXJ0LCBibGsuZW5kKTtcbiAgICAgICAgYnlLZXkuZGVsZXRlKGspO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIG1vbnRhIHF1YW5kbyBhIMOibmNvcmEgZXN0aXZlciBubyBET01cbiAgcXVldWVNaWNyb3Rhc2soKCkgPT4gbW91bnRJbml0aWFsKChsaXN0U2lnIGFzIFJlYWRvbmx5U2lnbmFsPFRbXT4pLmdldCgpKSk7XG5cbiAgY29uc3QgdW5zdWIgPSAobGlzdFNpZyBhcyBSZWFkb25seVNpZ25hbDxUW10+KS5zdWJzY3JpYmUoKGFycikgPT4gcGF0Y2goYXJyKSk7XG4gIGFkZENsZWFudXAoYW5jaG9yLCB1bnN1Yik7XG5cbiAgcmV0dXJuIGFuY2hvcjtcbn1cblxuc2V0TGlzdFJlbmRlcmVySW1wbCg8VD4oXG4gIGxpc3RTaWc6IFJlYWRvbmx5U2lnbmFsPFRbXT4sXG4gIGtleU9mOiAoaXRlbTogVCkgPT4gS2V5LFxuICByZW5kZXJJdGVtOiAoaXRlbTogVCkgPT4gQ2hpbGRcbik6IE5vZGUgPT4gUmVwZWF0KGxpc3RTaWcsIGtleU9mLCByZW5kZXJJdGVtKSk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsSUFBSSxJQUFFLFFBQVEsQ0FBQyxHQUFFLEdBQUUsR0FBRSxHQUFFO0FBQUEsRUFBQyxJQUFJO0FBQUEsRUFBRSxFQUFFLEtBQUc7QUFBQSxFQUFFLFNBQVEsSUFBRSxFQUFFLElBQUUsRUFBRSxRQUFPLEtBQUk7QUFBQSxJQUFDLElBQUksSUFBRSxFQUFFLE1BQUssSUFBRSxFQUFFLE1BQUksRUFBRSxNQUFJLElBQUUsSUFBRSxHQUFFLEVBQUUsRUFBRSxTQUFPLEVBQUUsRUFBRTtBQUFBLElBQU8sTUFBSixJQUFNLEVBQUUsS0FBRyxJQUFNLE1BQUosSUFBTSxFQUFFLEtBQUcsT0FBTyxPQUFPLEVBQUUsTUFBSSxDQUFDLEdBQUUsQ0FBQyxJQUFNLE1BQUosS0FBTyxFQUFFLEtBQUcsRUFBRSxNQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBSSxJQUFNLE1BQUosSUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLE9BQUssSUFBRSxLQUFHLEtBQUcsSUFBRSxFQUFFLE1BQU0sR0FBRSxFQUFFLEdBQUUsR0FBRSxHQUFFLENBQUMsSUFBRyxJQUFJLENBQUMsQ0FBQyxHQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUUsRUFBRSxLQUFHLEVBQUUsTUFBSSxLQUFHLEVBQUUsSUFBRSxLQUFHLEdBQUUsRUFBRSxLQUFHLE1BQUksRUFBRSxLQUFLLENBQUM7QUFBQSxFQUFDO0FBQUEsRUFBQyxPQUFPO0FBQUE7QUFBN1QsSUFBZ1UsSUFBRSxJQUFJO0FBQUksU0FBTyxrQkFBZ0IsQ0FBQyxHQUFFO0FBQUEsRUFBQyxJQUFJLElBQUUsRUFBRSxJQUFJLElBQUk7QUFBQSxFQUFFLE9BQU8sTUFBSSxJQUFFLElBQUksS0FBSSxFQUFFLElBQUksTUFBSyxDQUFDLEtBQUksSUFBRSxFQUFFLE1BQUssRUFBRSxJQUFJLENBQUMsTUFBSSxFQUFFLElBQUksR0FBRSxJQUFFLFFBQVEsQ0FBQyxJQUFFO0FBQUEsSUFBQyxTQUFRLElBQUUsSUFBRSxLQUFFLEdBQUUsSUFBRSxJQUFHLElBQUUsSUFBRyxJQUFFLENBQUMsQ0FBQyxHQUFFLElBQUUsUUFBUSxDQUFDLElBQUU7QUFBQSxNQUFLLE9BQUosTUFBUSxPQUFJLElBQUUsRUFBRSxRQUFRLHdCQUF1QixFQUFFLE1BQUksRUFBRSxLQUFLLEdBQUUsSUFBRSxDQUFDLElBQU0sT0FBSixNQUFRLE1BQUcsTUFBSSxFQUFFLEtBQUssR0FBRSxJQUFFLENBQUMsR0FBRSxLQUFFLEtBQU8sT0FBSixLQUFlLE1BQVIsU0FBVyxLQUFFLEVBQUUsS0FBSyxHQUFFLElBQUUsQ0FBQyxJQUFNLE9BQUosS0FBTyxLQUFHLENBQUMsS0FBRSxFQUFFLEtBQUssR0FBRSxHQUFFLE1BQUcsQ0FBQyxJQUFFLE1BQUcsT0FBSyxLQUFHLENBQUMsTUFBTyxPQUFKLE9BQVMsRUFBRSxLQUFLLElBQUUsR0FBRSxHQUFFLEVBQUMsR0FBRSxLQUFFLElBQUcsT0FBSSxFQUFFLEtBQUssSUFBRSxJQUFFLEdBQUUsRUFBQyxHQUFFLEtBQUUsS0FBSSxJQUFFO0FBQUEsT0FBSSxJQUFFLEVBQUUsSUFBRSxHQUFFLFFBQU8sS0FBSTtBQUFBLE1BQUMsTUFBUSxPQUFKLEtBQU8sRUFBRSxHQUFFLEVBQUUsQ0FBQztBQUFBLE1BQUcsU0FBUSxJQUFFLEVBQUUsSUFBRSxHQUFFLEdBQUcsUUFBTztBQUFBLFFBQUksS0FBRSxHQUFFLEdBQUcsSUFBTyxPQUFKLElBQVksT0FBTixPQUFTLEVBQUUsR0FBRSxJQUFFLENBQUMsQ0FBQyxHQUFFLEtBQUUsS0FBRyxLQUFHLEtBQU0sT0FBSixJQUFhLE1BQVAsUUFBZ0IsT0FBTixPQUFTLEtBQUUsR0FBRSxJQUFFLE1BQUksSUFBRSxLQUFFLEVBQUUsS0FBRyxJQUFFLE9BQUksSUFBRSxJQUFFLEtBQUcsS0FBRyxLQUFRLE9BQU4sT0FBZSxPQUFOLE1BQVEsSUFBRSxLQUFRLE9BQU4sT0FBUyxFQUFFLEdBQUUsS0FBRSxLQUFHLE9BQVUsT0FBTixPQUFTLEtBQUUsR0FBRSxLQUFFLEdBQUUsSUFBRSxNQUFVLE9BQU4sUUFBVSxLQUFFLEtBQVMsR0FBRSxHQUFHLElBQUUsT0FBYixRQUFrQixFQUFFLEdBQU0sT0FBSixNQUFRLElBQUUsRUFBRSxLQUFJLEtBQUUsSUFBRyxJQUFFLEVBQUUsSUFBSSxLQUFLLEdBQUUsR0FBRSxFQUFDLEdBQUUsS0FBRSxLQUFTLE9BQU4sT0FBZ0IsT0FBUCxRQUFpQixPQUFQO0FBQUEsS0FBaUIsT0FBUCxRQUFVLEVBQUUsR0FBRSxLQUFFLEtBQUcsS0FBRyxLQUFPLE9BQUosS0FBZSxNQUFSLFVBQVksS0FBRSxHQUFFLElBQUUsRUFBRTtBQUFBLElBQUc7QUFBQSxJQUFDLE9BQU8sRUFBRSxHQUFFO0FBQUEsSUFBRyxDQUFDLENBQUMsR0FBRSxJQUFHLFdBQVUsQ0FBQyxDQUFDLEdBQUcsU0FBTyxJQUFFLElBQUUsRUFBRTtBQUFBOzs7QUNvQm5yQyxJQUFJLFVBQThCO0FBT2xDLFNBQVMsS0FBSyxDQUFDLEtBQWdCO0FBQUEsRUFDN0IsTUFBTSxJQUFJO0FBQUEsRUFDVixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sSUFBSSxHQUFHO0FBQUEsSUFBRztBQUFBLEVBQ3pDLE1BQU0sUUFBUyxJQUF3QixVQUFVLE1BQU07QUFBQSxJQUFFLElBQUksRUFBRTtBQUFBLE1BQVEsRUFBRSxTQUFTO0FBQUEsR0FBSTtBQUFBLEVBQ3RGLEVBQUUsTUFBTSxJQUFJLEtBQUssS0FBSztBQUFBO0FBSXhCLElBQUksZ0JBQXFDO0FBQ2xDLFNBQVMsbUJBQW1CLENBQUMsSUFBd0I7QUFBQSxFQUMxRCxnQkFBZ0I7QUFBQTtBQVdYLFNBQVMsWUFBZSxDQUFDLFNBQThDO0FBQUEsRUFDNUUsSUFBSSxRQUFRO0FBQUEsRUFDWixNQUFNLE9BQU8sSUFBSTtBQUFBLEVBRWpCLE1BQU0sT0FBa0I7QUFBQSxJQUN0QixLQUFLLE1BQU07QUFBQSxNQUFFLE1BQU0sSUFBNEI7QUFBQSxNQUFHLE9BQU87QUFBQTtBQUFBLElBQ3pELEtBQUssQ0FBQyxNQUFNO0FBQUEsTUFDVixNQUFNLE9BQU8sT0FBTyxNQUFNLGFBQWMsRUFBa0IsS0FBSyxJQUFJO0FBQUEsTUFDbkUsSUFBSSxPQUFPLEdBQUcsTUFBTSxLQUFLO0FBQUEsUUFBRztBQUFBLE1BQzVCLFFBQVE7QUFBQSxNQUNSLEtBQUssUUFBUSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFBQTtBQUFBLElBRWhDLFdBQVcsQ0FBQyxPQUFPO0FBQUEsTUFBRSxLQUFLLElBQUksRUFBRTtBQUFBLE1BQUcsT0FBTyxNQUFNLEtBQUssT0FBTyxFQUFFO0FBQUE7QUFBQSxFQUNoRTtBQUFBLEVBRUEsSUFBSSxNQUFNLFFBQVEsT0FBTyxHQUFHO0FBQUEsSUFFMUIsTUFBTSxVQUFVLElBQUk7QUFBQSxJQUNwQixNQUFNLFdBQVcsSUFBSTtBQUFBLElBQ3JCLE1BQU0sUUFBUSxDQUFDLFNBQXVCO0FBQUEsTUFDcEMsSUFBSSxTQUFTLFFBQVEsT0FBTyxTQUFTLFVBQVU7QUFBQSxRQUM3QyxNQUFNLE1BQU07QUFBQSxRQUNaLElBQUksUUFBUTtBQUFBLFVBQUssT0FBTyxJQUFJO0FBQUEsUUFDNUIsSUFBSSxTQUFTO0FBQUEsVUFBSyxPQUFPLElBQUk7QUFBQSxRQUM3QixNQUFNLElBQUk7QUFBQSxRQUNWLE1BQU0sS0FBSyxRQUFRLElBQUksQ0FBQztBQUFBLFFBQ3hCLElBQUksT0FBTztBQUFBLFVBQVcsT0FBTztBQUFBLFFBQzdCLE1BQU0sTUFBTSxPQUFPLE1BQU07QUFBQSxRQUN6QixRQUFRLElBQUksR0FBRyxHQUFHO0FBQUEsUUFDbEIsT0FBTztBQUFBLE1BQ1Q7QUFBQSxNQUNBLE1BQU0sSUFBSSxHQUFHLE9BQU8sUUFBUSxPQUFPLElBQUk7QUFBQSxNQUN2QyxJQUFJLE1BQXVDO0FBQUEsUUFDekMsTUFBTSxNQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssS0FBSztBQUFBLFFBQ25DLFNBQVMsSUFBSSxHQUFHLEVBQUM7QUFBQSxRQUNqQixJQUFJLEtBQUk7QUFBQSxVQUFHLFFBQVEsS0FBSywyQ0FBMkMsSUFBSTtBQUFBLE1BQ3pFO0FBQUEsTUFDQSxPQUFPO0FBQUE7QUFBQSxJQUdULE1BQU0sV0FBVztBQUFBLElBQ2pCLFNBQVMsTUFBTSxDQUFDLFdBQVc7QUFBQSxNQUN6QixJQUFJLENBQUMsZUFBZTtBQUFBLFFBQ2xCLE1BQU0sSUFBSSxNQUFNLGlHQUFnRztBQUFBLE1BQ2xIO0FBQUEsTUFDQSxNQUFNLFNBQVM7QUFBQSxNQUNmLE9BQU8sY0FBYyxRQUFRLE9BQThCLENBQUMsU0FBUztBQUFBLFFBQ25FLE1BQU0sTUFBTSxPQUFPLElBQUk7QUFBQSxRQUN2QixNQUFNLE1BQU0sSUFBSSxRQUFRLElBQUk7QUFBQSxRQUM1QixPQUFPLE9BQU8sTUFBTSxHQUFHO0FBQUEsT0FDeEI7QUFBQTtBQUFBLElBRUgsT0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQU87QUFBQTtBQUdBLFNBQVMsaUJBQW9CLENBQUMsVUFBZSxDQUFDLEdBQW1CO0FBQUEsRUFDdEUsT0FBTyxhQUFnQixPQUFPO0FBQUE7OztBQ2hGbEMsSUFBSSxpQkFBd0M7QUFFckMsU0FBUyxpQkFBaUIsQ0FBQyxLQUFrQztBQUFBLEVBQ2xFLGlCQUFpQjtBQUFBO0FBR25CLFNBQVMsWUFBWSxDQUFDLEdBQTZCO0FBQUEsRUFDakQsT0FDRSxDQUFDLENBQUMsS0FDRixPQUFRLEVBQThCLFFBQVEsY0FDOUMsT0FBUSxFQUE4QixjQUFjO0FBQUE7QUFJeEQsU0FBUyxLQUFLLENBQUMsR0FBb0I7QUFBQSxFQUNqQyxPQUFPLEtBQUssT0FBTyxLQUFLLE9BQU8sTUFBTSxXQUFXLElBQUksT0FBTyxDQUFDO0FBQUE7QUFPOUQsSUFBTSxXQUFXLElBQUk7QUFFckIsU0FBUyxVQUFVLENBQUMsTUFBWSxJQUFzQjtBQUFBLEVBQ3BELE1BQU0sTUFBTSxTQUFTLElBQUksSUFBSTtBQUFBLEVBQzdCLElBQUk7QUFBQSxJQUFLLElBQUksS0FBSyxFQUFFO0FBQUEsRUFDZjtBQUFBLGFBQVMsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQUE7QUFHdkIsU0FBUyxXQUFXLENBQUMsTUFBa0I7QUFBQSxFQUM1QyxNQUFNLE1BQU0sU0FBUyxJQUFJLElBQUk7QUFBQSxFQUM3QixJQUFJLEtBQUs7QUFBQSxJQUNQLFdBQVcsS0FBSyxLQUFLO0FBQUEsTUFDbkIsSUFBSTtBQUFBLFFBQ0YsRUFBRTtBQUFBLFFBQ0YsTUFBTTtBQUFBLElBQ1Y7QUFBQSxJQUNBLFNBQVMsT0FBTyxJQUFJO0FBQUEsRUFDdEI7QUFBQSxFQUNBLElBQUksZ0JBQWdCLFdBQVcsS0FBSyxjQUFjLEdBQUc7QUFBQSxJQUNuRCxLQUFLLFdBQVcsUUFBUSxDQUFDLFVBQVUsWUFBWSxLQUFLLENBQUM7QUFBQSxFQUN2RDtBQUFBO0FBUUYsU0FBUyxtQkFBbUIsQ0FBQyxRQUFjLEtBQWdDO0FBQUEsRUFDekUsTUFBTSxRQUFRLFNBQVMsY0FBYyxXQUFXO0FBQUEsRUFDaEQsTUFBTSxNQUFRLFNBQVMsY0FBYyxTQUFTO0FBQUEsRUFDOUMsT0FBTyxZQUFZLEtBQUs7QUFBQSxFQUN4QixPQUFPLFlBQVksR0FBRztBQUFBLEVBRXRCLE1BQU0sZ0JBQWdCLENBQUMsVUFBeUI7QUFBQSxJQUU5QyxJQUFJLEtBQUksTUFBTTtBQUFBLElBQ2QsT0FBTyxNQUFLLE9BQU0sS0FBSztBQUFBLE1BQ3JCLE1BQU0sT0FBTyxHQUFFO0FBQUEsTUFDZixZQUFZLEVBQUM7QUFBQSxNQUNiLE9BQU8sWUFBWSxFQUFDO0FBQUEsTUFDcEIsS0FBSTtBQUFBLElBQ047QUFBQSxJQUdBLE1BQU0sT0FBTyxTQUFTLHVCQUF1QjtBQUFBLElBQzdDLElBQUksU0FBUyxRQUFRLFVBQVUsT0FBTyxDQUV0QyxFQUFPLFNBQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUFBLE1BQy9CLFdBQVcsS0FBSztBQUFBLFFBQU8saUJBQWlCLE1BQU0sQ0FBVTtBQUFBLElBQzFELEVBQU8sU0FBSSxpQkFBaUIsTUFBTTtBQUFBLE1BQ2hDLGVBQWUsTUFBTSxLQUFLO0FBQUEsSUFDNUIsRUFBTztBQUFBLE1BRUwsS0FBSyxZQUFZLFNBQVMsZUFBZSxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQUE7QUFBQSxJQUV4RCxPQUFPLGFBQWEsTUFBTSxHQUFHO0FBQUE7QUFBQSxFQUkvQixjQUFjLElBQUksSUFBSSxDQUFDO0FBQUEsRUFDdkIsTUFBTSxRQUFRLElBQUksVUFBVSxhQUFhO0FBQUEsRUFFekMsV0FBVyxPQUFPLEtBQUs7QUFBQTtBQUt6QixTQUFTLGNBQWMsQ0FBQyxRQUFjLE1BQWtCO0FBQUEsRUFFdEQsSUFBSSxLQUFLLGFBQWEsS0FBSyx3QkFBd0I7QUFBQSxJQUNqRCxPQUFPLFlBQVksS0FBSyxVQUFVLElBQUksQ0FBQztBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUFBLEVBRUEsSUFBSSxLQUFLLGNBQWMsS0FBSyxlQUFlLFFBQVE7QUFBQSxJQUNqRCxPQUFPLFlBQVksS0FBSyxVQUFVLElBQUksQ0FBQztBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTyxZQUFZLElBQUk7QUFBQTtBQUl6QixTQUFTLGdCQUFnQixDQUFDLFFBQWMsT0FBb0I7QUFBQSxFQUMxRCxJQUFJLFNBQVMsUUFBUSxVQUFVO0FBQUEsSUFBTztBQUFBLEVBRXRDLElBQUksYUFBYSxLQUFLLEdBQUc7QUFBQSxJQUN2QixvQkFBb0IsUUFBUSxLQUFLO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQUEsRUFFQSxJQUFJLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFBQSxJQUN4QixXQUFXLEtBQUs7QUFBQSxNQUFPLGlCQUFpQixRQUFRLENBQVU7QUFBQSxJQUMxRDtBQUFBLEVBQ0Y7QUFBQSxFQUVBLElBQUksaUJBQWlCLE1BQU07QUFBQSxJQUN6QixlQUFlLFFBQVEsS0FBSztBQUFBLElBQzVCO0FBQUEsRUFDRjtBQUFBLEVBRUEsZUFBZSxRQUFRLFNBQVMsZUFBZSxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQUE7QUFPOUQsU0FBUyxVQUFVLENBQUMsSUFBaUIsR0FBa0I7QUFBQSxFQUNyRCxJQUFJLEtBQUssUUFBUSxNQUFNLE9BQU87QUFBQSxJQUM1QixHQUFHLFlBQVk7QUFBQSxJQUNmO0FBQUEsRUFDRjtBQUFBLEVBQ0EsSUFBSSxPQUFPLE1BQU0sVUFBVTtBQUFBLElBQ3pCLEdBQUcsWUFBWTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxJQUFJLE1BQU0sUUFBUSxDQUFDLEdBQUc7QUFBQSxJQUNwQixHQUFHLFlBQVksRUFBRSxPQUFPLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRztBQUFBLElBQy9EO0FBQUEsRUFDRjtBQUFBLEVBQ0EsSUFBSSxPQUFPLE1BQU0sVUFBVTtBQUFBLElBQ3pCLE1BQU0sT0FBTyxPQUFPLFFBQVEsQ0FBNEIsRUFDckQsT0FBTyxJQUFJLFFBQVEsUUFBUSxFQUFFLENBQUMsRUFDOUIsSUFBSSxFQUFFLE9BQU8sQ0FBQztBQUFBLElBQ2pCLEdBQUcsWUFBWSxLQUFLLEtBQUssR0FBRztBQUFBLElBQzVCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsR0FBRyxZQUFZLE9BQU8sQ0FBQztBQUFBO0FBS3pCLFNBQVMsY0FBYyxDQUFDLEdBQStCO0FBQUEsRUFDckQsT0FDRSxPQUFPLE1BQU0sY0FDWixPQUFPLE1BQU0sWUFBWSxNQUFNLFFBQVEsaUJBQWtCO0FBQUE7QUFJOUQsU0FBUyxjQUFjLENBQUMsR0FBK0I7QUFBQSxFQUNyRCxPQUFPLE9BQU8sTUFBTSxhQUFjLE9BQU8sTUFBTSxZQUFZLE1BQU07QUFBQTtBQUduRSxTQUFTLFlBQVksQ0FBQyxHQUE2QjtBQUFBLEVBQ2pELElBQUksQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUFBLElBQUcsT0FBTztBQUFBLEVBQzlCLElBQUksRUFBRSxXQUFXO0FBQUEsSUFBRyxPQUFPO0FBQUEsRUFDM0IsTUFBTSxNQUFlLEVBQUU7QUFBQSxFQUN2QixJQUFJLENBQUMsZUFBZSxHQUFHO0FBQUEsSUFBRyxPQUFPO0FBQUEsRUFDakMsTUFBTSxZQUFxQixFQUFFLFNBQVMsSUFBSSxFQUFFLEtBQUs7QUFBQSxFQUNqRCxJQUFJLGNBQWMsYUFBYSxDQUFDLGVBQWUsU0FBUztBQUFBLElBQUcsT0FBTztBQUFBLEVBQ2xFLE9BQU87QUFBQTtBQUdULFNBQVMsY0FBYyxDQUFDLEdBQXNFO0FBQUEsRUFDNUYsSUFBSSxlQUFlLENBQUMsR0FBRztBQUFBLElBQ3JCLE9BQU8sRUFBRSxTQUFTLEVBQUU7QUFBQSxFQUN0QjtBQUFBLEVBQ0EsSUFBSSxhQUFhLENBQUMsR0FBRztBQUFBLElBQ25CLE1BQU0sVUFBVSxFQUFFO0FBQUEsSUFDbEIsTUFBTSxVQUFVLEVBQUUsU0FBUyxJQUFJLEVBQUUsS0FBSztBQUFBLElBQ3RDLE9BQU8sRUFBRSxTQUFTLFFBQVE7QUFBQSxFQUM1QjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBV1QsU0FBUyxlQUFlLENBQUMsSUFBZ0IsS0FBYSxLQUFnQztBQUFBLEVBQ3BGLE1BQU0sUUFBUSxDQUFDLE1BQXFCO0FBQUEsSUFFbEMsSUFBSSxRQUFRLFdBQVcsUUFBUSxhQUFhO0FBQUEsTUFDMUMsV0FBVyxJQUFtQixDQUFDO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBQUEsSUFHQSxJQUFJLFFBQVEsV0FBVyxLQUFLLE9BQU8sTUFBTSxVQUFVO0FBQUEsTUFDakQsT0FBTyxPQUFRLEdBQW1CLE9BQU8sQ0FBNEI7QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFBQSxJQUdBLElBQUksUUFBUSxTQUFTO0FBQUEsTUFDbkIsTUFBTSxNQUFNO0FBQUEsTUFDWixNQUFNLE9BQU8sS0FBSyxPQUFPLEtBQUssT0FBTyxDQUFDO0FBQUEsTUFHdEMsSUFBSSxJQUFJLFVBQVU7QUFBQSxRQUFNLElBQUksUUFBUTtBQUFBLE1BR3BDLElBQUksa0JBQWtCLEtBQUs7QUFBQSxRQUN6QixNQUFNLEtBQUk7QUFBQSxRQUNWLElBQUksR0FBRSxpQkFBaUI7QUFBQSxVQUFNLEdBQUUsZUFBZTtBQUFBLE1BQ2hEO0FBQUEsTUFHQSxJQUFJLGVBQWUsbUJBQW1CO0FBQUEsUUFDcEMsV0FBVyxPQUFPLE1BQU0sS0FBSyxJQUFJLE9BQU8sR0FBRztBQUFBLFVBQ3pDLElBQUksV0FBVyxJQUFJLFVBQVU7QUFBQSxRQUMvQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBR0EsSUFBSSxRQUFRLFdBQVc7QUFBQSxNQUNyQixNQUFNLE1BQU07QUFBQSxNQUNaLE1BQU0sT0FBTyxRQUFRLENBQUM7QUFBQSxNQUN0QixJQUFJLElBQUksWUFBWTtBQUFBLFFBQU0sSUFBSSxVQUFVO0FBQUEsTUFDeEMsSUFBSSxJQUFJLG1CQUFtQjtBQUFBLFFBQU0sSUFBSSxpQkFBaUI7QUFBQSxNQUN0RDtBQUFBLElBQ0Y7QUFBQSxJQUdBLElBQUksT0FBTyxJQUFJO0FBQUEsTUFDYixNQUFNLEtBQUssUUFBUSxJQUFJLElBQWMsS0FBSyxDQUFDO0FBQUEsTUFDM0MsSUFBSSxDQUFDLElBQUk7QUFBQSxRQUNQLElBQUksS0FBSyxRQUFRLE1BQU07QUFBQSxVQUFPLEdBQUcsZ0JBQWdCLEdBQUc7QUFBQSxRQUMvQztBQUFBLGFBQUcsYUFBYSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQUEsTUFDckM7QUFBQSxJQUNGLEVBQU87QUFBQSxNQUNMLElBQUksS0FBSyxRQUFRLE1BQU07QUFBQSxRQUFPLEdBQUcsZ0JBQWdCLEdBQUc7QUFBQSxNQUMvQztBQUFBLFdBQUcsYUFBYSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQUE7QUFBQTtBQUFBLEVBS3ZDLE1BQU0sSUFBSSxJQUFJLENBQUM7QUFBQSxFQUNmLE1BQU0sUUFBUSxJQUFJLFVBQVUsS0FBSztBQUFBLEVBQ2pDLFdBQVcsSUFBSSxLQUFLO0FBQUE7QUFJdEIsU0FBUyxPQUFPLENBQUMsSUFBZ0IsS0FBYSxLQUFvQjtBQUFBLEVBQ2hFLElBQUksUUFBUTtBQUFBLElBQVk7QUFBQSxFQUd4QixJQUFJLGFBQWEsR0FBRyxHQUFHO0FBQUEsSUFDckIsZ0JBQWdCLElBQUksS0FBSyxHQUFHO0FBQUEsSUFDNUI7QUFBQSxFQUNGO0FBQUEsRUFHQSxJQUFJLElBQUksV0FBVyxJQUFJLEtBQUssSUFBSSxPQUFPLElBQUksSUFBSSxZQUFZLEdBQUc7QUFBQSxJQUM1RCxNQUFNLE9BQU8sSUFBSSxNQUFNLENBQUMsRUFBRSxZQUFZO0FBQUEsSUFDdEMsTUFBTSxTQUFTLGVBQWUsR0FBRztBQUFBLElBQ2pDLElBQUksUUFBUTtBQUFBLE1BQ1YsR0FBRyxpQkFBaUIsTUFBTSxPQUFPLFNBQVMsT0FBTyxPQUFPO0FBQUEsTUFDeEQsV0FBVyxJQUFJLE1BQU0sR0FBRyxvQkFBb0IsTUFBTSxPQUFPLFNBQVMsT0FBTyxPQUFPLENBQUM7QUFBQSxJQUNuRjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFHQSxJQUFJLFFBQVEsV0FBVyxPQUFPLE9BQU8sUUFBUSxVQUFVO0FBQUEsSUFDckQsT0FBTyxPQUFRLEdBQW1CLE9BQU8sR0FBOEI7QUFBQSxJQUN2RTtBQUFBLEVBQ0Y7QUFBQSxFQUdBLElBQUksUUFBUSxXQUFXLFFBQVEsYUFBYTtBQUFBLElBQzFDLFdBQVcsSUFBbUIsR0FBRztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBR0EsSUFBSSxRQUFRLFNBQVM7QUFBQSxJQUNuQixNQUFNLE1BQU07QUFBQSxJQUNaLE1BQU0sT0FBTyxPQUFPLE9BQU8sS0FBSyxPQUFPLEdBQUc7QUFBQSxJQUUxQyxJQUFJLElBQUksVUFBVTtBQUFBLE1BQU0sSUFBSSxRQUFRO0FBQUEsSUFDcEMsSUFBSSxrQkFBa0IsS0FBSztBQUFBLE1BQ3pCLE1BQU0sS0FBSTtBQUFBLE1BQ1YsSUFBSSxHQUFFLGlCQUFpQjtBQUFBLFFBQU0sR0FBRSxlQUFlO0FBQUEsSUFDaEQ7QUFBQSxJQUNBLElBQUksZUFBZSxtQkFBbUI7QUFBQSxNQUNwQyxXQUFXLE9BQU8sTUFBTSxLQUFLLElBQUksT0FBTyxHQUFHO0FBQUEsUUFDekMsSUFBSSxXQUFXLElBQUksVUFBVTtBQUFBLE1BQy9CO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFFQSxJQUFJLFFBQVEsV0FBVztBQUFBLElBQ3JCLE1BQU0sTUFBTTtBQUFBLElBQ1osTUFBTSxPQUFPLFFBQVEsR0FBRztBQUFBLElBQ3hCLElBQUksSUFBSSxZQUFZO0FBQUEsTUFBTSxJQUFJLFVBQVU7QUFBQSxJQUN4QyxJQUFJLElBQUksbUJBQW1CO0FBQUEsTUFBTSxJQUFJLGlCQUFpQjtBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBR0EsSUFBSSxPQUFPLElBQUk7QUFBQSxJQUNiLE1BQU0sS0FBSyxRQUFRLElBQUksSUFBYyxLQUFLLEdBQUc7QUFBQSxJQUM3QyxJQUFJLENBQUMsSUFBSTtBQUFBLE1BQ1AsSUFBSSxPQUFPLFFBQVEsUUFBUTtBQUFBLFFBQU8sR0FBRyxnQkFBZ0IsR0FBRztBQUFBLE1BQ25EO0FBQUEsV0FBRyxhQUFhLEtBQUssT0FBTyxHQUFHLENBQUM7QUFBQSxJQUN2QztBQUFBLEVBQ0YsRUFBTztBQUFBLElBQ0wsSUFBSSxPQUFPLFFBQVEsUUFBUTtBQUFBLE1BQU8sR0FBRyxnQkFBZ0IsR0FBRztBQUFBLElBQ25EO0FBQUEsU0FBRyxhQUFhLEtBQUssT0FBTyxHQUFHLENBQUM7QUFBQTtBQUFBO0FBU3pDLFNBQVMsaUJBQWlCLENBQUMsT0FBd0I7QUFBQSxFQUNqRCxJQUFJLE9BQU8sVUFBVTtBQUFBLElBQVUsT0FBTztBQUFBLEVBQ3RDLElBQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUFBLElBQ3hCLE9BQU8sTUFBTSxPQUFPLE9BQU8sRUFBRSxLQUFLLEdBQUc7QUFBQSxFQUN2QztBQUFBLEVBQ0EsSUFBSSxTQUFTLE9BQU8sVUFBVSxVQUFVO0FBQUEsSUFDdEMsT0FBTyxPQUFPLFFBQVEsS0FBZ0MsRUFDbkQsT0FBTyxJQUFJLFFBQVEsUUFBUSxFQUFFLENBQUMsRUFDOUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUNkLEtBQUssR0FBRztBQUFBLEVBQ2I7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUlULFNBQVMsdUJBQXVCLENBQzlCLFNBQ0EsU0FDTTtBQUFBLEVBQ04sTUFBTSxRQUFRLE1BQU0sS0FBSyxRQUFRLFVBQVU7QUFBQSxFQUUzQyxXQUFXLFFBQVEsT0FBTztBQUFBLElBQ3hCLElBQUksQ0FBQyxLQUFLLEtBQUssV0FBVyxjQUFjO0FBQUEsTUFBRztBQUFBLElBRTNDLE1BQU0sT0FBTyxLQUFLLEtBQUssUUFBUSxnQkFBZ0IsRUFBRTtBQUFBLElBQ2pELE1BQU0sV0FBVyxLQUFLO0FBQUEsSUFDdEIsTUFBTSxTQUFTLFFBQVEsSUFBSSxRQUFRO0FBQUEsSUFFbkMsSUFBSSxDQUFDO0FBQUEsTUFBUTtBQUFBLElBR2IsTUFBTSxRQUFRLE9BQU8sVUFBVSxDQUFDLFVBQVU7QUFBQSxNQUN4QyxJQUFJLFNBQVMsU0FBUztBQUFBLFFBQ25CLFFBQTZCLFFBQVEsT0FBTyxTQUFTLEVBQUU7QUFBQSxNQUMxRCxFQUFPLFNBQUksU0FBUyxXQUFXO0FBQUEsUUFDNUIsUUFBNkIsVUFBVSxRQUFRLEtBQUs7QUFBQSxNQUN2RCxFQUFPLFNBQUksU0FBUyxTQUFTO0FBQUEsUUFDM0IsUUFBUSxZQUFZLGtCQUFrQixLQUFLO0FBQUEsTUFDN0MsRUFBTztBQUFBLFFBQ0wsUUFBUSxhQUFhLE1BQU0sT0FBTyxTQUFTLEVBQUUsQ0FBQztBQUFBO0FBQUEsS0FFakQ7QUFBQSxJQUVELFdBQVcsU0FBUyxLQUFLO0FBQUEsSUFDekIsUUFBUSxnQkFBZ0IsS0FBSyxJQUFJO0FBQUEsRUFDbkM7QUFBQTtBQUlGLFNBQVMsa0JBQWtCLENBQ3pCLFdBQ0EsU0FDTTtBQUFBLEVBQ04sTUFBTSxTQUFTLFNBQVMsaUJBQWlCLFdBQVcsV0FBVyxZQUFZO0FBQUEsRUFFM0UsTUFBTSxjQUlELENBQUM7QUFBQSxFQUVOLElBQUk7QUFBQSxFQUNKLE9BQVEsT0FBTyxPQUFPLFNBQVMsR0FBc0I7QUFBQSxJQUNuRCxNQUFNLFFBQVEsS0FBSyxhQUFhLE1BQU0scUJBQXFCO0FBQUEsSUFDM0QsSUFBSSxPQUFPO0FBQUEsTUFDVCxNQUFNLEtBQUssTUFBTTtBQUFBLE1BQ2pCLElBQUksVUFBdUIsS0FBSztBQUFBLE1BRWhDLE9BQU8sU0FBUztBQUFBLFFBQ2QsSUFDRSxRQUFRLGFBQWEsS0FBSyxnQkFDekIsUUFBb0IsZ0JBQWdCLGNBQWMsTUFDbkQ7QUFBQSxVQUNBLFlBQVksS0FBSyxFQUFFLE9BQU8sTUFBTSxLQUFLLFNBQW9CLEdBQUcsQ0FBQztBQUFBLFVBQzdEO0FBQUEsUUFDRjtBQUFBLFFBQ0EsVUFBVSxRQUFRO0FBQUEsTUFDcEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBR0EsYUFBYSxPQUFPLEtBQUssUUFBUSxhQUFhO0FBQUEsSUFDNUMsTUFBTSxTQUFTLFFBQVEsSUFBSSxFQUFFO0FBQUEsSUFDN0IsSUFBSSxDQUFDO0FBQUEsTUFBUTtBQUFBLElBRWIsTUFBTSxRQUFRLE9BQU8sVUFBVSxDQUFDLFVBQVU7QUFBQSxNQUV4QyxJQUFJLFVBQVUsTUFBTTtBQUFBLE1BQ3BCLE9BQU8sV0FBVyxZQUFZLEtBQUs7QUFBQSxRQUNqQyxNQUFNLE9BQU8sUUFBUTtBQUFBLFFBQ3JCLFFBQVEsWUFBWSxZQUFZLE9BQU87QUFBQSxRQUN2QyxVQUFVO0FBQUEsTUFDWjtBQUFBLE1BR0EsTUFBTSxTQUFTLE1BQU07QUFBQSxNQUNyQixJQUFJLENBQUM7QUFBQSxRQUFRO0FBQUEsTUFFYixJQUFJLFNBQVMsUUFBUSxVQUFVLE9BQU8sQ0FFdEMsRUFBTyxTQUFJLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFBQSxRQUMvQixNQUFNLE9BQU8sU0FBUyx1QkFBdUI7QUFBQSxRQUM3QyxXQUFXLFFBQVEsT0FBTztBQUFBLFVBQ3hCLElBQUksZ0JBQWdCLE1BQU07QUFBQSxZQUN4QixLQUFLLFlBQVksS0FBSyxVQUFVLElBQUksQ0FBQztBQUFBLFVBQ3ZDLEVBQU87QUFBQSxZQUNMLEtBQUssWUFBWSxTQUFTLGVBQWUsT0FBTyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQUE7QUFBQSxRQUVoRTtBQUFBLFFBQ0EsT0FBTyxhQUFhLE1BQU0sR0FBRztBQUFBLE1BQy9CLEVBQU8sU0FBSSxpQkFBaUIsTUFBTTtBQUFBLFFBQ2hDLE9BQU8sYUFBYSxNQUFNLFVBQVUsSUFBSSxHQUFHLEdBQUc7QUFBQSxNQUNoRCxFQUFPO0FBQUEsUUFDTCxPQUFPLGFBQWEsU0FBUyxlQUFlLE9BQU8sS0FBSyxDQUFDLEdBQUcsR0FBRztBQUFBO0FBQUEsS0FFbEU7QUFBQSxJQUVELFdBQVcsT0FBTyxLQUFLO0FBQUEsRUFDekI7QUFBQTtBQUlGLFNBQVMsOEJBQThCLENBQ3JDLE1BQ0EsU0FDTTtBQUFBLEVBQ04sSUFBSSxLQUFLLGFBQWEsS0FBSyxjQUFjO0FBQUEsSUFDdkMsTUFBTSxVQUFVO0FBQUEsSUFFaEIsd0JBQXdCLFNBQVMsT0FBTztBQUFBLElBRXhDLFdBQVcsU0FBUyxNQUFNLEtBQUssUUFBUSxVQUFVLEdBQUc7QUFBQSxNQUNsRCwrQkFBK0IsT0FBTyxPQUFPO0FBQUEsSUFDL0M7QUFBQSxFQUNGO0FBQUE7QUFHRixTQUFTLGlCQUFpQixHQUFTO0FBQUEsRUFDakMsSUFBSSxDQUFDO0FBQUEsSUFBZ0I7QUFBQSxFQUVyQixJQUFJLFVBQVUsZUFBZTtBQUFBLEVBQzdCLElBQUksUUFBUTtBQUFBLEVBRVosT0FBTyxTQUFTO0FBQUEsSUFDZCxJQUFJLFFBQVEsYUFBYSxLQUFLLGNBQWM7QUFBQSxNQUMxQyxNQUFNLE9BQVEsUUFBb0I7QUFBQSxNQUNsQyxJQUFJLE1BQU0sV0FBVyxlQUFlLEdBQUc7QUFBQSxRQUNyQztBQUFBLE1BQ0YsRUFBTyxTQUFJLE1BQU0sV0FBVyxhQUFhLEdBQUc7QUFBQSxRQUMxQyxJQUFJLFVBQVUsR0FBRztBQUFBLFVBQ2YsZUFBZSxTQUFTLFFBQVE7QUFBQSxVQUNoQztBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFVBQVUsUUFBUTtBQUFBLEVBQ3BCO0FBQUE7QUFHRixTQUFTLFlBQVksQ0FBQyxPQUFvQjtBQUFBLEVBQ3hDLElBQUksQ0FBQztBQUFBLElBQWdCO0FBQUEsRUFFckIsSUFBSSxTQUFTLFFBQVEsVUFBVSxPQUFPO0FBQUEsSUFDcEM7QUFBQSxFQUNGO0FBQUEsRUFFQSxJQUFJLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFBQSxJQUN4QixXQUFXLEtBQUs7QUFBQSxNQUFPLGFBQWEsQ0FBQztBQUFBLElBQ3JDO0FBQUEsRUFDRjtBQUFBLEVBRUEsSUFBSSxhQUFhLEtBQUssR0FBRztBQUFBLElBR3ZCLGtCQUFrQjtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUFBLEVBRUEsSUFBSSxpQkFBaUIsTUFBTTtBQUFBLElBRXpCO0FBQUEsRUFDRjtBQUFBLEVBR0EsSUFBSSxlQUFlLFFBQVEsYUFBYSxLQUFLLFdBQVc7QUFBQSxJQUN0RCxlQUFlLFNBQVMsZUFBZSxPQUFPO0FBQUEsRUFDaEQ7QUFBQTtBQUdGLFNBQVMsUUFBUSxDQUFDLEtBQWMsVUFBaUIsVUFBeUI7QUFBQSxFQUN4RSxJQUFJLENBQUM7QUFBQSxJQUFnQixNQUFNLElBQUksTUFBTSx5Q0FBeUM7QUFBQSxFQUc5RSxJQUFJLE9BQU8sUUFBUSxZQUFZO0FBQUEsSUFDN0IsTUFBTSxNQUFPLElBQXFEO0FBQUEsU0FDNUQsU0FBUyxDQUFDO0FBQUEsTUFDZDtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsT0FBTyxlQUFlLE9BQU8sTUFBTSxTQUFTLGVBQWUsT0FBTyxHQUFHLENBQUM7QUFBQSxFQUN4RTtBQUFBLEVBR0EsTUFBTSxlQUFlLGVBQWU7QUFBQSxFQUVwQyxJQUFJLENBQUMsZ0JBQWdCLGFBQWEsYUFBYSxLQUFLLGNBQWM7QUFBQSxJQUNoRSxRQUFRLEtBQUssMERBQTBEO0FBQUEsSUFFdkUsTUFBTSxXQUFXO0FBQUEsSUFDakIsaUJBQWlCO0FBQUEsSUFDakIsTUFBTSxNQUFLLEVBQUUsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUFBLElBQ3BDLGlCQUFpQjtBQUFBLElBQ2pCLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFFQSxNQUFNLEtBQUs7QUFBQSxFQUdYLElBQUksT0FBTztBQUFBLElBQ1QsWUFBWSxHQUFHLE1BQU0sT0FBTyxRQUFRLEtBQUssR0FBRztBQUFBLE1BRTFDLElBQUksRUFBRSxXQUFXLElBQUksS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLFlBQVksR0FBRztBQUFBLFFBQ3RELFFBQVEsSUFBa0IsR0FBRyxDQUFDO0FBQUEsTUFDaEM7QUFBQSxJQUdGO0FBQUEsRUFDRjtBQUFBLEVBR0EsTUFBTSxZQUFZLGVBQWU7QUFBQSxFQUNqQyxlQUFlLFNBQVMsR0FBRztBQUFBLEVBRTNCLFdBQVcsU0FBUyxVQUFVO0FBQUEsSUFDNUIsYUFBYSxLQUFLO0FBQUEsRUFDcEI7QUFBQSxFQUdBLGVBQWUsU0FBUyxXQUFXLGVBQWU7QUFBQSxFQUVsRCxPQUFPO0FBQUE7QUFPVCxJQUFNLFNBQVM7QUFDZixJQUFNLFdBQVcsSUFBSSxJQUFZO0FBQUEsRUFDL0I7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFFTSxTQUFTLENBQUMsQ0FBQyxLQUFjLFVBQWlCLFVBQXlCO0FBQUEsRUFFeEUsSUFBSSxnQkFBZ0I7QUFBQSxJQUNsQixPQUFPLFNBQVMsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUFBLEVBQ3pDO0FBQUEsRUFJQSxJQUFJLE9BQU8sUUFBUSxZQUFZO0FBQUEsSUFDN0IsTUFBTSxNQUFPLElBQXFEO0FBQUEsU0FDNUQsU0FBUyxDQUFDO0FBQUEsTUFDZDtBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsSUFBSSxlQUFlO0FBQUEsTUFBTSxPQUFPO0FBQUEsSUFDaEMsTUFBTSxPQUFPLFNBQVMsdUJBQXVCO0FBQUEsSUFDN0MsaUJBQWlCLE1BQU0sR0FBWTtBQUFBLElBQ25DLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFHQSxNQUFNLFVBQVUsT0FBTyxPQUFPLEtBQUs7QUFBQSxFQUNuQyxNQUFNLEtBQU0sU0FBUyxJQUFJLE9BQU8sSUFDNUIsU0FBUyxnQkFBZ0IsUUFBUSxPQUFPLElBQ3hDLFNBQVMsY0FBYyxPQUFPO0FBQUEsRUFFbEMsSUFBSSxPQUFPO0FBQUEsSUFDVCxZQUFZLEdBQUcsTUFBTSxPQUFPLFFBQVEsS0FBSztBQUFBLE1BQUcsUUFBUSxJQUFJLEdBQUcsQ0FBQztBQUFBLEVBQzlEO0FBQUEsRUFDQSxXQUFXLE1BQU07QUFBQSxJQUFVLGlCQUFpQixJQUFJLEVBQUU7QUFBQSxFQUNsRCxPQUFPO0FBQUE7QUFHRixJQUFNLE9BQXFCLG1CQUE2QixLQUFLLENBQUM7QUFRckUsSUFBTSxRQUNKLE9BQU8sWUFBWSxlQUFlLFNBQVMsS0FBSyxhQUFhO0FBRS9ELFNBQVMsVUFBVSxHQUF1QjtBQUFBLEVBQ3hDLElBQUk7QUFBQSxJQUNGLE1BQU0sUUFBUSxJQUFJLE1BQU0sRUFBRSxPQUFPLE1BQU07QUFBQSxDQUFJLEVBQUUsTUFBTSxDQUFDO0FBQUEsSUFDcEQsSUFBSSxDQUFDLE9BQU87QUFBQSxNQUFRO0FBQUEsSUFDcEIsTUFBTSxRQUFRLE1BQU0sS0FBSyxDQUFDLFNBQVMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFDN0QsSUFBSSxDQUFDO0FBQUEsTUFBTztBQUFBLElBQ1osTUFBTSxRQUFRLE1BQU0sTUFBTSxzQ0FBc0M7QUFBQSxJQUNoRSxJQUFJLENBQUM7QUFBQSxNQUFPO0FBQUEsSUFDWixPQUFPLEdBQUcsTUFBTSxNQUFNLE1BQU07QUFBQSxJQUM1QixNQUFNO0FBQUEsSUFDTjtBQUFBO0FBQUE7QUFJSixTQUFTLGdCQUFnQixDQUFDLFFBQWtDO0FBQUEsRUFDMUQsSUFBSSxPQUFPLFdBQVcsVUFBVTtBQUFBLElBQzlCLE1BQU0sS0FBSyxTQUFTLGNBQWMsTUFBTTtBQUFBLElBQ3hDLElBQUksQ0FBQyxJQUFJO0FBQUEsTUFDUCxNQUFNLFFBQU8sUUFBUSxXQUFXLElBQUk7QUFBQSxNQUNwQyxNQUFNLFNBQVEsUUFBTyxpQkFBaUIsV0FBVTtBQUFBLE1BQ2hELE1BQU0sSUFBSSxNQUFNLCtCQUFnQyx3RUFBd0UsUUFBTztBQUFBLElBQ2pJO0FBQUEsSUFDQSxPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsSUFBSSxrQkFBa0I7QUFBQSxJQUFTLE9BQU87QUFBQSxFQUN0QyxNQUFNLE9BQU8sUUFBUSxXQUFXLElBQUk7QUFBQSxFQUNwQyxNQUFNLFFBQVEsT0FBTyxpQkFBaUIsVUFBVTtBQUFBLEVBQ2hELE1BQU0sSUFBSSxNQUFNLDRFQUE0RSxPQUFPO0FBQUE7QUFJckcsU0FBUyxlQUFlLENBQ3RCLE1BQ0EsV0FDQSxPQUNlO0FBQUEsRUFFZixNQUFNLFVBQVUsSUFBSTtBQUFBLEVBQ3BCLFlBQVksSUFBSSxVQUFVLE9BQU8sUUFBUSxLQUFLLEdBQUc7QUFBQSxJQUMvQyxRQUFRLElBQUksSUFBSSxhQUFhLEtBQUssQ0FBQztBQUFBLEVBQ3JDO0FBQUEsRUFHQSxNQUFNLE1BQXNCO0FBQUEsSUFDMUIsUUFBUSxVQUFVO0FBQUEsSUFDbEIsTUFBTTtBQUFBLElBQ047QUFBQSxFQUNGO0FBQUEsRUFFQSxrQkFBa0IsR0FBRztBQUFBLEVBRXJCLElBQUk7QUFBQSxJQUVGLE9BQU8sU0FBUyxjQUFhLEtBQUs7QUFBQSxJQUdsQyxtQkFBbUIsV0FBVyxPQUFPO0FBQUEsSUFDckMsK0JBQStCLFdBQVcsT0FBTztBQUFBLFlBQ2pEO0FBQUEsSUFFQSxrQkFBa0IsSUFBSTtBQUFBO0FBQUEsRUFHeEIsTUFBTSxRQUFRLE1BQU0sS0FBSyxVQUFVLFVBQVU7QUFBQSxFQUM3QyxPQUFPLE1BQU0sV0FBVyxJQUFJLE1BQU0sS0FBTTtBQUFBO0FBR25DLFNBQVMsTUFBTSxDQUFDLE1BQWdCLFdBQTJDO0FBQUEsRUFDaEYsTUFBTSxXQUFXLGlCQUFpQixTQUFTO0FBQUEsRUFLM0MsTUFBTSxjQUFjLE9BQU8sYUFBYSxjQUNwQyxTQUFTLGVBQWUsaUJBQWlCLElBQ3pDO0FBQUEsRUFFSixJQUFJLFNBQVMsV0FBVyxTQUFTLEtBQUssYUFBYTtBQUFBLElBRWpELE1BQU0sUUFBUSxLQUFLLE1BQU0sWUFBWSxlQUFlLElBQUk7QUFBQSxJQUN4RCxZQUFZLE9BQU87QUFBQSxJQUNuQixPQUFPLGdCQUFnQixNQUFNLFVBQVUsS0FBSztBQUFBLEVBQzlDO0FBQUEsRUFHQSxNQUFNLFlBQVksTUFBTSxLQUFLLFNBQVMsVUFBVTtBQUFBLEVBQ2hELFdBQVcsUUFBUTtBQUFBLElBQVcsWUFBWSxJQUFJO0FBQUEsRUFDOUMsU0FBUyxjQUFjO0FBQUEsRUFHdkIsTUFBTSxNQUFNLE9BQU8sU0FBUyxhQUFjLEtBQXFCLElBQUk7QUFBQSxFQUNuRSxNQUFNLFFBQVEsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRztBQUFBLEVBRTdDLFdBQVcsS0FBSztBQUFBLElBQU8saUJBQWlCLFVBQVUsQ0FBQztBQUFBLEVBRW5ELE1BQU0sV0FBVyxNQUFNLEtBQUssU0FBUyxVQUFVO0FBQUEsRUFDL0MsT0FBTyxTQUFTLFdBQVcsSUFBSSxTQUFTLEtBQU07QUFBQTtBQVNoRCxTQUFTLGdCQUFnQixDQUFDLE9BQWEsS0FBaUI7QUFBQSxFQUN0RCxNQUFNLFNBQVMsTUFBTTtBQUFBLEVBQ3JCLElBQUksQ0FBQztBQUFBLElBQVE7QUFBQSxFQUNiLElBQUksS0FBaUI7QUFBQSxFQUNyQixPQUFPLElBQUc7QUFBQSxJQUNSLE1BQU0sTUFBbUIsR0FBRTtBQUFBLElBQzNCLFlBQVksRUFBQztBQUFBLElBQ2IsT0FBTyxZQUFZLEVBQUM7QUFBQSxJQUNwQixJQUFJLE9BQU07QUFBQSxNQUFLO0FBQUEsSUFDZixLQUFJO0FBQUEsRUFDTjtBQUFBO0FBR0YsU0FBUyxlQUFlLENBQUMsT0FBYSxLQUFXLEtBQXdCO0FBQUEsRUFDdkUsTUFBTSxTQUFTLE1BQU07QUFBQSxFQUNyQixJQUFJLENBQUM7QUFBQSxJQUFRO0FBQUEsRUFDYixNQUFNLE9BQU8sU0FBUyx1QkFBdUI7QUFBQSxFQUM3QyxJQUFJLEtBQWlCO0FBQUEsRUFDckIsT0FBTyxJQUFHO0FBQUEsSUFDUixNQUFNLE1BQW1CLEdBQUU7QUFBQSxJQUMzQixLQUFLLFlBQVksRUFBQztBQUFBLElBQ2xCLElBQUksT0FBTTtBQUFBLE1BQUs7QUFBQSxJQUNmLEtBQUk7QUFBQSxFQUNOO0FBQUEsRUFDQSxPQUFPLGFBQWEsTUFBTSxHQUFHO0FBQUE7QUFHL0IsU0FBUyxpQkFBb0IsQ0FDM0IsUUFDQSxLQUNBLFlBQ0EsTUFDa0M7QUFBQSxFQUNsQyxNQUFNLFFBQVEsU0FBUyxjQUFjLGNBQWM7QUFBQSxFQUNuRCxNQUFNLE1BQU0sU0FBUyxjQUFjLFlBQVk7QUFBQSxFQUMvQyxNQUFNLE9BQU8sU0FBUyx1QkFBdUI7QUFBQSxFQUU3QyxLQUFLLFlBQVksS0FBSztBQUFBLEVBQ3RCLE1BQU0sTUFBTSxXQUFXLElBQUk7QUFBQSxFQUMzQixpQkFBaUIsTUFBTSxHQUFHO0FBQUEsRUFDMUIsS0FBSyxZQUFZLEdBQUc7QUFBQSxFQUVwQixPQUFPLGFBQWEsTUFBTSxHQUFHO0FBQUEsRUFDN0IsT0FBTyxFQUFFLE9BQU8sSUFBSTtBQUFBO0FBR2YsU0FBUyxNQUFTLENBQ3ZCLFNBQ0EsT0FDQSxZQUNNO0FBQUEsRUFDTixNQUFNLFNBQVMsU0FBUyxlQUFlLEVBQUU7QUFBQSxFQUN6QyxNQUFNLFFBQVEsSUFBSTtBQUFBLEVBRWxCLFNBQVMsWUFBWSxDQUFDLE9BQWtCO0FBQUEsSUFDdEMsTUFBTSxTQUFTLE9BQU87QUFBQSxJQUN0QixJQUFJLE1BQW1CLE9BQU87QUFBQSxJQUM5QixXQUFXLE1BQU0sT0FBTztBQUFBLE1BQ3RCLE1BQU0sSUFBSSxNQUFNLEVBQUU7QUFBQSxNQUNsQixNQUFNLE1BQU0sa0JBQWtCLFFBQVEsS0FBSyxZQUFZLEVBQUU7QUFBQSxNQUN6RCxNQUFNLElBQUksR0FBRyxHQUFHO0FBQUEsTUFDaEIsTUFBTSxJQUFJLElBQUk7QUFBQSxJQUNoQjtBQUFBO0FBQUEsRUFLRixTQUFTLEtBQUssQ0FBQyxXQUFzQjtBQUFBLElBQ25DLE1BQU0sU0FBUyxPQUFPO0FBQUEsSUFDdEIsTUFBTSxPQUFPLElBQUk7QUFBQSxJQUNqQixJQUFJLFNBQWU7QUFBQSxJQUVuQixXQUFXLE1BQU0sV0FBVztBQUFBLE1BQzFCLE1BQU0sSUFBSSxNQUFNLEVBQUU7QUFBQSxNQUNsQixLQUFLLElBQUksQ0FBQztBQUFBLE1BQ1YsTUFBTSxRQUFRLE1BQU0sSUFBSSxDQUFDO0FBQUEsTUFFekIsSUFBSSxDQUFDLE9BQU87QUFBQSxRQUNWLE1BQU0sTUFBTSxrQkFBa0IsUUFBUSxPQUFPLGFBQWEsWUFBWSxFQUFFO0FBQUEsUUFDeEUsTUFBTSxJQUFJLEdBQUcsR0FBRztBQUFBLFFBQ2hCLFNBQVMsSUFBSTtBQUFBLE1BQ2YsRUFBTztBQUFBLFFBQ0wsTUFBTSxjQUEyQixPQUFPO0FBQUEsUUFDeEMsSUFBSSxNQUFNLFVBQVUsYUFBYTtBQUFBLFVBQy9CLGdCQUFnQixNQUFNLE9BQU8sTUFBTSxLQUFLLFdBQVc7QUFBQSxRQUNyRDtBQUFBLFFBQ0EsU0FBUyxNQUFNO0FBQUE7QUFBQSxJQUVuQjtBQUFBLElBRUEsWUFBWSxHQUFHLFFBQVEsT0FBTztBQUFBLE1BQzVCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHO0FBQUEsUUFDaEIsaUJBQWlCLElBQUksT0FBTyxJQUFJLEdBQUc7QUFBQSxRQUNuQyxNQUFNLE9BQU8sQ0FBQztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBO0FBQUEsRUFJRixlQUFlLE1BQU0sYUFBYyxRQUFnQyxJQUFJLENBQUMsQ0FBQztBQUFBLEVBRXpFLE1BQU0sUUFBUyxRQUFnQyxVQUFVLENBQUMsUUFBUSxNQUFNLEdBQUcsQ0FBQztBQUFBLEVBQzVFLFdBQVcsUUFBUSxLQUFLO0FBQUEsRUFFeEIsT0FBTztBQUFBO0FBR1Qsb0JBQW9CLENBQ2xCLFNBQ0EsT0FDQSxlQUNTLE9BQU8sU0FBUyxPQUFPLFVBQVUsQ0FBQzsiLAogICJkZWJ1Z0lkIjogIjA2RjE5REE4ODYwOThCMkI2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
