import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../../../frontend/src/pages/RegisterPage'
import { useAuthStore } from '../../../../frontend/src/store/authStore'
import * as services from '../../../../frontend/src/api/services'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
  vi.restoreAllMocks()
  useAuthStore.setState({
    user: null, token: null, isLoading: false, error: null, isInitializing: false,
    login: useAuthStore.getState().login,
  })
})

describe('RegisterPage — rendering', () => {
  it('renders all form fields', () => {
    renderRegisterPage()
    expect(screen.getByTestId('register-fullname-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-mobile-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-confirm-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-terms-checkbox')).toBeInTheDocument()
    expect(screen.getByTestId('register-submit-button')).toBeInTheDocument()
  })

  it('renders a link to the login page', () => {
    renderRegisterPage()
    expect(screen.getByTestId('register-login-link')).toBeInTheDocument()
  })
})

describe('RegisterPage — inline validation on blur', () => {
  it('shows full_name error when field is blurred empty', async () => {
    renderRegisterPage()
    const input = screen.getByTestId('register-fullname-input')
    fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.getByTestId('register-fullname-error')).toBeInTheDocument()
    })
  })

  it('shows email error for invalid email format', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-email-input'), 'not-an-email')
    fireEvent.blur(screen.getByTestId('register-email-input'))
    await waitFor(() => {
      expect(screen.getByTestId('register-email-error')).toBeInTheDocument()
    })
  })

  it('shows mobile error for non-10-digit input', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-mobile-input'), '12345')
    fireEvent.blur(screen.getByTestId('register-mobile-input'))
    await waitFor(() => {
      expect(screen.getByTestId('register-mobile-error')).toBeInTheDocument()
    })
  })

  it('shows password error when password is too weak', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-password-input'), 'weak')
    fireEvent.blur(screen.getByTestId('register-password-input'))
    await waitFor(() => {
      expect(screen.getByTestId('register-password-error')).toBeInTheDocument()
    })
  })

  it('shows confirm_password error when passwords do not match', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-password-input'), 'Password1!')
    await userEvent.type(screen.getByTestId('register-confirm-password-input'), 'Different1!')
    fireEvent.blur(screen.getByTestId('register-confirm-password-input'))
    await waitFor(() => {
      expect(screen.getByTestId('register-confirm-error')).toHaveTextContent(/do not match/i)
    })
  })
})

describe('RegisterPage — password strength meter', () => {
  it('shows the strength meter when password is typed', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-password-input'), 'pass')
    expect(screen.getByText(/Strength:/)).toBeInTheDocument()
  })

  it('shows "Very Strong" for a fully complex password', async () => {
    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-password-input'), 'Password1!xyz')
    expect(screen.getByText(/Very Strong/)).toBeInTheDocument()
  })
})

describe('RegisterPage — submit validation', () => {
  it('shows errors for all fields on empty form submit', async () => {
    renderRegisterPage()
    await userEvent.click(screen.getByTestId('register-submit-button'))
    await waitFor(() => {
      expect(screen.getByTestId('register-fullname-error')).toBeInTheDocument()
      expect(screen.getByTestId('register-email-error')).toBeInTheDocument()
      expect(screen.getByTestId('register-mobile-error')).toBeInTheDocument()
      expect(screen.getByTestId('register-password-error')).toBeInTheDocument()
    })
  })

  it('shows terms error if terms checkbox is unchecked on submit', async () => {
    renderRegisterPage()
    // Fill all valid fields but leave terms unchecked
    await userEvent.type(screen.getByTestId('register-fullname-input'), 'Alice Smith')
    await userEvent.type(screen.getByTestId('register-email-input'), 'alice@example.com')
    await userEvent.type(screen.getByTestId('register-mobile-input'), '9876543210')
    await userEvent.type(screen.getByTestId('register-password-input'), 'Password1!')
    await userEvent.type(screen.getByTestId('register-confirm-password-input'), 'Password1!')
    await userEvent.click(screen.getByTestId('register-submit-button'))
    await waitFor(() => {
      expect(screen.getByTestId('register-terms-error')).toBeInTheDocument()
    })
  })
})

describe('RegisterPage — successful registration', () => {
  it('calls authAPI.register then login, then navigates to /search', async () => {
    vi.spyOn(services.authAPI, 'register').mockResolvedValue({ data: {} })
    const loginSpy = vi.fn().mockResolvedValue(true)
    useAuthStore.setState({ login: loginSpy })

    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-fullname-input'), 'Alice Smith')
    await userEvent.type(screen.getByTestId('register-email-input'), 'alice@example.com')
    await userEvent.type(screen.getByTestId('register-mobile-input'), '9876543210')
    await userEvent.type(screen.getByTestId('register-password-input'), 'Password1!')
    await userEvent.type(screen.getByTestId('register-confirm-password-input'), 'Password1!')
    await userEvent.click(screen.getByTestId('register-terms-checkbox'))
    await userEvent.click(screen.getByTestId('register-submit-button'))

    await waitFor(() => {
      expect(services.authAPI.register).toHaveBeenCalledWith({
        full_name: 'Alice Smith',
        email: 'alice@example.com',
        mobile: '9876543210',
        password: 'Password1!',
      })
      expect(loginSpy).toHaveBeenCalledWith('alice@example.com', 'Password1!')
      expect(mockNavigate).toHaveBeenCalledWith('/search')
    })
  })
})

describe('RegisterPage — duplicate email server error', () => {
  it('shows the email field error when server says email exists', async () => {
    vi.spyOn(services.authAPI, 'register').mockRejectedValue({
      response: { data: { error: { message: 'Email already in use' } } },
    })

    renderRegisterPage()
    await userEvent.type(screen.getByTestId('register-fullname-input'), 'Bob')
    await userEvent.type(screen.getByTestId('register-email-input'), 'bob@example.com')
    await userEvent.type(screen.getByTestId('register-mobile-input'), '9876543210')
    await userEvent.type(screen.getByTestId('register-password-input'), 'Password1!')
    await userEvent.type(screen.getByTestId('register-confirm-password-input'), 'Password1!')
    await userEvent.click(screen.getByTestId('register-terms-checkbox'))
    await userEvent.click(screen.getByTestId('register-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('register-email-error')).toHaveTextContent(/already exists/)
    })
  })
})
