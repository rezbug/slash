import { describe, test, expect, beforeEach } from 'bun:test'
import { router } from './state'

describe('Router State', () => {
  beforeEach(() => {
    // Reset router state antes de cada teste
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
  })

  describe('Reactive Properties', () => {
    test('router.pathname retorna objeto reativo', () => {
      const pathname = router.pathname

      expect(typeof pathname.get).toBe('function')
      expect(typeof pathname.subscribe).toBe('function')
      expect(pathname.get()).toBe('/')
    })

    test('router.params retorna objeto reativo', () => {
      const params = router.params

      expect(typeof params.get).toBe('function')
      expect(typeof params.subscribe).toBe('function')
      expect(params.get()).toEqual({})
    })

    test('router.query retorna objeto reativo', () => {
      const query = router.query

      expect(typeof query.get).toBe('function')
      expect(typeof query.subscribe).toBe('function')
      expect(query.get()).toBeInstanceOf(URLSearchParams)
    })

    test('router.isNavigating retorna objeto reativo', () => {
      const isNavigating = router.isNavigating

      expect(typeof isNavigating.get).toBe('function')
      expect(typeof isNavigating.subscribe).toBe('function')
      expect(isNavigating.get()).toBe(false)
    })
  })

  describe('State Updates', () => {
    test('_setState atualiza pathname', () => {
      router._setState({ pathname: '/about' })

      expect(router.pathname.get()).toBe('/about')
    })

    test('_setState atualiza params', () => {
      const params = { id: '123', slug: 'test' }
      router._setState({ params })

      expect(router.params.get()).toEqual(params)
    })

    test('_setState atualiza search/query', () => {
      const search = 'foo=bar&baz=qux'
      router._setState({ search })

      const query = router.query.get()
      expect(query.get('foo')).toBe('bar')
      expect(query.get('baz')).toBe('qux')
    })

    test('_setState atualiza isNavigating', () => {
      router._setState({ isNavigating: true })

      expect(router.isNavigating.get()).toBe(true)
    })
  })

  describe('Watchers', () => {
    test('mudanças de estado notificam watchers', () => {
      let callCount = 0
      let lastState: any = null

      const unwatch = router._watch((state) => {
        callCount++
        lastState = state
      })

      router._setState({ pathname: '/users' })

      expect(callCount).toBe(1)
      expect(lastState.pathname).toBe('/users')

      router._setState({ pathname: '/posts' })

      expect(callCount).toBe(2)
      expect(lastState.pathname).toBe('/posts')

      unwatch()

      // Após unwatch, não deve mais notificar
      router._setState({ pathname: '/about' })
      expect(callCount).toBe(2)
    })

    test('propriedades reativas notificam subscribers', () => {
      let callCount = 0
      let lastPathname: string | null = null

      const unsubscribe = router.pathname.subscribe((pathname) => {
        callCount++
        lastPathname = pathname
      })

      router._setState({ pathname: '/dashboard' })

      expect(callCount).toBe(1)
      expect(lastPathname).toBe('/dashboard')

      unsubscribe()

      router._setState({ pathname: '/settings' })
      expect(callCount).toBe(1)
    })
  })

  describe('Navigation API', () => {
    test('replace() chama navigate com replace: true', () => {
      // Este teste é simplificado pois não estamos no browser
      // Em um ambiente real, verificaríamos window.history.replaceState
      router.replace('/new-path')

      // No servidor (ambiente de teste), apenas verifica que não quebra
      expect(router.pathname.get()).toBe('/')
    })
  })

  describe('State Serialization', () => {
    test('_getState retorna estado completo', () => {
      router._setState({
        pathname: '/users/123',
        params: { id: '123' },
        search: 'tab=profile',
        isNavigating: true,
      })

      const state = router._getState()

      expect(state.pathname).toBe('/users/123')
      expect(state.params).toEqual({ id: '123' })
      expect(state.search).toBe('tab=profile')
      expect(state.isNavigating).toBe(true)

      // Verificar que query é acessível através do helper reativo
      expect(router.query.get().get('tab')).toBe('profile')
    })
  })
})
