import { describe, test, expect } from 'bun:test'
import { matchRoute, parseParams, parseQuery, stringifyQuery, rankRoutes } from './matching'

describe('Route Matching', () => {
  describe('matchRoute', () => {
    test('rota exata', () => {
      const result = matchRoute('/about', '/about')

      expect(result).not.toBeNull()
      expect(result?.path).toBe('/about')
      expect(result?.params).toEqual({})
    })

    test('rota exata não match', () => {
      const result = matchRoute('/about', '/contact')

      expect(result).toBeNull()
    })

    test('rota com param único', () => {
      const result = matchRoute('/users/:id', '/users/123')

      expect(result).not.toBeNull()
      expect(result?.path).toBe('/users/:id')
      expect(result?.params).toEqual({ id: '123' })
    })

    test('rota com múltiplos params', () => {
      const result = matchRoute('/users/:id/:tab', '/users/456/profile')

      expect(result).not.toBeNull()
      expect(result?.path).toBe('/users/:id/:tab')
      expect(result?.params).toEqual({ id: '456', tab: 'profile' })
    })

    test('rota com param opcional presente', () => {
      const result = matchRoute('/users/:id?', '/users/789')

      expect(result).not.toBeNull()
      expect(result?.params).toEqual({ id: '789' })
    })

    test('rota com param opcional ausente', () => {
      const result = matchRoute('/users/:id?', '/users')

      expect(result).not.toBeNull()
      expect(result?.params).toEqual({})
    })

    test('wildcard captura tudo', () => {
      const result = matchRoute('/files/*', '/files/docs/report.pdf')

      expect(result).not.toBeNull()
      expect(result?.params).toEqual({ '*': 'docs/report.pdf' })
    })

    test('wildcard captura vazio', () => {
      const result = matchRoute('/files/*', '/files/')

      expect(result).not.toBeNull()
      expect(result?.params).toEqual({ '*': '' })
    })

    test('decodifica URI params', () => {
      const result = matchRoute('/search/:query', '/search/hello%20world')

      expect(result).not.toBeNull()
      expect(result?.params).toEqual({ query: 'hello world' })
    })

    test('não match se pathname tem segmentos extras', () => {
      const result = matchRoute('/users/:id', '/users/123/extra')

      expect(result).toBeNull()
    })
  })

  describe('parseParams', () => {
    test('extrai params corretamente', () => {
      const params = parseParams('/posts/:slug', '/posts/my-first-post')

      expect(params).toEqual({ slug: 'my-first-post' })
    })

    test('retorna null se não match', () => {
      const params = parseParams('/posts/:slug', '/users/123')

      expect(params).toBeNull()
    })
  })

  describe('parseQuery', () => {
    test('parseia query string com ?', () => {
      const query = parseQuery('?foo=bar&baz=qux')

      expect(query.get('foo')).toBe('bar')
      expect(query.get('baz')).toBe('qux')
    })

    test('parseia query string sem ?', () => {
      const query = parseQuery('foo=bar&baz=qux')

      expect(query.get('foo')).toBe('bar')
      expect(query.get('baz')).toBe('qux')
    })

    test('parseia query string vazia', () => {
      const query = parseQuery('')

      expect(query.toString()).toBe('')
    })

    test('parseia valores com encoding', () => {
      const query = parseQuery('name=John%20Doe&age=30')

      expect(query.get('name')).toBe('John Doe')
      expect(query.get('age')).toBe('30')
    })
  })

  describe('stringifyQuery', () => {
    test('serializa objeto para query string', () => {
      const result = stringifyQuery({ foo: 'bar', baz: 'qux' })

      expect(result).toBe('?foo=bar&baz=qux')
    })

    test('serializa valores numéricos', () => {
      const result = stringifyQuery({ page: 1, limit: 10 })

      expect(result).toBe('?page=1&limit=10')
    })

    test('serializa valores booleanos', () => {
      const result = stringifyQuery({ active: true, archived: false })

      expect(result).toBe('?active=true&archived=false')
    })

    test('retorna string vazia para objeto vazio', () => {
      const result = stringifyQuery({})

      expect(result).toBe('')
    })

    test('codifica valores especiais', () => {
      const result = stringifyQuery({ name: 'John Doe' })

      expect(result).toBe('?name=John+Doe')
    })
  })

  describe('rankRoutes', () => {
    test('rotas mais específicas têm score maior', () => {
      const routes = [
        { path: '/users/:id', params: {}, score: 0 },
        { path: '/users/admin', params: {}, score: 0 },
        { path: '/*', params: {}, score: 0 },
      ]

      // Calcular scores manualmente para o teste
      routes[0].score = 6 // /users (4) + :id (2)
      routes[1].score = 8 // /users (4) + admin (4)
      routes[2].score = 0 // /* (0)

      const ranked = rankRoutes(routes)

      expect(ranked[0].path).toBe('/users/admin')
      expect(ranked[1].path).toBe('/users/:id')
      expect(ranked[2].path).toBe('/*')
    })

    test('params opcionais têm score menor que obrigatórios', () => {
      const routes = [
        { path: '/users/:id?', params: {}, score: 5 }, // /users (4) + :id? (1)
        { path: '/users/:id', params: {}, score: 6 },  // /users (4) + :id (2)
      ]

      const ranked = rankRoutes(routes)

      expect(ranked[0].path).toBe('/users/:id')
      expect(ranked[1].path).toBe('/users/:id?')
    })
  })
})
