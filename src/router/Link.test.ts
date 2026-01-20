import { describe, test, expect, beforeEach } from 'bun:test'
import { Link } from './Link'
import { router } from './state'
import { html, render } from '../hyper'

describe('Link Component', () => {
  beforeEach(() => {
    // Reset router state
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
    // Limpar o DOM
    document.body.innerHTML = ''
  })

  describe('Renderização', () => {
    test('renderiza elemento <a>', () => {
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
      })

      container.appendChild(result as Node)

      const anchor = container.querySelector('a')
      expect(anchor).toBeTruthy()
      expect(anchor?.href).toContain('/about')
      expect(anchor?.textContent).toBe('About')
    })

    test('aplica active class quando rota ativa', () => {
      router._setState({ pathname: '/about' })
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('active')
    })

    test('usa activeClass customizada', () => {
      router._setState({ pathname: '/about' })
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
        activeClass: 'current',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('current')
    })

    test('não aplica active class quando rota não ativa', () => {
      router._setState({ pathname: '/home' })
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).not.toContain('active')
    })

    test('aplica class prop', () => {
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
        class: 'nav-link',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('nav-link')
    })

    test('combina class e activeClass', () => {
      router._setState({ pathname: '/about' })
      const container = document.createElement('div')
      const result = Link({
        to: '/about',
        children: 'About',
        class: 'nav-link',
        activeClass: 'current',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('nav-link')
      expect(anchor?.className).toContain('current')
    })
  })

  describe('Active State', () => {
    test('considera ativo quando pathname match exato', () => {
      router._setState({ pathname: '/users' })
      const container = document.createElement('div')
      const result = Link({
        to: '/users',
        children: 'Users',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('active')
    })

    test('ignora query string ao determinar active state', () => {
      router._setState({ pathname: '/search' })
      const container = document.createElement('div')
      const result = Link({
        to: '/search?q=test',
        children: 'Search',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).toContain('active')
    })

    test('não considera ativo quando pathname diferente', () => {
      router._setState({ pathname: '/about' })
      const container = document.createElement('div')
      const result = Link({
        to: '/contact',
        children: 'Contact',
      })

      container.appendChild(result as Node)
      const anchor = container.querySelector('a')

      expect(anchor?.className).not.toContain('active')
    })
  })

  describe('CSR Mode - onClick Navigation', () => {
    test('deve interceptar click e navegar usando router', () => {
      // Arrange
      const container = document.createElement('div')
      document.body.appendChild(container)

      // Renderizar Link no modo CSR
      const linkElement = html`<${Link} to="/about">About</${Link}>`
      render(linkElement, container)

      const anchor = container.querySelector('a')
      expect(anchor).toBeTruthy()
      expect(anchor?.href).toContain('/about')

      // Act - Simular click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
      anchor?.dispatchEvent(clickEvent)

      // Assert - Router deve ter navegado
      expect(router.pathname.get()).toBe('/about')
    })

    test('deve prevenir comportamento padrão do link', () => {
      // Arrange
      const container = document.createElement('div')
      document.body.appendChild(container)

      const linkElement = html`<${Link} to="/test">Test</${Link}>`
      render(linkElement, container)

      const anchor = container.querySelector('a')

      // Act
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
      const prevented = !anchor?.dispatchEvent(clickEvent)

      // Assert - Evento deve ter sido prevenido
      expect(prevented).toBe(true)
    })
  })
})
