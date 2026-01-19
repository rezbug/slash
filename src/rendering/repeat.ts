import { addCleanup, destroyNode } from "../lifecycle/cleanup";
import type { Child, Key, Reactive } from "../types";
import { appendChildSmart } from "./children";

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
  item: T,
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
  listSig: Reactive<T[]>,
  keyOf: (item: T) => Key,
  renderItem: RenderItem<T>,
): Node | string {
  // SSR mode: retornar string
  if (typeof document === "undefined") {
    // Import dinâmico para evitar ciclo
    const { Repeat: RepeatString } = require("../server-render");
    return RepeatString(listSig, keyOf, renderItem);
  }

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
  queueMicrotask(() => mountInitial(listSig.get()));

  const unsub = listSig.subscribe((arr) => patch(arr));
  addCleanup(anchor, unsub);

  return anchor;
}
