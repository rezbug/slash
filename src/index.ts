// src/index.ts

export * from "./components";
export {
  ErrorBoundary,
  safeRender,
  setupGlobalErrorHandler,
  catchAsync,
} from "./error-boundary";
export * from "./forms";
export { destroyNode, h, html, html as tsx, html as jsx, render } from "./hyper";
export * from "./router";
// SSR exports
export { htmlString, renderToStream, renderToString } from "./server-render";
export { createState } from "./state";
export { batch } from "./batch";

// Developer Experience - Warnings & Error Messages (optional, for advanced debugging)
export {
  setDevMode,
  setWarningsEnabled,
  setErrorsThrow,
  isDevMode,
  isWarningsEnabled,
} from "./dev-warnings";

// Reexporte TIPOS num único lugar (DX + sem ciclos)
export type {
  Child,
  Elementish,
  ErrorBoundaryProps,
  EventHandler,
  EventOptions,
  EventTuple,
  HTMModule,
  HTMTemplate,
  Key,
  LoaderContext,
  LoaderFunction,
  Props,
  Reactive,
  Renderer,
  RenderMode,
  State,
  StreamChunk,
  UniversalRenderOptions,
} from "./types";
// Universal rendering exports
export {
  createLoader,
  deserializeLoaderData,
  hydrateLoaderCache,
  invalidateLoader,
  isServer,
  serializeLoaderData,
} from "./universal-loader";
