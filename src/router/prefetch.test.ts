import { describe, expect, test, beforeEach, afterEach, mock } from 'bun:test'
import {
  prefetch,
  registerRoute,
  clearPrefetchCache,
  isPrefetched,
  type PrefetchRoute,
} from './prefetch'
import { clearLazyCache, type LazyImport } from './lazy'
import { clearLoaderCache } from './loaders'

describe('Router - Prefetch', () => {
  beforeEach(() => {
    clearPrefetchCache()
    clearLazyCache()
    clearLoaderCache()
  })

  afterEach(() => {
    clearPrefetchCache()
    clearLazyCache()
    clearLoaderCache()
  })

  describe('registerRoute', () => {
    test('registra rota para prefetching', () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))

      registerRoute('/users', { component })

      // Validação indireta: prefetch não deve dar erro
      prefetch('/users', { delay: 0 })
    })

    test('registra rota com loader', () => {
      const loader = mock(async () => ({ data: 'test' }))

      registerRoute('/users', { loader })

      prefetch('/users', { delay: 0 })
    })
  })

  describe('prefetch', () => {
    test('é noop no servidor', () => {
      // No ambiente de testes Bun, window existe via HappyDOM
      // Mas a implementação usa typeof window === 'undefined'
      // que será false. Então este teste valida que a função
      // não quebra quando chamada no servidor (sem fazer nada)

      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/test', { component })

      // Não deve quebrar
      prefetch('/test')

      expect(component).not.toHaveBeenCalled()
    })

    test('debounce múltiplas chamadas', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      // Múltiplas chamadas rápidas
      prefetch('/users', { delay: 100 })
      prefetch('/users', { delay: 100 })
      prefetch('/users', { delay: 100 })

      // Aguardar o debounce
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Componente deve ser chamado apenas uma vez
      expect(component).toHaveBeenCalledTimes(1)
    })

    test('não prefetch rota não registrada', async () => {
      prefetch('/not-registered', { delay: 0 })

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Não deve dar erro, apenas não fazer nada
      expect(isPrefetched('/not-registered')).toBe(false)
    })

    test('respeita opção component: false', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      const loader = mock(async () => ({ data: 'test' }))

      registerRoute('/users', { component, loader })

      prefetch('/users', { delay: 0, component: false, data: true })

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Loader deve ter sido chamado
      expect(loader).toHaveBeenCalled()
      // Componente não deve ter sido chamado
      expect(component).not.toHaveBeenCalled()
    })

    test('respeita opção data: false', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      const loader = mock(async () => ({ data: 'test' }))

      registerRoute('/users', { component, loader })

      prefetch('/users', { delay: 0, component: true, data: false })

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Componente deve ter sido chamado
      expect(component).toHaveBeenCalled()
      // Loader não deve ter sido chamado
      expect(loader).not.toHaveBeenCalled()
    })

    test('usa delay customizado', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      const startTime = Date.now()

      prefetch('/users', { delay: 100 })

      // Aguardar um pouco menos que o delay
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Não deve ter sido chamado ainda
      expect(component).not.toHaveBeenCalled()

      // Aguardar o resto do delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      const elapsed = Date.now() - startTime

      // Deve ter sido chamado após o delay
      expect(component).toHaveBeenCalled()
      expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    test('não duplica prefetch para mesma rota', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      // Primeira chamada
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(1)

      // Segunda chamada - deve usar cache
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(1) // Ainda 1
    })

    test('permite retry em caso de erro', async () => {
      let callCount = 0
      const component = mock(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Failed'))
        }
        return Promise.resolve({ default: () => 'Component' })
      })

      registerRoute('/users', { component })

      // Primeira tentativa - vai falhar
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(1)

      // Segunda tentativa - deve tentar novamente (não está no cache de sucesso)
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearPrefetchCache', () => {
    test('limpa cache de prefetch', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      // Primeira chamada
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(1)
      expect(isPrefetched('/users')).toBe(true)

      // Limpar cache de prefetch
      clearPrefetchCache()

      expect(isPrefetched('/users')).toBe(false)

      // Segunda chamada - como o componente lazy já está cacheado,
      // ele NÃO será recarregado (cache do lazy é separado)
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Componente não é recarregado pois já está no cache do lazy
      expect(component).toHaveBeenCalledTimes(1)

      // Mas o tracking de prefetch foi atualizado
      expect(isPrefetched('/users')).toBe(true)
    })

    test('cancela timers pendentes', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      // Iniciar prefetch com delay longo
      prefetch('/users', { delay: 500 })

      // Limpar antes do delay
      clearPrefetchCache()

      // Aguardar mais que o delay original
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Componente não deve ter sido chamado
      expect(component).not.toHaveBeenCalled()
    })
  })

  describe('isPrefetched', () => {
    test('retorna true após prefetch bem-sucedido', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      expect(isPrefetched('/users')).toBe(false)

      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(isPrefetched('/users')).toBe(true)
    })

    test('retorna false antes do prefetch', () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      expect(isPrefetched('/users')).toBe(false)
    })

    test('distingue entre diferentes opções de prefetch', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))
      registerRoute('/users', { component })

      // Prefetch só componente
      prefetch('/users', { delay: 0, component: true, data: false })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(isPrefetched('/users', true, false)).toBe(true)
      expect(isPrefetched('/users', true, true)).toBe(false)
    })
  })

  describe('Integração com lazy', () => {
    test('prefetch carrega componente lazy', async () => {
      const lazyComponent: LazyImport<{}> = () =>
        Promise.resolve({ default: () => 'Lazy Component' })

      registerRoute('/lazy', { component: lazyComponent })

      prefetch('/lazy', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(isPrefetched('/lazy')).toBe(true)
    })

    test('não recarrega componente já lazy-loaded', async () => {
      const component = mock(() => Promise.resolve({ default: () => 'Component' }))

      registerRoute('/users', { component })

      // Primeiro prefetch
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(component).toHaveBeenCalledTimes(1)

      // Segundo prefetch - deve usar cache do lazy
      clearPrefetchCache() // Limpar cache de prefetch, mas não de lazy
      prefetch('/users', { delay: 0 })
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Componente ainda deve ter sido chamado apenas 1 vez (cache do lazy)
      expect(component).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integração com loaders', () => {
    test('prefetch executa loader', async () => {
      const loader = mock(async () => ({ data: 'test' }))

      registerRoute('/users', { loader })

      prefetch('/users', { delay: 0, component: false })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(loader).toHaveBeenCalled()
    })

    test('não duplica prefetch para mesma rota com loader', async () => {
      const loader = mock(async () => ({ data: 'test' }))

      registerRoute('/users', { loader })

      // Primeiro prefetch
      prefetch('/users', { delay: 0, component: false })
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(loader).toHaveBeenCalledTimes(1)

      // Segundo prefetch - como já foi prefetched, não executa novamente
      prefetch('/users', { delay: 0, component: false })
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Loader ainda deve ter sido chamado apenas 1 vez (cache de prefetch)
      expect(loader).toHaveBeenCalledTimes(1)
    })
  })
})
