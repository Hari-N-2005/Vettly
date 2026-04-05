import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Home from './pages/Home'
import DashboardPage from './pages/DashboardPage'
import RequirementsPage from './pages/RequirementsPage'
import VendorComparisonPage from './pages/VendorComparisonPage'
import RiskAnalysisPage from './pages/RiskAnalysisPage'
import SettingsPage from './pages/SettingsPage'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import TenderWorkflowPage from './pages/TenderWorkflowPage'
import DashboardLayout from './layouts/DashboardLayout'
import BackendSleepNotice from './components/common/BackendSleepNotice'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-legal-dark">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
        <BackendSleepNotice isActive />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-legal-dark">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
        <BackendSleepNotice isActive />
      </div>
    )
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  const { isLoading, initialize } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Initialize auth on app mount only
    if (!mounted) {
      initialize().finally(() => setMounted(true))
    }
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-legal-dark">
        <div className="text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
        <BackendSleepNotice isActive />
      </div>
    )
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-legal-dark text-gray-100">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="rfp-uploads" element={<Home />} />
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="vendor-comparison" element={<VendorComparisonPage />} />
            <Route path="risk-analysis" element={<RiskAnalysisPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="workflow" element={<TenderWorkflowPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
