import { describe, test, expect, beforeEach } from 'bun:test'
import { Link } from './Link'
import { router } from './state'

describe('Link Component', () => {
  beforeEach(() => {
    // Reset router state
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
  })

  describe('SSR Mode', () => {
    test('renderiza <a> normal', () => {
      const result = Link({
        to: '/about',
        children: 'About',
      })

      // Como estamos em ambiente de teste (SSR), deve retornar string HTML
      expect(typeof result).toBe('string')
      expect(result).toContain('href="/about"')
      expect(result).toContain('About')
    })

    test('aplica active class quando rota ativa', () => {
      router._setState({ pathname: '/about' })

      const result = Link({
        to: '/about',
        children: 'About',
      })

      expect(result).toContain('active')
    })

    test('usa activeClass customizada', () => {
      router._setState({ pathname: '/about' })

      const result = Link({
        to: '/about',
        children: 'About',
        activeClass: 'current',
      })

      expect(result).toContain('current')
    })

    test('não aplica active class quando rota não ativa', () => {
      router._setState({ pathname: '/home' })

      const result = Link({
        to: '/about',
        children: 'About',
      })

      // Não deve conter 'active'
      expect(result).not.toContain('active')
    })

    test('aplica class prop', () => {
      const result = Link({
        to: '/about',
        children: 'About',
        class: 'nav-link',
      })

      expect(result).toContain('nav-link')
    })

    test('combina class e activeClass', () => {
      router._setState({ pathname: '/about' })

      const result = Link({
        to: '/about',
        children: 'About',
        class: 'nav-link',
        activeClass: 'current',
      })

      expect(result).toContain('nav-link')
      expect(result).toContain('current')
    })
  })

  describe('Active State', () => {
    test('considera ativo quando pathname match exato', () => {
      router._setState({ pathname: '/users' })

      const result = Link({
        to: '/users',
        children: 'Users',
      })

      expect(result).toContain('active')
    })

    test('ignora query string ao determinar active state', () => {
      router._setState({ pathname: '/search' })

      const result = Link({
        to: '/search?q=test',
        children: 'Search',
      })

      expect(result).toContain('active')
    })

    test('não considera ativo quando pathname diferente', () => {
      router._setState({ pathname: '/about' })

      const result = Link({
        to: '/contact',
        children: 'Contact',
      })

      expect(result).not.toContain('active')
    })
  })
})
