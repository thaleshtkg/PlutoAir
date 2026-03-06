import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import ResultsPage from './pages/ResultsPage'
import PassengersPage from './pages/PassengersPage'
import AddOnsPage from './pages/AddOnsPage'
import SummaryPage from './pages/SummaryPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'

// Components
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/Toast'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth()
  }, [])

  return (
    <Router>
      <Header />
      <ToastContainer />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passengers"
            element={
              <ProtectedRoute>
                <PassengersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addons"
            element={
              <ProtectedRoute>
                <AddOnsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute>
                <SummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmation/:bookingRef"
            element={
              <ProtectedRoute>
                <ConfirmationPage />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
