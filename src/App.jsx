import { lazy } from 'react'
import { Route, Routes } from 'react-router'
import RootLayout from './layouts/RootLayout.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const ItemsPage = lazy(() => import('./pages/ItemsPage.jsx'))
const ItemDetailsPage = lazy(() => import('./pages/ItemDetailsPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="items" element={<ItemsPage />}>
          <Route path="new" element={<ItemDetailsPage />} />
          <Route path=":id" element={<ItemDetailsPage />} />
        </Route>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
