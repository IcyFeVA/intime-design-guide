import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { createHashRouter, RouterProvider } from 'react-router'
import '@mantine/core/styles.css'
import '@mantine/spotlight/styles.css'
import './styles/fonts.css'
import './styles/global.css'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import { pages } from './content/pages'
import { cssVariablesResolver, theme } from './theme'

const colorSchemeManager = localStorageColorSchemeManager({ key: 'intime-guide-color-scheme' })

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...pages.map((page) =>
        page.path === '/'
          ? { index: true, element: createElement(page.component) }
          : { path: page.path.slice(1), element: createElement(page.component) },
      ),
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      defaultColorScheme="dark"
      colorSchemeManager={colorSchemeManager}
      cssVariablesResolver={cssVariablesResolver}
    >
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
)
