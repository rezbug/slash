import { describe, it, expect } from "bun:test";
import { Repeat } from "./repeat";
import type { Reactive } from "../types";

// Helper para criar signal mock
function createSignal<T>(initial: T): Reactive<T> & { set: (v: T) => void } {
  let value = initial;
  const subscribers = new Set<(v: T) => void>();

  return {
    get: () => value,
    subscribe: (fn: (v: T) => void) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    set: (newValue: T) => {
      value = newValue;
      subscribers.forEach((fn) => fn(value));
    },
  };
}

describe("rendering/repeat", () => {
  it("renderiza lista inicial", async () => {
    const container = document.createElement("div");
    const items = createSignal([1, 2, 3]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    // Espera microtask para montar
    await new Promise((resolve) => setTimeout(resolve, 10));

    const texts = Array.from(container.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== "")
      .map((n) => n.textContent);

    expect(texts).toEqual(["1", "2", "3"]);
  });

  it("adiciona items no final", async () => {
    const container = document.createElement("div");
    const items = createSignal([1, 2]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    await new Promise((resolve) => setTimeout(resolve, 10));

    items.set([1, 2, 3, 4]);

    const texts = Array.from(container.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== "")
      .map((n) => n.textContent);

    expect(texts).toEqual(["1", "2", "3", "4"]);
  });

  it("remove items", async () => {
    const container = document.createElement("div");
    const items = createSignal([1, 2, 3, 4]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    await new Promise((resolve) => setTimeout(resolve, 10));

    items.set([1, 3]);

    const texts = Array.from(container.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== "")
      .map((n) => n.textContent);

    expect(texts).toEqual(["1", "3"]);
  });

  it("reordena items mantendo keys", async () => {
    const container = document.createElement("div");
    const items = createSignal([1, 2, 3]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    await new Promise((resolve) => setTimeout(resolve, 10));

    items.set([3, 1, 2]);

    const texts = Array.from(container.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== "")
      .map((n) => n.textContent);

    expect(texts).toEqual(["3", "1", "2"]);
  });

  it("renderiza lista vazia", async () => {
    const container = document.createElement("div");
    const items = createSignal<number[]>([]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const texts = Array.from(container.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== "")
      .map((n) => n.textContent);

    expect(texts).toEqual([]);
  });

  it("adiciona marcadores de comentário", async () => {
    const container = document.createElement("div");
    const items = createSignal([1]);

    const anchor = Repeat(items, (x) => x, (x) => String(x));
    container.appendChild(anchor);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const comments = Array.from(container.childNodes).filter(
      (n) => n.nodeType === Node.COMMENT_NODE
    );

    // Deve ter pelo menos 2 comentários (start e end) por item
    expect(comments.length).toBeGreaterThanOrEqual(2);
  });
});
