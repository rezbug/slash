import { describe, test, expect, beforeEach } from 'bun:test'
import { createState } from './state'
import { html, render } from './hyper'

describe('createState', () => {
  test('should create state with initial value', () => {
    const state = createState({ count: 0 })
    expect(state.get()).toEqual({ count: 0 })
  })

  test('should update state synchronously', () => {
    const state = createState({ count: 0 })
    state.set({ count: 5 })
    expect(state.get()).toEqual({ count: 5 }) // SÍNCRONO ✅
  })

  test('should notify watchers synchronously', () => {
    const state = createState({ count: 0 })
    let notified: number | undefined

    state.watch(s => { notified = s.count })
    state.set({ count: 10 })

    expect(notified).toBe(10) // SÍNCRONO ✅
  })

  test('should return cleanup function from watch', () => {
    const state = createState({ count: 0 })
    let callCount = 0

    const unwatch = state.watch(() => { callCount++ })

    state.set({ count: 1 })
    expect(callCount).toBe(1)

    unwatch() // Cleanup

    state.set({ count: 2 })
    expect(callCount).toBe(1) // Não foi notificado ✅
  })

  test('should support functional updates', () => {
    const state = createState({ count: 5 })
    state.set(prev => ({ count: prev.count + 1 }))
    expect(state.get().count).toBe(6)
  })

  test('should not notify if value is the same', () => {
    const state = createState({ count: 0 })
    let callCount = 0

    state.watch(() => { callCount++ })

    state.set({ count: 0 }) // Mesmo valor
    expect(callCount).toBe(0) // Não notificou ✅
  })
})

describe('createState - property access', () => {
  test('should support direct property access', () => {
    const state = createState({ count: 0 })
    const countSignal = state.count

    expect(countSignal.get()).toBe(0)
    expect(typeof countSignal.subscribe).toBe('function')
  })

  test('should update property signal when state changes', () => {
    const state = createState({ count: 0 })
    let value: number | undefined

    state.count.subscribe(v => { value = v })
    state.set({ count: 42 })

    expect(value).toBe(42)
  })

  test('should work with nested properties', () => {
    const state = createState({ user: { name: 'John', age: 30 } })

    expect(state.user.get()).toEqual({ name: 'John', age: 30 })
  })
})

describe('createState - hyper.ts integration', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('should auto-rerender on state change', () => {
    const state = createState({ count: 0 })
    const container = document.createElement('div')

    render(html`<div>${state.count}</div>`, container)
    expect(container.textContent).toBe('0')

    state.set({ count: 42 })
    expect(container.textContent).toBe('42')
  })

  test('should work with multiple states', () => {
    const counter = createState({ count: 0 })
    const user = createState({ name: 'John' })
    const container = document.createElement('div')

    render(html`<div>${counter.count} - ${user.name}</div>`, container)
    expect(container.textContent).toBe('0 - John')

    counter.set({ count: 5 })
    expect(container.textContent).toBe('5 - John')

    user.set({ name: 'Jane' })
    expect(container.textContent).toBe('5 - Jane')
  })

  test('should work with reactive props', () => {
    const state = createState({ className: 'active' })
    const container = document.createElement('div')

    render(html`<div class=${state.className}>Content</div>`, container)

    const div = container.querySelector('div')!
    expect(div.className).toBe('active')

    state.set({ className: 'inactive' })
    expect(div.className).toBe('inactive')
  })

  test('should cleanup subscriptions when element is removed', () => {
    const state = createState({ count: 0 })
    const container = document.createElement('div')

    render(html`<div>${state.count}</div>`, container)

    container.innerHTML = ''

    state.set({ count: 100 })
  })
})
