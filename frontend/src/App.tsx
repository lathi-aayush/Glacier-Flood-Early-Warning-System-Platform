import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { LakeSelectionProvider } from '@/context/LakeSelectionProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { useLakesQuery } from '@/hooks/useLakesQuery'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const LakeInventoryPage = lazy(() =>
  import('@/pages/LakeInventoryPage').then((m) => ({ default: m.LakeInventoryPage })),
)
const AlertLogPage = lazy(() => import('@/pages/AlertLogPage').then((m) => ({ default: m.AlertLogPage })))
const HistoricalReplayPage = lazy(() =>
  import('@/pages/HistoricalReplayPage').then((m) => ({ default: m.HistoricalReplayPage })),
)
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })))

function AppRoutes() {
  const { lakes, loading, source } = useLakesQuery()

  return (
    <LakeSelectionProvider lakes={lakes} lakesLoading={loading} dataSource={source}>
      <Suspense fallback={<PageSpinner message="Loading screen…" />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<LakeInventoryPage />} />
          <Route path="/alerts" element={<AlertLogPage />} />
          <Route path="/replay" element={<HistoricalReplayPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Routes>
      </Suspense>
    </LakeSelectionProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}
