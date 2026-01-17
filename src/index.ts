// src/index.ts
export { html, html as tsx, html as jsx, h, render, Repeat, destroyNode } from "./hyper";
export { createSignal, createSignalArray, effect, computed, memo } from "./signals";
export * from "./components";

// SSR exports
export { renderToString, htmlString } from "./server-render";
export { hydrate } from "./hydrate";

// Reexporte TIPOS num único lugar (DX + sem ciclos)
export type {
  Key, Elementish, Child, Props,
  EventOptions, EventHandler, EventTuple,
  HTMTemplate, HTMModule,
  Signal, ReadonlySignal, SignalArray, ReadonlySignalArray,
  Renderer
} from "./types";

export * from "./forms"


