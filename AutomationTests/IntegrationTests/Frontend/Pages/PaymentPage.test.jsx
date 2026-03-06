import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaymentPage from '../../../../frontend/src/pages/PaymentPage'
import { useBookingStore } from '../../../../frontend/src/store/bookingStore'
import * as services from '../../../../frontend/src/api/services'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderPaymentPage({ search = '' } = {}) {
  return render(
    <MemoryRouter initialEntries={[`/payment${search}`]}>
      <Routes>
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/confirmation/:ref" element={<div data-testid="confirmation-page">Confirmed</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
  vi.restoreAllMocks()
  useBookingStore.setState({
    bookingId: 'bk-1',
    totalAmount: 5000,
    selectedFlight: { id: 'f1', airline_name: 'Air Test' },
    bookingRef: null,
    setBookingRef: useBookingStore.getState().setBookingRef,
    goToStep: useBookingStore.getState().goToStep,
  })
})

describe('PaymentPage — rendering', () => {
  it('renders the payment method tabs', () => {
    renderPaymentPage()
    expect(screen.getByTestId('payment-method-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('payment-method-credit_card')).toBeInTheDocument()
    expect(screen.getByTestId('payment-method-paypal')).toBeInTheDocument()
    expect(screen.getByTestId('payment-method-upi')).toBeInTheDocument()
  })

  it('shows card form fields by default (CREDIT_CARD tab)', () => {
    renderPaymentPage()
    expect(screen.getByTestId('payment-card-number')).toBeInTheDocument()
    expect(screen.getByTestId('payment-card-expiry')).toBeInTheDocument()
    expect(screen.getByTestId('payment-card-cvv')).toBeInTheDocument()
    expect(screen.getByTestId('payment-card-name')).toBeInTheDocument()
  })
})

describe('PaymentPage — tab switching', () => {
  it('switches to PayPal form when PayPal tab is clicked', async () => {
    renderPaymentPage()
    await userEvent.click(screen.getByTestId('payment-method-paypal'))
    expect(screen.getByTestId('payment-paypal-email')).toBeInTheDocument()
    expect(screen.getByTestId('payment-paypal-password')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-card-number')).not.toBeInTheDocument()
  })

  it('switches to UPI form when UPI tab is clicked', async () => {
    renderPaymentPage()
    await userEvent.click(screen.getByTestId('payment-method-upi'))
    expect(screen.getByTestId('payment-upi-id')).toBeInTheDocument()
    expect(screen.queryByTestId('payment-card-number')).not.toBeInTheDocument()
  })
})

describe('PaymentPage — card form validation', () => {
  it('shows error when card number is too short', async () => {
    renderPaymentPage()
    await userEvent.type(screen.getByTestId('payment-card-number'), '1234')
    await userEvent.click(screen.getByTestId('payment-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/16-digit card number/i)).toBeInTheDocument()
    })
  })

  it('shows error for missing name on card', async () => {
    renderPaymentPage()
    await userEvent.type(screen.getByTestId('payment-card-number'), '4111111111111111')
    await userEvent.type(screen.getByTestId('payment-card-expiry'), '1230')
    await userEvent.type(screen.getByTestId('payment-card-cvv'), '123')
    // name left empty
    await userEvent.click(screen.getByTestId('payment-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/name as it appears on your card/i)).toBeInTheDocument()
    })
  })

  it('shows expiry error for a past date', async () => {
    renderPaymentPage()
    await userEvent.type(screen.getByTestId('payment-card-number'), '4111111111111111')
    await userEvent.type(screen.getByTestId('payment-card-expiry'), '0120') // Jan 2020
    await userEvent.type(screen.getByTestId('payment-card-cvv'), '123')
    await userEvent.type(screen.getByTestId('payment-card-name'), 'John Doe')
    await userEvent.click(screen.getByTestId('payment-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/expiry date is invalid or has passed/i)).toBeInTheDocument()
    })
  })
})

describe('PaymentPage — UPI form validation', () => {
  it('shows error for invalid UPI id', async () => {
    renderPaymentPage()
    await userEvent.click(screen.getByTestId('payment-method-upi'))
    await userEvent.type(screen.getByTestId('payment-upi-id'), 'invalidupiformat')
    await userEvent.click(screen.getByTestId('payment-submit-button'))
    await waitFor(() => {
      expect(screen.getByText(/valid UPI ID/i)).toBeInTheDocument()
    })
  })

  it('submits with a valid UPI id and initiates payment', async () => {
    vi.spyOn(services.paymentAPI, 'initiate').mockResolvedValue({
      data: { data: { redirect_url: null, booking_ref: 'REF-999' } },
    })

    renderPaymentPage()
    await userEvent.click(screen.getByTestId('payment-method-upi'))
    await userEvent.type(screen.getByTestId('payment-upi-id'), 'user@okicici')
    await userEvent.click(screen.getByTestId('payment-submit-button'))

    await waitFor(() => {
      expect(services.paymentAPI.initiate).toHaveBeenCalled()
    })
  })
})

describe('PaymentPage — callback handling', () => {
  it('shows processing screen and navigates on SUCCESS callback', async () => {
    vi.spyOn(services.paymentAPI, 'handleCallback').mockResolvedValue({
      data: { data: { booking_ref: 'REF-001' } },
    })

    renderPaymentPage({ search: '?status=SUCCESS&token=abc123' })

    await waitFor(() => {
      expect(services.paymentAPI.handleCallback).toHaveBeenCalledWith('abc123', 'SUCCESS')
      expect(mockNavigate).toHaveBeenCalledWith('/confirmation/REF-001')
    })
  })

  it('shows payment failure error when callback returns FAILURE', async () => {
    vi.spyOn(services.paymentAPI, 'handleCallback').mockRejectedValue(new Error('Declined'))

    renderPaymentPage({ search: '?status=FAILURE&token=tok' })

    await waitFor(() => {
      expect(screen.getByTestId('payment-error')).toHaveTextContent(/unsuccessful/i)
    })
  })
})
