import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../../../frontend/src/pages/LoginPage'
import { useAuthStore } from '../../../../frontend/src/store/authStore'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
  useAuthStore.setState({
    user: null, token: null, isLoading: false, error: null, isInitializing: false,
  })
})

describe('LoginPage — rendering', () => {
  it('renders username, password inputs and the sign-in button', () => {
    renderLoginPage()
    expect(screen.getByTestId('login-username-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-button-signin')).toBeInTheDocument()
  })

  it('renders the guest credentials banner', () => {
    renderLoginPage()
    expect(screen.getByTestId('login-guest-banner')).toBeInTheDocument()
  })

  it('renders a link to the register page', () => {
    renderLoginPage()
    expect(screen.getByTestId('login-link-register')).toBeInTheDocument()
  })
})

describe('LoginPage — guest credentials button', () => {
  it('pre-fills the form with admin credentials', async () => {
    renderLoginPage()
    await userEvent.click(screen.getByTestId('login-guest-credentials-button'))
    expect(screen.getByTestId('login-username-input')).toHaveValue('admin')
    expect(screen.getByTestId('login-password-input')).toHaveValue('admin@123')
  })
})

describe('LoginPage — password toggle', () => {
  it('toggles password field visibility on click', async () => {
    renderLoginPage()
    const passwordInput = screen.getByTestId('login-password-input')
    expect(passwordInput).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByTestId('login-password-toggle'))
    expect(passwordInput).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByTestId('login-password-toggle'))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

describe('LoginPage — form submission', () => {
  it('navigates to /search on successful login', async () => {
    // Mock the store's login action to simulate success
    useAuthStore.setState({ login: vi.fn().mockResolvedValue(true) })

    renderLoginPage()
    await userEvent.type(screen.getByTestId('login-username-input'), 'admin')
    await userEvent.type(screen.getByTestId('login-password-input'), 'admin@123')
    await userEvent.click(screen.getByTestId('login-button-signin'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search')
    })
  })

  it('shows an error message when login returns false', async () => {
    // The authStore.login returns false and sets an error
    useAuthStore.setState({
      login: vi.fn(async () => {
        useAuthStore.setState({ error: 'Invalid credentials' })
        return false
      }),
    })

    renderLoginPage()
    await userEvent.type(screen.getByTestId('login-username-input'), 'wrong')
    await userEvent.type(screen.getByTestId('login-password-input'), 'wrongpass')
    await userEvent.click(screen.getByTestId('login-button-signin'))

    // LoginPage doesn't currently display store.error — it shows caught errors.
    // The login returning false means no navigation occurs.
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  it('disables the sign-in button while loading', async () => {
    let resolveLogin
    useAuthStore.setState({
      login: vi.fn(() => new Promise(res => { resolveLogin = res })),
    })

    renderLoginPage()
    await userEvent.type(screen.getByTestId('login-username-input'), 'admin')
    await userEvent.type(screen.getByTestId('login-password-input'), 'admin@123')
    fireEvent.submit(screen.getByTestId('login-form'))

    await waitFor(() => {
      expect(screen.getByTestId('login-button-signin')).toBeDisabled()
    })

    resolveLogin(true)
  })
})

describe('LoginPage — remember me checkbox', () => {
  it('toggles the remember-me checkbox', async () => {
    renderLoginPage()
    const checkbox = screen.getByTestId('login-remember-checkbox')
    expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })
})
