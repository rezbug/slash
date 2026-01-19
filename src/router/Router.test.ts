import { describe, test, expect, beforeEach } from 'bun:test'
import { Router } from './Router'
import { router } from './state'

describe('Router Component', () => {
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
    test('usa location prop', () => {
      Router({
        location: '/about',
        children: () => 'test content',
      })

      expect(router.pathname.get()).toBe('/about')
      expect(router.query.get().toString()).toBe('')
    })

    test('parseia query string da location', () => {
      Router({
        location: '/search?q=test&page=2',
        children: () => 'test content',
      })

      expect(router.pathname.get()).toBe('/search')
      expect(router.query.get().get('q')).toBe('test')
      expect(router.query.get().get('page')).toBe('2')
    })

    test('renderiza children', () => {
      const result = Router({
        location: '/test',
        children: () => 'test content',
      })

      expect(result).toBe('test content')
    })
  })

  describe('State Management', () => {
    test('estado é acessível via router singleton', () => {
      Router({
        location: '/users/123?tab=profile',
        children: () => 'content',
      })

      expect(router.pathname.get()).toBe('/users/123')
      expect(router.query.get().get('tab')).toBe('profile')
    })

    test('location sem query string funciona', () => {
      Router({
        location: '/home',
        children: () => 'content',
      })

      expect(router.pathname.get()).toBe('/home')
      expect(router.query.get().toString()).toBe('')
    })

    test('location vazia usa /', () => {
      Router({
        location: '',
        children: () => 'content',
      })

      expect(router.pathname.get()).toBe('/')
    })
  })
})
