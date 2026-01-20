import { describe, test, expect, beforeEach } from 'bun:test'
import { Outlet } from './Outlet'
import { router } from './state'
import { clearLoaderCache } from './loaders'
import { clearGuardCache } from './Route'

describe('Outlet Component', () => {
  beforeEach(() => {
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
    clearLoaderCache()
    clearGuardCache()
  })

  test('renderiza null quando não há routes', () => {
    const result = Outlet({})
    expect(result).toBeNull()
  })

  test('renderiza null quando routes está vazio', () => {
    const result = Outlet({ routes: [] })
    expect(result).toBeNull()
  })

  test('renderiza rota que match', () => {
    router._setState({ pathname: '/about' })

    const AboutComponent = () => 'About Page'

    const result = Outlet({
      routes: [
        {
          path: '/about',
          component: AboutComponent,
        },
      ],
    })

    expect(result).toBe('About Page')
  })

  test('renderiza primeira rota que match', () => {
    router._setState({ pathname: '/users/123' })

    const UserComponent = ({ params }: { params: Record<string, string> }) => `User ${params.id}`
    const NotFoundComponent = () => '404'

    const result = Outlet({
      routes: [
        {
          path: '/users/:id',
          component: UserComponent,
        },
        {
          path: '*',
          component: NotFoundComponent,
        },
      ],
    })

    expect(result).toBe('User 123')
  })

  test('combina parentPath com path da rota', () => {
    router._setState({ pathname: '/dashboard/settings' })

    const SettingsComponent = () => 'Settings'

    const result = Outlet({
      routes: [
        {
          path: '/settings',
          component: SettingsComponent,
        },
      ],
      parentPath: '/dashboard',
    })

    expect(result).toBe('Settings')
  })

  test('passa outlet para component parent', () => {
    router._setState({ pathname: '/dashboard/profile' })

    const DashboardComponent = ({ outlet }: { outlet?: unknown }) => {
      return (outlet as string) || 'Dashboard'
    }

    const ProfileComponent = () => 'Profile'

    const result = Outlet({
      routes: [
        {
          path: '/dashboard',
          component: DashboardComponent,
          children: [
            {
              path: '/profile',
              component: ProfileComponent,
            },
          ],
        },
      ],
    })

    expect(result).toBe('Profile')
  })

  test('mescla parentParams com params da rota', () => {
    router._setState({ pathname: '/users/123/posts/456' })

    let receivedParams: Record<string, string> = {}

    const PostComponent = ({ params }: { params: Record<string, string> }) => {
      receivedParams = params
      return 'Post'
    }

    Outlet({
      routes: [
        {
          path: '/posts/:postId',
          component: PostComponent,
        },
      ],
      parentPath: '/users/:userId',
      parentParams: { userId: '123' },
    })

    expect(receivedParams).toEqual({ userId: '123', postId: '456' })
  })

  test('renderiza nested routes com múltiplos níveis', () => {
    router._setState({ pathname: '/app/settings/profile' })

    const AppComponent = ({ outlet }: { outlet?: unknown }) => (outlet as string) || 'App'
    const SettingsComponent = ({ outlet }: { outlet?: unknown }) => (outlet as string) || 'Settings'
    const ProfileComponent = () => 'Profile Settings'

    const result = Outlet({
      routes: [
        {
          path: '/app',
          component: AppComponent,
          children: [
            {
              path: '/settings',
              component: SettingsComponent,
              children: [
                {
                  path: '/profile',
                  component: ProfileComponent,
                },
              ],
            },
          ],
        },
      ],
    })

    expect(result).toBe('Profile Settings')
  })

  test('renderiza fallback quando nenhuma rota match', () => {
    router._setState({ pathname: '/unknown' })

    const NotFoundComponent = () => '404 Not Found'

    const result = Outlet({
      routes: [
        {
          path: '/about',
          component: () => 'About',
        },
        {
          path: '*',
          component: NotFoundComponent,
        },
      ],
    })

    expect(result).toBe('404 Not Found')
  })
})
