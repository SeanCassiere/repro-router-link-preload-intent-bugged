import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Outlet,
  RouterProvider,
  Link,
  useLoaderData,
  useSearch,
  ReactRouter,
  createRouteConfig,
} from '@tanstack/react-router';

import { z } from 'zod';

// Build our routes. We could do this in our component, too.
const rootRoute = createRouteConfig({
  component: () => {
    return (
      <>
        <Outlet />
      </>
    );
  },
});

const indexRoute = rootRoute.createRoute({
  path: '/',
  component: () => {
    return (
      <div className={`p-2`}>
        <div className={`text-lg`}>Welcome Home!</div>
        <br />
        <Link
          to="/test"
          search={(search) => ({ ...search, foo: 'bar' })}
          preload="intent"
        >
          only setting foo: 'bar'
        </Link>
        <br />
        <Link
          to="/test"
          search={(search) => ({ ...search, foo: 'bar', name: 'Tanner' })}
          preload="intent"
        >
          only setting foo: 'bar', name: 'Tanner'
        </Link>
        <br />
        <Link
          to="/test"
          search={(search) => ({
            ...search,
            foo: 'bar',
            name: 'Tanner',
            filters: { nested: 'i am nested' },
          })}
          preload="intent"
        >
          only setting foo: 'bar', filters: Object(nested: 'i am nested')
        </Link>
      </div>
    );
  },
});

const testRoute = rootRoute.createRoute({
  path: 'test',
});

const filtersModel = z.object({
  nested: z.string(),
});

const testRouteIndexRoute = testRoute.createRoute({
  path: '/',
  validateSearch: (search) =>
    z
      .object({
        foo: z.string(),
        hello: z.string().optional(),
        name: z.string().default('Sean'),
        preSet: z.string(),
        filters: filtersModel.optional(),
      })
      .parse(search),
  preSearchFilters: [(search) => ({ ...search, preSet: 'preSearchFilters' })],
  loader: async ({ search }) => {
    console.log('loader ctx.search', search);
    return search;
  },
  component: () => {
    const loaderData = useLoaderData({ from: testRouteIndexRoute.id });
    const searchParams = useSearch({ from: testRouteIndexRoute.id });

    React.useEffect(() => {
      console.log('component loaderData', loaderData);
    }, [loaderData]);

    React.useEffect(() => {
      console.log('component searchParams', searchParams);
    }, [searchParams]);

    return (
      <div className="p-2">
        <div className="p-2">
          <Link to="/">Back</Link>
          <h1>Welcome to the test route</h1>
          <br />
          <p>
            Just returning search params in the loader. <i>Not important</i>{' '}
          </p>
          <pre className="py-4">
            Loader Data: {JSON.stringify(loaderData, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
});

const routeConfig = rootRoute.addChildren([
  indexRoute,
  testRoute.addChildren([testRouteIndexRoute]),
]);

const router = new ReactRouter({
  routeConfig,
  defaultPendingComponent: () => (
    <div className={`p-2 text-2xl`}>
      <Spinner />
    </div>
  ),
  context: {
    auth: {
      status: 'loggedOut',
    } as AuthContext,
  },
});

declare module '@tanstack/react-router' {
  interface RegisterRouter {
    router: typeof router;
  }
  interface RouterContext {
    // auth: AuthContext
  }
}

// Provide our location and routes to our application
function App() {
  return (
    <>
      <AuthProvider>
        <SubApp />
      </AuthProvider>
    </>
  );
}

function SubApp() {
  return (
    <>
      <RouterProvider
        router={router}
        // defaultPreload="intent"
        context={{
          auth: useAuth(),
        }}
      />
    </>
  );
}

type AuthContext = {
  login: (username: string) => void;
  logout: () => void;
} & AuthContextState;

type AuthContextState = {
  status: 'loggedOut' | 'loggedIn';
  username?: string;
};

const AuthContext = React.createContext<AuthContext>(null!);

function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthContextState>({
    status: 'loggedOut',
  });

  const login = (username: string) => {
    setState({ status: 'loggedIn', username });
  };

  const logout = () => {
    setState({ status: 'loggedOut' });
  };

  const contextValue = React.useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state]
  );

  return (
    <AuthContext.Provider value={contextValue} children={props.children} />
  );
}

function useAuth() {
  return React.useContext(AuthContext);
}

function Spinner() {
  return <div className="inline-block animate-spin px-3">???</div>;
}

const rootElement = document.getElementById('app')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
