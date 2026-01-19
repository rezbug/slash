# Universal Rendering Guide

Este guia explica como usar as funcionalidades de renderização universal (isomórfica) do Slash.

## Visão Geral

Slash suporta três modos de renderização:

1. **Client-Side Rendering (CSR)** - Renderização apenas no cliente
2. **Server-Side Rendering (SSR)** - Renderização no servidor com hidratação no cliente
3. **Static Site Generation (SSG)** - Pré-renderização estática

## APIs Principais

### 1. Server-Side Rendering

#### `renderToString()`

Renderiza um componente para HTML string no servidor.

```typescript
import { renderToString } from 'slash';

const App = () => html`<div>Hello World</div>`;

const { html, state } = renderToString(() => App());
// html: "<div>Hello World</div>"
// state: {} (signals capturados)
```

#### `renderToStream()`

Renderiza componentes para um stream incremental (melhor performance para grandes apps).

```typescript
import { renderToStream } from 'slash';

async function handleRequest(req: Request): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of renderToStream(() => App())) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

#### `htmlString`

Template tag HTM para renderização no servidor (sem criar DOM).

```typescript
import { htmlString } from 'slash';

const Component = ({ name }) => htmlString`
  <div class="greeting">
    Hello, ${name}!
  </div>
`;
```

### 2. Client-Side Hydration

O método `render()` detecta automaticamente se deve hidratar ou renderizar do zero.

```typescript
import { render } from 'slash';

// Detecta automaticamente modo hydrate se houver:
// 1. Conteúdo pré-renderizado no container
// 2. Script tag <script id="__SLASH_STATE__">
render(() => App(), '#app');
```

**No servidor:**
```typescript
const { html, state } = renderToString(() => App());

const fullHtml = `
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app">${html}</div>
      <script id="__SLASH_STATE__" type="application/json">
        ${JSON.stringify(state)}
      </script>
      <script src="/client.js"></script>
    </body>
  </html>
`;
```

### 3. Data Fetching Universal

#### `createLoader()`

Cria loaders isomórficos que funcionam tanto no servidor quanto no cliente.

```typescript
import { createLoader } from 'slash';

const userLoader = createLoader(
  async ({ params, isServer }) => {
    const res = await fetch(`/api/users/${params.id}`);
    return res.json();
  },
  {
    key: 'user',
    ttl: 60000, // Cache de 60s no cliente
  }
);

// Usar em componente
function UserProfile({ userId }) {
  const [user, setUser] = createSignal(null);

  // Executar loader
  userLoader({
    params: { id: userId },
    isServer: typeof window === 'undefined',
  }).then(setUser);

  return html`
    <div>${() => user.get()?.name || 'Loading...'}</div>
  `;
}
```

#### `invalidateLoader()`

Invalida cache de loaders no cliente.

```typescript
import { invalidateLoader } from 'slash';

// Invalidar loader específico
invalidateLoader('user');

// Invalidar todos
invalidateLoader();
```

#### `hydrateLoaderCache()`

Injeta dados pré-carregados no cache do cliente durante hidratação.

```typescript
import { hydrateLoaderCache } from 'slash';

// No servidor, serializar dados
const loaderData = {
  'user:{"id":"123"}': { id: '123', name: 'João' },
};

// No cliente, hidratar
hydrateLoaderCache(loaderData);
```

### 4. Error Boundaries

#### `ErrorBoundary`

Componente para capturar erros durante renderização.

```typescript
import { ErrorBoundary } from 'slash';

const App = () => html`
  <${ErrorBoundary}
    fallback=${(error) => html`
      <div class="error">
        <h2>Algo deu errado</h2>
        <p>${error.message}</p>
      </div>
    `}
    onError=${(error, info) => {
      console.error('Error caught:', error);
      // Enviar para serviço de logging
    }}
  >
    <${ProblematicComponent} />
  <//>
`;
```

#### `useSafeAsync()`

Hook para executar operações assíncronas com error handling.

```typescript
import { useSafeAsync } from 'slash';

function DataComponent() {
  const [safeLoad, getError] = useSafeAsync(
    async () => {
      const res = await fetch('/api/data');
      return res.json();
    },
    (error) => console.error('Load failed:', error)
  );

  const [data, setData] = createSignal(null);

  safeLoad().then(setData);

  return html`
    <div>
      ${() => {
        const error = getError();
        if (error) return html`<p>Error: ${error.message}</p>`;
        return html`<pre>${JSON.stringify(data.get(), null, 2)}</pre>`;
      }}
    </div>
  `;
}
```

#### `setupGlobalErrorHandler()`

Configura handler global para erros não capturados.

```typescript
import { setupGlobalErrorHandler } from 'slash';

setupGlobalErrorHandler((error, source) => {
  console.error(`[${source}] Error:`, error);
  // Enviar para serviço de monitoramento
});
```

## Exemplo Completo: SSR + Hydration

### Servidor (`server.ts`)

```typescript
import { renderToString } from 'slash';
import { App } from './app';

async function handleRequest(req: Request): Promise<Response> {
  // Renderizar app no servidor
  const { html: appHtml, state } = renderToString(() => App());

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>My App</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="app">${appHtml}</div>
        <script id="__SLASH_STATE__" type="application/json">
          ${JSON.stringify(state)}
        </script>
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

Bun.serve({
  port: 3000,
  fetch: handleRequest,
});
```

### Cliente (`client.ts`)

```typescript
import { render } from 'slash';
import { App } from './app';

// render() detecta automaticamente o modo hydrate
render(() => App(), '#app');
```

### Componente (`app.ts`)

```typescript
import { html, createSignal, createLoader } from 'slash';

const dataLoader = createLoader(
  async ({ isServer }) => {
    const res = await fetch('/api/data');
    return res.json();
  },
  { key: 'appData', ttl: 30000 }
);

export function App() {
  const [count, setCount] = createSignal(0);
  const [data, setData] = createSignal(null);

  // Carregar dados
  dataLoader({
    params: {},
    isServer: typeof window === 'undefined',
  }).then(setData);

  return html`
    <div class="app">
      <h1>Universal App</h1>
      <button onClick=${() => setCount(count.get() + 1)}>
        Count: ${count}
      </button>
      <pre>${() => JSON.stringify(data.get(), null, 2)}</pre>
    </div>
  `;
}
```

## Boas Práticas

### 1. Detecção de Ambiente

Use `typeof window === 'undefined'` ou `isServer()` para detectar ambiente:

```typescript
import { isServer } from 'slash';

if (isServer()) {
  // Código apenas servidor
} else {
  // Código apenas cliente
}
```

### 2. Data Fetching

- Use `createLoader()` para código compartilhado
- No servidor, sempre busque dados frescos
- No cliente, use cache com TTL apropriado

```typescript
const loader = createLoader(fetchData, {
  key: 'myData',
  ttl: isProduction ? 60000 : 0, // 60s em prod, 0 em dev
});
```

### 3. Error Handling

- Sempre use `ErrorBoundary` em pontos críticos
- No servidor, capture erros para não quebrar o processo
- No cliente, mostre feedback amigável ao usuário

```typescript
const App = () => html`
  <${ErrorBoundary} fallback=${ErrorFallback}>
    <${CriticalFeature} />
  <//>
`;
```

### 4. Performance

- Use `renderToStream()` para apps grandes
- Minimize dados no `__SLASH_STATE__`
- Pré-carregue apenas dados críticos

```typescript
// Bom: dados mínimos
const state = { userId: '123' };

// Ruim: dados excessivos
const state = { allUsers: [...], allPosts: [...] };
```

## Debugging

### Verificar Modo de Renderização

```typescript
import { render } from 'slash';

// Adicione logs para debug
const originalRender = render;
render = (view, container) => {
  console.log('[slash] Render mode:',
    document.getElementById('__SLASH_STATE__') ? 'hydrate' : 'client'
  );
  return originalRender(view, container);
};
```

### Inspecionar Estado de Hidratação

```typescript
// No console do navegador
const state = document.getElementById('__SLASH_STATE__');
console.log('Hydration state:', JSON.parse(state?.textContent || '{}'));
```

## Migração de CSR para SSR

1. **Substitua `html` por `htmlString` no servidor:**
```typescript
// Antes
const Component = () => html`<div>...</div>`;

// Depois (servidor)
const Component = () => htmlString`<div>...</div>`;

// Cliente (sem mudanças)
const Component = () => html`<div>...</div>`;
```

2. **Adicione detecção de ambiente:**
```typescript
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // Código específico do browser
}
```

3. **Use loaders universais:**
```typescript
// Antes
const data = await fetch('/api/data').then(r => r.json());

// Depois
const dataLoader = createLoader(
  async () => fetch('/api/data').then(r => r.json()),
  { key: 'data' }
);
```

4. **Configure servidor:**
```typescript
import { renderToString } from 'slash';

const { html, state } = renderToString(() => App());
// Injetar html e state na resposta
```

## Recursos Adicionais

- [Exemplos SSR](../slash-ssr/)
- [Exemplos SPA](../slash-spa/)
- [Guia de Routing](./ROUTER.md)
- [Guia de Scripts](./SCRIPTS.md)
