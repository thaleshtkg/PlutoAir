import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PassengersPage from '../../../../frontend/src/pages/PassengersPage'
import { useBookingStore } from '../../../../frontend/src/store/bookingStore'
import * as services from '../../../../frontend/src/api/services'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockFlight = {
  id: 'f1',
  airline_name: 'Air Test',
  flight_number: 'AT101',
}

function renderPassengersPage() {
  return render(
    <MemoryRouter>
      <PassengersPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
  vi.restoreAllMocks()
  useBookingStore.setState({
    selectedFlight: mockFlight,
    selectedReturnFlight: null,
    bookingId: null,
    searchParams: {
      origin: { iata_code: 'DEL' },
      destination: { iata_code: 'BOM' },
      travelDate: '2026-06-01',
      tripType: 'ONE_WAY',
      adults: 1,
      children: 0,
      newborns: 0,
    },
    passengers: [],
  })
})

describe('PassengersPage — rendering', () => {
  it('redirects to /search when no flight is selected', () => {
    useBookingStore.setState({ selectedFlight: null })
    renderPassengersPage()
    expect(mockNavigate).toHaveBeenCalledWith('/search')
  })

  it('renders one passenger form for 1 adult', () => {
    renderPassengersPage()
    expect(screen.getByTestId('passenger-0-firstname')).toBeInTheDocument()
    expect(screen.queryByTestId('passenger-1-firstname')).not.toBeInTheDocument()
  })

  it('renders correct number of forms for mixed passengers', () => {
    useBookingStore.setState({
      searchParams: {
        origin: { iata_code: 'DEL' },
        destination: { iata_code: 'BOM' },
        travelDate: '2026-06-01',
        tripType: 'ONE_WAY',
        adults: 2,
        children: 1,
        newborns: 0,
      },
    })
    renderPassengersPage()
    expect(screen.getByTestId('passenger-0-firstname')).toBeInTheDocument()
    expect(screen.getByTestId('passenger-1-firstname')).toBeInTheDocument()
    expect(screen.getByTestId('passenger-2-firstname')).toBeInTheDocument()
    expect(screen.queryByTestId('passenger-3-firstname')).not.toBeInTheDocument()
  })
})

describe('PassengersPage — validation', () => {
  it('shows an error when first name is empty on continue', async () => {
    renderPassengersPage()
    await userEvent.click(screen.getByTestId('passengers-continue-button'))
    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
    })
  })

  it('shows an age error for an adult passenger who is under 12', async () => {
    renderPassengersPage()
    await userEvent.type(screen.getByTestId('passenger-0-firstname'), 'Baby')
    await userEvent.type(screen.getByTestId('passenger-0-lastname'), 'Smith')
    // Set a DOB that makes the passenger 10 years old on 2026-06-01
    fireEvent.change(screen.getByTestId('passenger-0-dob'), { target: { value: '2016-01-01' } })

    const genderSelect = screen.getByTestId('passenger-0-gender')
    fireEvent.change(genderSelect, { target: { value: 'Male' } })

    const natSelect = screen.getByTestId('passenger-0-nationality')
    fireEvent.change(natSelect, { target: { value: 'India' } })

    await userEvent.click(screen.getByTestId('passengers-continue-button'))
    await waitFor(() => {
      expect(screen.getByText(/Adult must be 12\+ years/i)).toBeInTheDocument()
    })
  })
})

describe('PassengersPage — API interaction', () => {
  it('creates a booking and adds passengers on valid form submission', async () => {
    vi.spyOn(services.bookingAPI, 'create').mockResolvedValue({
      data: { data: { booking_id: 'bk-123' } },
    })
    vi.spyOn(services.bookingAPI, 'addPassengers').mockResolvedValue({ data: {} })

    renderPassengersPage()
    await userEvent.type(screen.getByTestId('passenger-0-firstname'), 'John')
    await userEvent.type(screen.getByTestId('passenger-0-lastname'), 'Doe')
    fireEvent.change(screen.getByTestId('passenger-0-dob'), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByTestId('passenger-0-gender'), { target: { value: 'Male' } })
    fireEvent.change(screen.getByTestId('passenger-0-nationality'), { target: { value: 'India' } })

    await userEvent.click(screen.getByTestId('passengers-continue-button'))

    await waitFor(() => {
      expect(services.bookingAPI.create).toHaveBeenCalled()
      expect(services.bookingAPI.addPassengers).toHaveBeenCalledWith('bk-123', expect.any(Array))
      expect(mockNavigate).toHaveBeenCalledWith('/addons')
    })
  })

  it('skips booking creation if bookingId already exists in store', async () => {
    useBookingStore.setState({ bookingId: 'existing-bk' })
    const createSpy = vi.spyOn(services.bookingAPI, 'create')
    vi.spyOn(services.bookingAPI, 'addPassengers').mockResolvedValue({ data: {} })

    renderPassengersPage()
    await userEvent.type(screen.getByTestId('passenger-0-firstname'), 'Jane')
    await userEvent.type(screen.getByTestId('passenger-0-lastname'), 'Doe')
    fireEvent.change(screen.getByTestId('passenger-0-dob'), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByTestId('passenger-0-gender'), { target: { value: 'Female' } })
    fireEvent.change(screen.getByTestId('passenger-0-nationality'), { target: { value: 'India' } })

    await userEvent.click(screen.getByTestId('passengers-continue-button'))

    await waitFor(() => {
      expect(createSpy).not.toHaveBeenCalled()
      expect(services.bookingAPI.addPassengers).toHaveBeenCalledWith('existing-bk', expect.any(Array))
    })
  })
})
