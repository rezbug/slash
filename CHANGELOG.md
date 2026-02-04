# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.3.0] — 2026-02-03

### Features

#### 🎯 Code Splitting & Subpath Exports
- **New optimized subpath exports** for granular imports:
  - `@ezbug/slash/core` — Core minimal bundle (~0.60 KB brotli, ~4.88 KB with chunks)
  - `@ezbug/slash/router` — Router module isolated from core
  - `@ezbug/slash/ssr` — Server-side rendering utilities
  - `@ezbug/slash/forms` — Form helpers
  - `@ezbug/slash` — Full bundle (backwards compatible)

#### 📦 Bundle Size Optimization
- **~67% reduction** in core bundle size (~10 KB → ~5 KB gzip)
- Automatic **Brotli compression** (quality 11) + Gzip (level 9)
- Compressed artifacts (.br, .gz) generated automatically on build
- Size statistics table showing original, gzip, and brotli sizes

#### 🔧 Build System Improvements
- Entry points use temporary files to avoid relative '../' imports
- Chunk splitting enabled to share common code between modules
- Aggressive minification (whitespace, syntax, identifiers)
- Console/debugger statements dropped in production
- External source maps with correct references

#### ✅ Quality Assurance
- Automated bundle size tests:
  - Core bundle ≤ 5 KB brotli ✅
  - Core bundle ≤ 6 KB gzip ✅
  - Full bundle ≤ 12 KB gzip ✅
- Validation in slash-spa (~9.6 KB brotli)
- Validation in slash-ssr (~6.1 KB brotli)

### Migration Guide

**Recommended:** Update imports to use optimized subpaths for smaller bundles:

```typescript
// Before (still works)
import { html, render, createState, Router } from "@ezbug/slash";

// After (optimized - recommended)
import { html, render, createState } from "@ezbug/slash/core";
import { Router, createRouter } from "@ezbug/slash/router";
import { renderToString } from "@ezbug/slash/ssr";
```

**No breaking changes** — existing code continues to work without modifications.

### Performance

- **Core bundle**: 0.60 KB (brotli) | 0.70 KB (gzip) — standalone
- **Core with chunks**: 4.88 KB (brotli) | 5.53 KB (gzip)
- **Router overhead**: ~2.5 KB (brotli) when added to core
- **SSR overhead**: ~1.6 KB (brotli) when added to core
- **Forms overhead**: ~0.7 KB (brotli) when added to core

---

## [0.2.0](https://github.com/vaziu/slash/compare/v0.1.0...v0.2.0) (2025-09-18)


### Features

* **signals:** add ReadonlyListSignal and asReadonlyList ([afc4077](https://github.com/vaziu/slash/commit/afc40777e17753189660c614cd02b00a0579939d))

## [0.1.0] — 2025-09-16

### Highlights
- **Tiny, reactive UI runtime**: HTM + lightweight hyperscript, **no VDOM**.
- **Deterministic keyed updates** with `Repeat(...)` that move DOM blocks instead of re-creating them.
- **Type-safe events** and **CSS Modules–friendly** class handling.
- **DX first**: strings, arrays, and signals all work directly in templates and props.

---

### Added
- **Templating & Components**
  - `html` tagged template (via `htm.bind(h)`) and a minimal `h(tag, props, ...children)` runtime.
  - **Function components**: call with props + `children`; may return a `Node`, a `Child` union (string/signal/array), or multiple nodes (packed into a `DocumentFragment` automatically).

- **Reactivity**
  - `createSignal<T>(initial)` — minimal, synchronous signal with `get/set/subscribe`.
  - `computed(fn)` — memoized derivations that re-run precisely when their dependencies change.
  - **Reactive props/children**: any prop value or template interpolation can be a signal; text nodes update in place.

- **Events**
  - Case-insensitive `onXxx` props (e.g., `onClick` **or** `onclick`).
  - Optional sugar: `[handler, options]` where `options` is `boolean | AddEventListenerOptions` (e.g., `{ once: true }`).
  - **Automatic cleanup**: listeners are removed when nodes are destroyed.

- **Class & Style ergonomics**
  - `class` / `className` accept:
    - `string`
    - `string[]` (joined with spaces)
    - `{ [className]: boolean }` maps (truthy keys included)
  - `style` accepts a plain object (merged via `Object.assign`).

- **Rendering**
  - `render(view, container)` accepts a single node, **multiple nodes**, strings, arrays, or signals; returns the mounted `Node | Node[]`.
  - Previous subtree is cleaned via `destroyNode` so event listeners/subscriptions don't leak.

- **Lists**
  - `Repeat(listSignal, keyOf, renderItem)` — keyed diff using comment sentinels (`<!--repeat:start--> … <!--repeat:end-->`):
    - Supports **multiple nodes per item**.
