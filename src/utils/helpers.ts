import type { Reactive } from "../types";

export function toStr(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v : String(v);
}

export function processClassValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.filter(Boolean).join(" ");
  if (typeof val === "object" && val !== null) {
    return Object.entries(val)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(" ");
  }
  return "";
}

/**
 * Mapeia um Reactive<T[]> aplicando uma função, mantendo a reatividade.
 * O resultado é um Reactive<R[]> que atualiza automaticamente quando o array original muda.
 */
export function mapReactive<T, R>(
  source: Reactive<T[]>,
  mapper: (item: T, index: number) => R,
): Reactive<R[]> {
  return {
    get: () => source.get().map(mapper),
    subscribe: (fn: (v: R[]) => void) => {
      return source.subscribe((arr) => fn(arr.map(mapper)));
    },
  };
}
