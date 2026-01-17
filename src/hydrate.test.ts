import { test, expect, beforeEach } from "bun:test";
import { html, render } from "./hyper";
import { createSignal } from "./signals";
import { renderToString, htmlString } from "./server-render";

// Happy DOM é configurado via bunfig.toml - apenas limpamos o DOM entre testes
beforeEach(() => {
  document.body.innerHTML = "";
});

test("Teste 1: Hydrate de botão simples com onClick", () => {
  // 1. Renderizar no servidor
  const clickHandler = () => console.log("clicked");
  const serverView = () => htmlString`<button onClick=${clickHandler}>Click me</button>`;

  const { html: serverHtml, state } = renderToString(serverView);

  // 2. Simular HTML do servidor no DOM
  const container = document.createElement("div");
  container.id = "app";
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  // 3. Injetar estado no DOM
  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.type = "application/json";
  stateScript.textContent = JSON.stringify(state);
  document.body.appendChild(stateScript);

  // 4. Verificar HTML inicial
  expect(container.innerHTML).toBe("<button>Click me</button>");

  // 5. Hidratar (render detecta automaticamente)
  let clicked = false;
  const clientView = () => html`<button onClick=${() => { clicked = true; }}>Click me</button>`;
  render(clientView, container);

  // 6. Validar que DOM não foi recriado
  expect(container.innerHTML).toBe("<button>Click me</button>");

  // 7. Validar que onClick funciona
  const button = container.querySelector("button")!;
  button.click();
  expect(clicked).toBe(true);

  // 8. Validar que script de estado foi removido
  expect(document.getElementById("__SLASH_STATE__")).toBeNull();
});

test("Teste 2: Hydrate com signal interpolado", () => {
  // 1. Renderizar no servidor
  const count = createSignal(5);
  const serverView = () => htmlString`<span>${count}</span>`;

  const { html: serverHtml, state } = renderToString(serverView);

  // 2. Simular HTML do servidor
  const container = document.createElement("div");
  container.id = "app";
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  // 3. Injetar estado
  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.type = "application/json";
  stateScript.textContent = JSON.stringify(state);
  document.body.appendChild(stateScript);

  // 4. Verificar HTML inicial (com marcadores de signal)
  expect(container.innerHTML).toContain("5");
  expect(container.innerHTML).toContain("signal-start:");
  expect(container.innerHTML).toContain("signal-end:");

  // 5. Hidratar
  const clientCount = createSignal(0); // Valor inicial será sobrescrito
  const clientView = () => html`<span>${clientCount}</span>`;
  render(clientView, container);

  // 6. Validar que DOM não foi recriado
  expect(container.innerHTML).toContain("5");

  // 7. Validar que signal funciona após hidratação
  clientCount.set(10);

  // Aguardar atualização reativa
  setTimeout(() => {
    expect(container.textContent).toContain("10");
  }, 10);
});

test("Teste 3: SPA puro (sem SSR)", () => {
  // 1. Container vazio (sem HTML do servidor)
  const container = document.createElement("div");
  container.id = "app";
  document.body.appendChild(container);

  // 2. Renderizar normalmente
  const count = createSignal(0);
  const view = () => html`<button onClick=${() => count.set(c => c + 1)}>${count}</button>`;

  render(view, container);

  // 3. Validar que DOM foi criado
  expect(container.querySelector("button")).not.toBeNull();
  expect(container.textContent).toContain("0");

  // 4. Validar que onClick funciona
  const button = container.querySelector("button")!;
  button.click();

  // Aguardar atualização reativa
  setTimeout(() => {
    expect(container.textContent).toContain("1");
  }, 10);
});

test("Teste 4: Componentes aninhados", () => {
  // 1. Definir componentes
  function Counter() {
    const count = createSignal(0);
    return htmlString`
      <div class="counter">
        <button onClick=${() => count.set(c => c + 1)}>+</button>
        <span>${count}</span>
      </div>
    `;
  }

  function App() {
    return htmlString`
      <main>
        <h1>App</h1>
        <${Counter} />
      </main>
    `;
  }

  // 2. SSR
  const { html: serverHtml, state } = renderToString(() => App());

  // 3. Setup DOM
  const container = document.createElement("div");
  container.id = "app";
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.type = "application/json";
  stateScript.textContent = JSON.stringify(state);
  document.body.appendChild(stateScript);

  // 4. Hidratar
  render(() => App(), container);

  // 5. Validar estrutura
  expect(container.querySelector("main")).not.toBeNull();
  expect(container.querySelector("h1")?.textContent).toBe("App");
  expect(container.querySelector(".counter")).not.toBeNull();
  expect(container.querySelector("button")?.textContent).toBe("+");

  // 6. Validar que onClick funciona
  const button = container.querySelector("button")!;
  button.click();

  setTimeout(() => {
    expect(container.querySelector("span")?.textContent).toContain("1");
  }, 10);
});

test("Teste 5: Múltiplos signals", () => {
  // 1. Componente com múltiplos signals
  const name = createSignal("John");
  const age = createSignal(25);

  const serverView = () => htmlString`
    <div>
      <p>Name: ${name}</p>
      <p>Age: ${age}</p>
    </div>
  `;

  // 2. SSR
  const { html: serverHtml, state } = renderToString(serverView);

  // 3. Setup DOM
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.type = "application/json";
  stateScript.textContent = JSON.stringify(state);
  document.body.appendChild(stateScript);

  // 4. Hidratar
  const clientName = createSignal("");
  const clientAge = createSignal(0);

  const clientView = () => html`
    <div>
      <p>Name: ${clientName}</p>
      <p>Age: ${clientAge}</p>
    </div>
  `;

  render(clientView, container);

  // 5. Validar valores iniciais
  expect(container.textContent).toContain("John");
  expect(container.textContent).toContain("25");

  // 6. Atualizar signals
  clientName.set("Jane");
  clientAge.set(30);

  setTimeout(() => {
    expect(container.textContent).toContain("Jane");
    expect(container.textContent).toContain("30");
  }, 10);
});

test("Teste 6: Hydrate preserva DOM do servidor (zero flash)", () => {
  // 1. SSR
  const serverView = () => htmlString`
    <div>
      <h1>Title</h1>
      <p>Paragraph</p>
      <button>Action</button>
    </div>
  `;

  const { html: serverHtml, state } = renderToString(serverView);

  const clientView = () => html`
    <div>
      <h1>Title</h1>
      <p>Paragraph</p>
      <button>Action</button>
    </div>
  `;

  // 2. Setup DOM
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  // Guardar referências aos elementos originais
  const originalH1 = container.querySelector("h1");
  const originalP = container.querySelector("p");
  const originalButton = container.querySelector("button");

  // 3. Injetar estado
  const stateScript = document.createElement("script");
  stateScript.id = "__SLASH_STATE__";
  stateScript.textContent = JSON.stringify(state);
  document.body.appendChild(stateScript);

  // 4. Hidratar
  render(clientView, container);

  // 5. Validar que são os MESMOS elementos (não foram recriados)
  expect(container.querySelector("h1")).toBe(originalH1);
  expect(container.querySelector("p")).toBe(originalP);
  expect(container.querySelector("button")).toBe(originalButton);
});
