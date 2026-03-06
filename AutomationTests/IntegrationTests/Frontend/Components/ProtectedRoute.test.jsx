import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../../../frontend/src/components/ProtectedRoute'
import { useAuthStore } from '../../../../frontend/src/store/authStore'

// Helper to render ProtectedRoute inside a router
function renderWithRouter(ui, { initialEntries = ['/protected'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route
          path="/protected"
          element={<ProtectedRoute>{ui}</ProtectedRoute>}
        />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  // Reset store to unauthenticated, non-initializing state
  useAuthStore.setState({
    user: null,
    token: null,
    isInitializing: false,
  })
})

describe('ProtectedRoute', () => {
  it('renders a loading spinner while isInitializing is true', () => {
    useAuthStore.setState({ isInitializing: true, token: null })
    renderWithRouter(<div>Protected Content</div>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', () => {
    useAuthStore.setState({ isInitializing: false, token: null })
    renderWithRouter(<div>Protected Content</div>)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    useAuthStore.setState({ isInitializing: false, token: 'valid-token' })
    renderWithRouter(<div data-testid="protected-content">Protected Content</div>)
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })
})
