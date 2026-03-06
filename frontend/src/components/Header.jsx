import { useAuthStore } from '../store/authStore'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const STEPS = [
  { path: '/search', label: 'Search', step: 1 },
  { path: '/results', label: 'Results', step: 2 },
  { path: '/passengers', label: 'Passengers', step: 3 },
  { path: '/addons', label: 'Add-Ons', step: 4 },
  { path: '/summary', label: 'Summary', step: 5 },
  { path: '/payment', label: 'Payment', step: 6 },
]

export default function Header() {
  const { user, isAuthenticated, logout, sessionTimeRemaining, extendSession, startSessionTimer } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [extendLoading, setExtendLoading] = useState(false)

  // Start timer if authenticated but timer not running
  useEffect(() => {
    if (isAuthenticated() && sessionTimeRemaining === null) {
      startSessionTimer()
    }
  }, [isAuthenticated()])

  useEffect(() => {
    if (sessionTimeRemaining !== null && sessionTimeRemaining <= 300 && sessionTimeRemaining > 0) {
      setShowSessionWarning(true)
    } else {
      setShowSessionWarning(false)
    }
  }, [sessionTimeRemaining])

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false)
    await logout()
    navigate('/login')
  }

  const handleExtendSession = async () => {
    setExtendLoading(true)
    await extendSession()
    setShowSessionWarning(false)
    setExtendLoading(false)
  }

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timerColor = sessionTimeRemaining !== null
    ? sessionTimeRemaining <= 300 ? 'text-red-600 font-bold animate-pulse' : 'text-gray-600'
    : 'text-gray-600'

  const isBookingFlow = ['/results', '/passengers', '/addons', '/summary', '/payment'].some(p => location.pathname.startsWith(p))

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <Link to="/search" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">✈️</span>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">FlightBooking</span>
            </Link>

            {/* User Info */}
            {isAuthenticated() && user ? (
              <div className="flex items-center gap-3 md:gap-5">
                {/* Session Timer */}
                {sessionTimeRemaining !== null && (
                  <div data-testid="header-session-timer" className={`text-xs md:text-sm flex items-center gap-1 ${timerColor}`}>
                    <span>⏱</span>
                    <span className="font-mono">{formatTime(sessionTimeRemaining)}</span>
                  </div>
                )}

                {/* User Name */}
                <span data-testid="header-user-name" className="text-sm text-gray-700 hidden md:block truncate max-w-32">
                  👤 {user.full_name || user.email?.split('@')[0]}
                </span>

                {/* Logout Button */}
                <button
                  data-testid="header-button-logout"
                  onClick={() => setShowLogoutModal(true)}
                  className="btn-secondary text-sm py-1.5 px-4"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          {/* Booking flow breadcrumb */}
          {isAuthenticated() && isBookingFlow && (
            <div className="flex gap-2 overflow-x-auto pb-2 text-xs">
              {STEPS.map((s) => {
                const isActive = location.pathname === s.path || location.pathname.startsWith(s.path + '/')
                const isPast = STEPS.findIndex(x => x.path === location.pathname) > STEPS.findIndex(x => x.path === s.path)
                return (
                  <span key={s.path} className={`flex items-center gap-1 px-2 py-0.5 rounded whitespace-nowrap ${isActive ? 'text-primary-700 font-semibold' : isPast ? 'text-green-600' : 'text-gray-400'}`}>
                    {isPast ? '✓' : '•'} {s.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Session Warning Banner */}
          {showSessionWarning && isAuthenticated() && (
            <div
              data-testid="header-session-warning"
              className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3 rounded"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Your session expires in <strong>{formatTime(sessionTimeRemaining)}</strong>.
                  <button
                    data-testid="header-button-extend-session"
                    onClick={handleExtendSession}
                    disabled={extendLoading}
                    className="ml-3 underline font-semibold hover:text-yellow-900 text-sm disabled:opacity-60"
                  >
                    {extendLoading ? 'Extending...' : 'Click here to extend'}
                  </button>
                </p>
                <button
                  data-testid="header-button-dismiss-warning"
                  onClick={() => setShowSessionWarning(false)}
                  className="text-yellow-600 hover:text-yellow-900 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Log Out?</h3>
            <p className="text-gray-600 text-sm mb-6">Are you sure you want to log out? Any unsaved booking will be lost.</p>
            <div className="flex gap-3">
              <button
                data-testid="logout-modal-cancel"
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary flex-1"
              >
                Stay Logged In
              </button>
              <button
                data-testid="logout-modal-confirm"
                type="button"
                onClick={handleLogoutConfirm}
                className="btn-danger flex-1"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
