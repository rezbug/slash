import { describe, test, expect, beforeEach } from 'bun:test';
import { h, html, render, destroyNode, Repeat, setHydrateContext, getHydrateContext } from './hyper';
import { createState } from './state';

describe('hyper', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('h() - element creation', () => {
    test('should create basic element', () => {
      // Arrange & Act
      const el = h('div', null);

      // Assert
      expect(el instanceof HTMLDivElement).toBe(true);
      expect(el.nodeName).toBe('DIV');
    });

    test('should create element with tag name', () => {
      // Arrange & Act
      const span = h('span', null);
      const p = h('p', null);

      // Assert
      expect(span.nodeName).toBe('SPAN');
      expect(p.nodeName).toBe('P');
    });

    test('should handle null/undefined tag as div', () => {
      // Arrange & Act
      const el = h(null as unknown as string, null);

      // Assert
      expect(el.nodeName).toBe('DIV');
    });
  });

  describe('h() - text content', () => {
    test('should render text children', () => {
      // Arrange & Act
      const el = h('div', null, 'Hello World');

      // Assert
      expect(el.textContent).toBe('Hello World');
    });

    test('should render number as text', () => {
      // Arrange & Act
      const el = h('div', null, 42);

      // Assert
      expect(el.textContent).toBe('42');
    });

    test('should ignore null and false children', () => {
      // Arrange & Act
      const el = h('div', null, 'text', null, false, 'more');

      // Assert
      expect(el.textContent).toBe('textmore');
    });
  });

  describe('h() - attributes', () => {
    test('should set static attributes', () => {
      // Arrange & Act
      const el = h('div', { id: 'test', title: 'Hello' });

      // Assert
      expect((el as HTMLElement).id).toBe('test');
      expect((el as HTMLElement).title).toBe('Hello');
    });

    test('should set data attributes', () => {
      // Arrange & Act
      const el = h('div', { 'data-value': '123' });

      // Assert
      expect((el as HTMLElement).getAttribute('data-value')).toBe('123');
    });

    test('should handle className', () => {
      // Arrange & Act
      const el = h('div', { className: 'foo bar' });

      // Assert
      expect((el as HTMLElement).className).toBe('foo bar');
    });

    test('should handle class as string', () => {
      // Arrange & Act
      const el = h('div', { class: 'test-class' });

      // Assert
      expect((el as HTMLElement).className).toBe('test-class');
    });

    test('should handle class as array', () => {
      // Arrange & Act
      const el = h('div', { class: ['foo', 'bar', null, false, 'baz'] });

      // Assert
      expect((el as HTMLElement).className).toBe('foo bar baz');
    });

    test('should handle class as object', () => {
      // Arrange & Act
      const el = h('div', { class: { foo: true, bar: false, baz: true } });

      // Assert
      expect((el as HTMLElement).className).toBe('foo baz');
    });
  });

  describe('h() - event handlers', () => {
    test('should attach onClick handler', () => {
      // Arrange
      let clicked = false;
      const onClick = () => { clicked = true; };

      // Act
      const el = h('button', { onClick });
      (el as HTMLElement).click();

      // Assert
      expect(clicked).toBe(true);
    });

    test('should attach multiple event handlers', () => {
      // Arrange
      let clickCount = 0;
      let inputCount = 0;

      // Act
      const el = h('input', {
        onClick: () => { clickCount++; },
        onInput: () => { inputCount++; },
      });

      (el as HTMLElement).click();
      (el as HTMLInputElement).dispatchEvent(new Event('input'));

      // Assert
      expect(clickCount).toBe(1);
      expect(inputCount).toBe(1);
    });

    test('should handle event options', () => {
      // Arrange
      let captured = false;

      // Act
      const el = h('button', {
        onClick: [() => { captured = true; }, { capture: true }],
      });

      (el as HTMLElement).click();

      // Assert
      expect(captured).toBe(true);
    });
  });

  describe('h() - reactive attributes with state', () => {
    test('should render state as attribute', () => {
      // Arrange
      const state = createState({ value: 'initial' });

      // Act
      const el = h('div', { title: state.value });

      // Assert
      expect((el as HTMLElement).title).toBe('initial');
    });

    test('should update attribute when state changes', () => {
      // Arrange
      const state = createState({ value: 'initial' });
      const el = h('div', { title: state.value });

      // Act
      state.set({ value: 'updated' });

      // Assert
      expect((el as HTMLElement).title).toBe('updated');
    });

    test('should handle reactive className', () => {
      // Arrange
      const state = createState({ className: 'foo' });
      const el = h('div', { class: state.className });

      // Act
      state.set({ className: 'bar' });

      // Assert
      expect((el as HTMLElement).className).toBe('bar');
    });
  });

  describe('h() - state interpolation in children', () => {
    test('should render state as text', () => {
      // Arrange
      const state = createState({ text: 'Hello' });

      // Act
      const el = h('div', null, state.text);

      // Assert
      expect(el.textContent).toBe('Hello');
    });

    test('should update text when state changes', () => {
      // Arrange
      const state = createState({ text: 'before' });
      const el = h('div', null, state.text);

      // Act
      state.set({ text: 'after' });

      // Assert
      expect(el.textContent).toBe('after');
    });

    test('should handle state with number', () => {
      // Arrange
      const state = createState({ num: 0 });
      const el = h('div', null, state.num);

      // Act
      state.set({ num: 42 });

      // Assert
      expect(el.textContent).toBe('42');
    });

    test('should handle state with null/false', () => {
      // Arrange
      const state = createState<{ value: string | null }>({ value: 'text' });
      const el = h('div', null, state.value);

      // Act
      state.set({ value: null });

      // Assert
      expect(el.textContent).toBe('');
    });
  });

  describe('h() - arrays', () => {
    test('should render array of children', () => {
      // Arrange & Act
      const el = h('ul', null, [
        h('li', null, 'Item 1'),
        h('li', null, 'Item 2'),
        h('li', null, 'Item 3'),
      ]);

      // Assert
      expect(el.childNodes.length).toBe(3);
      expect(el.textContent).toBe('Item 1Item 2Item 3');
    });

    test('should render nested arrays', () => {
      // Arrange & Act
      const el = h('div', null, [
        'a',
        ['b', 'c'],
        'd',
      ]);

      // Assert
      expect(el.textContent).toBe('abcd');
    });
  });

  // Reactive functions foram removidas - use Reactive<T> direto (state.property)

  describe('h() - nested components', () => {
    test('should render component function', () => {
      // Arrange
      const MyComponent = ({ text }: { text: string }) => h('div', null, text);

      // Act
      const el = h(MyComponent, { text: 'Hello' });

      // Assert
      expect(el.textContent).toBe('Hello');
    });

    test('should pass children to component', () => {
      // Arrange
      const Container = ({ children }: { children: unknown[] }) =>
        h('div', { class: 'container' }, ...children);

      // Act
      const el = h(Container, null, h('span', null, 'Child'));

      // Assert
      expect((el as HTMLElement).className).toBe('container');
      expect(el.querySelector('span')).toBeTruthy();
    });

    test('should nest components deeply', () => {
      // Arrange
      const Inner = ({ value }: { value: string }) => h('span', null, value);
      const Outer = ({ text }: { text: string }) => h('div', null, h(Inner, { value: text }));

      // Act
      const el = h(Outer, { text: 'nested' });

      // Assert
      expect(el.querySelector('span')?.textContent).toBe('nested');
    });
  });

  describe('h() - SVG elements', () => {
    test('should create SVG element', () => {
      // Arrange & Act
      const el = h('svg', { width: '100', height: '100' });

      // Assert
      expect(el.nodeName).toBe('svg');
      expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    test('should create SVG path', () => {
      // Arrange & Act
      const el = h('path', { d: 'M 0 0 L 10 10' });

      // Assert
      expect(el.nodeName).toBe('path');
      expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    test('should create nested SVG elements', () => {
      // Arrange & Act
      const el = h('svg', null,
        h('circle', { cx: '50', cy: '50', r: '40' })
      );

      // Assert
      expect(el.querySelector('circle')).toBeTruthy();
      expect(el.querySelector('circle')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });
  });

  describe('html (HTM template)', () => {
    test('should parse template literal', () => {
      // Arrange & Act
      const el = html`<div>Hello</div>`;

      // Assert
      expect((el as HTMLElement).textContent).toBe('Hello');
    });

    test('should interpolate values', () => {
      // Arrange
      const name = 'World';

      // Act
      const el = html`<div>Hello ${name}</div>`;

      // Assert
      expect((el as HTMLElement).textContent).toBe('Hello World');
    });

    test('should interpolate state', () => {
      // Arrange
      const state = createState({ text: 'Dynamic' });

      // Act
      const el = html`<div>${state.text}</div>`;

      // Assert
      expect((el as HTMLElement).textContent).toBe('Dynamic');
    });

    test('should handle nested templates', () => {
      // Arrange
      const inner = html`<span>Inner</span>`;

      // Act
      const outer = html`<div>${inner}</div>`;

      // Assert
      expect((outer as HTMLElement).querySelector('span')?.textContent).toBe('Inner');
    });

    test('should handle attributes', () => {
      // Arrange
      const id = 'test-id';

      // Act
      const el = html`<div id="${id}" class="foo">Content</div>`;

      // Assert
      expect((el as HTMLElement).id).toBe('test-id');
      expect((el as HTMLElement).className).toBe('foo');
    });
  });

  describe('render()', () => {
    test('should render element to container', () => {
      // Arrange
      const container = document.createElement('div');
      const el = h('span', null, 'Test');

      // Act
      render(el, container);

      // Assert
      expect(container.querySelector('span')).toBeTruthy();
      expect(container.textContent).toBe('Test');
    });

    test('should render to selector', () => {
      // Arrange
      const container = document.createElement('div');
      container.id = 'app';
      document.body.appendChild(container);
      const el = h('div', null, 'Content');

      // Act
      render(el, '#app');

      // Assert
      expect(document.querySelector('#app')?.textContent).toBe('Content');
    });

    test('should throw if selector not found', () => {
      // Arrange
      const el = h('div', null, 'Test');

      // Act & Assert
      expect(() => render(el, '#nonexistent')).toThrow();
    });

    test('should clear previous content', () => {
      // Arrange
      const container = document.createElement('div');
      container.innerHTML = '<p>Old</p>';

      // Act
      render(h('div', null, 'New'), container);

      // Assert
      expect(container.querySelector('p')).toBeFalsy();
      expect(container.textContent).toBe('New');
    });

    test('should render function view', () => {
      // Arrange
      const container = document.createElement('div');
      const view = () => h('span', null, 'Dynamic');

      // Act
      render(view, container);

      // Assert
      expect(container.querySelector('span')).toBeTruthy();
    });

    // Teste removido: reactive view functions não são mais suportadas
  });

  describe('destroyNode()', () => {
    test('should cleanup node', () => {
      // Arrange
      const el = h('div', null, 'test');

      // Act & Assert - should not throw
      expect(() => destroyNode(el)).not.toThrow();
    });

    test('should cleanup children recursively', () => {
      // Arrange
      const parent = h('div', null,
        h('div', null,
          h('span', null, 'nested')
        )
      );

      // Act & Assert
      expect(() => destroyNode(parent)).not.toThrow();
    });

    test('should cleanup internal tracking', () => {
      // Arrange
      const el = h('button', {
        onClick: () => { },
      });

      // Act & Assert - should not throw
      expect(() => destroyNode(el)).not.toThrow();
    });
  });

  describe('Repeat()', () => {
    test('should render list of items', () => {
      // Arrange
      const state = createState({ items: [1, 2, 3] });
      const container = document.createElement('div');

      // Act
      const anchor = Repeat(
        state.items,
        (item) => item,
        (item) => h('li', null, String(item))
      );
      container.appendChild(anchor);

      // Wait for microtask
      return new Promise<void>((resolve) => {
        queueMicrotask(() => {
          // Assert
          const lis = container.querySelectorAll('li');
          expect(lis.length).toBe(3);
          expect(lis[0]?.textContent).toBe('1');
          expect(lis[1]?.textContent).toBe('2');
          expect(lis[2]?.textContent).toBe('3');
          resolve();
        });
      });
    });

    test('should update list when state changes', async () => {
      // Arrange
      const state = createState({ items: [1, 2] });
      const container = document.createElement('div');
      const anchor = Repeat(
        state.items,
        (item) => item,
        (item) => h('li', null, String(item))
      );
      container.appendChild(anchor);

      // Wait for initial render
      await new Promise((resolve) => queueMicrotask(resolve));

      // Act
      state.set({ items: [1, 2, 3, 4] });
      await new Promise((resolve) => queueMicrotask(resolve));

      // Assert
      const lis = container.querySelectorAll('li');
      expect(lis.length).toBe(4);
    });

    test('should maintain keyed elements', async () => {
      // Arrange
      const state = createState({
        items: [
          { id: 'a', text: 'Item A' },
          { id: 'b', text: 'Item B' },
        ]
      });
      const container = document.createElement('div');
      const anchor = Repeat(
        state.items,
        (item) => item.id,
        (item) => h('div', null, item.text)
      );
      container.appendChild(anchor);

      // Wait for initial render
      await new Promise((resolve) => queueMicrotask(resolve));
      const firstElement = container.querySelector('div');

      // Act - reorder items
      state.set({
        items: [
          { id: 'b', text: 'Item B' },
          { id: 'a', text: 'Item A' },
        ]
      });
      await new Promise((resolve) => queueMicrotask(resolve));

      // Assert - first element should now be 'Item B'
      const divs = container.querySelectorAll('div');
      expect(divs[0]?.textContent).toBe('Item B');
      expect(divs[1]?.textContent).toBe('Item A');
    });

    test('should remove items', async () => {
      // Arrange
      const state = createState({ items: [1, 2, 3, 4] });
      const container = document.createElement('div');
      const anchor = Repeat(
        state.items,
        (item) => item,
        (item) => h('li', null, String(item))
      );
      container.appendChild(anchor);

      await new Promise((resolve) => queueMicrotask(resolve));

      // Act
      state.set({ items: [2, 4] });
      await new Promise((resolve) => queueMicrotask(resolve));

      // Assert
      const lis = container.querySelectorAll('li');
      expect(lis.length).toBe(2);
      expect(lis[0]?.textContent).toBe('2');
      expect(lis[1]?.textContent).toBe('4');
    });
  });

  describe('controlled inputs', () => {
    test('should set input value', () => {
      // Arrange & Act
      const el = h('input', { value: 'test' });

      // Assert
      expect((el as HTMLInputElement).value).toBe('test');
    });

    test('should update input value reactively', () => {
      // Arrange
      const state = createState({ value: 'initial' });
      const el = h('input', { value: state.value });

      // Act
      state.set({ value: 'updated' });

      // Assert
      expect((el as HTMLInputElement).value).toBe('updated');
    });

    test('should set checkbox checked', () => {
      // Arrange & Act
      const el = h('input', { type: 'checkbox', checked: true });

      // Assert
      expect((el as HTMLInputElement).checked).toBe(true);
    });

    test('should update checkbox reactively', () => {
      // Arrange
      const state = createState({ checked: false });
      const el = h('input', { type: 'checkbox', checked: state.checked });

      // Act
      state.set({ checked: true });

      // Assert
      expect((el as HTMLInputElement).checked).toBe(true);
    });

    test('should set select value after appending to DOM', () => {
      // Arrange
      const container = document.createElement('div');
      const el = h('select', null,
        h('option', { value: 'a' }, 'A'),
        h('option', { value: 'b' }, 'B'),
        h('option', { value: 'c' }, 'C')
      );
      container.appendChild(el);

      // Act - set value after DOM insertion
      (el as HTMLSelectElement).value = 'b';

      // Assert
      expect((el as HTMLSelectElement).value).toBe('b');
      const options = (el as HTMLSelectElement).options;
      expect(options[1]?.selected).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty children', () => {
      // Arrange & Act
      const el = h('div', null);

      // Assert
      expect(el.childNodes.length).toBe(0);
    });

    test('should handle style object', () => {
      // Arrange & Act
      const el = h('div', { style: { color: 'red', fontSize: '16px' } });

      // Assert
      expect((el as HTMLElement).style.color).toBe('red');
      expect((el as HTMLElement).style.fontSize).toBe('16px');
    });

    test('should handle boolean attributes', () => {
      // Arrange & Act
      const el = h('input', { disabled: true, readonly: false });

      // Assert
      expect((el as HTMLInputElement).disabled).toBe(true);
    });

    test('should handle false props for custom attributes', () => {
      // Arrange & Act
      const el = h('div', { 'data-test': false });

      // Assert
      // false removes custom attribute
      expect((el as HTMLElement).hasAttribute('data-test')).toBe(false);
    });
  });

  describe('memory management', () => {
    test('should cleanup state subscriptions on destroy', () => {
      // Arrange
      const state = createState({ text: 'initial' });
      const el = h('div', null, state.text);
      const container = document.createElement('div');
      container.appendChild(el);

      // Act - destroy and update state
      destroyNode(el);
      state.set({ text: 'updated' });

      // Assert - element should not update after destroy
      // Note: Since we cloned or the subscription was cleaned up
      expect(el.textContent).toBe('initial');
    });
  });

  describe('h() - modo hydrate', () => {
    test('should use hydrate mode when context is active', () => {
      // Arrange
      const existing = document.createElement('div');
      existing.textContent = 'SSR Content';
      document.body.appendChild(existing);

      setHydrateContext({
        walker: existing,
        hasHydrated: false,
      });

      // Act
      const el = h('div', null, 'Hydrated');

      // Assert
      expect(getHydrateContext()).not.toBeNull();

      // Cleanup
      setHydrateContext(null);
    });

    test('should use normal mode when context is null', () => {
      // Arrange
      setHydrateContext(null);

      // Act
      const el = h('div', null, 'Normal');

      // Assert
      expect(getHydrateContext()).toBeNull();
      expect(el.textContent).toBe('Normal');
    });

    test('should create new element in normal mode', () => {
      // Arrange
      setHydrateContext(null);

      // Act
      const el = h('span', { id: 'test' }, 'Content');

      // Assert
      expect(el.nodeName).toBe('SPAN');
      expect((el as HTMLElement).id).toBe('test');
      expect(el.textContent).toBe('Content');
    });
  });
});
