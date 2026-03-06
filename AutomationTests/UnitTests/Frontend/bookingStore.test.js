import { describe, it, expect, beforeEach } from 'vitest'
import { useBookingStore } from '../../../frontend/src/store/bookingStore'

// Reset to initial state before each test
beforeEach(() => {
  useBookingStore.setState({
    searchParams: {
      origin: null, destination: null, travelDate: null, returnDate: null,
      tripType: 'ONE_WAY', adults: 1, children: 0, newborns: 0,
    },
    bookingId: null,
    selectedFlight: null,
    selectedReturnFlight: null,
    passengers: [],
    addOns: [],
    totalAmount: 0,
    paymentToken: null,
    bookingRef: null,
    currentStep: 1,
    errors: {},
  })
})

// ---------------------------------------------------------------------------
// resetBooking()
// ---------------------------------------------------------------------------
describe('resetBooking()', () => {
  it('clears all booking-related state back to initial values', () => {
    useBookingStore.setState({
      bookingId: 'bk-1',
      selectedFlight: { id: 'f1' },
      passengers: [{ name: 'Alice' }],
      addOns: [{ id: 'a1' }],
      totalAmount: 5000,
      bookingRef: 'REF123',
      currentStep: 5,
    })

    useBookingStore.getState().resetBooking()
    const state = useBookingStore.getState()

    expect(state.bookingId).toBeNull()
    expect(state.selectedFlight).toBeNull()
    expect(state.selectedReturnFlight).toBeNull()
    expect(state.passengers).toEqual([])
    expect(state.addOns).toEqual([])
    expect(state.totalAmount).toBe(0)
    expect(state.bookingRef).toBeNull()
    expect(state.currentStep).toBe(1)
    expect(state.errors).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------
describe('goToStep()', () => {
  it('sets currentStep to the given value', () => {
    useBookingStore.getState().goToStep(4)
    expect(useBookingStore.getState().currentStep).toBe(4)
  })
})

describe('nextStep()', () => {
  it('increments currentStep by 1', () => {
    useBookingStore.getState().nextStep()
    expect(useBookingStore.getState().currentStep).toBe(2)
  })

  it('does not exceed step 7', () => {
    useBookingStore.setState({ currentStep: 7 })
    useBookingStore.getState().nextStep()
    expect(useBookingStore.getState().currentStep).toBe(7)
  })
})

describe('previousStep()', () => {
  it('decrements currentStep by 1', () => {
    useBookingStore.setState({ currentStep: 3 })
    useBookingStore.getState().previousStep()
    expect(useBookingStore.getState().currentStep).toBe(2)
  })

  it('does not go below step 1', () => {
    useBookingStore.getState().previousStep()
    expect(useBookingStore.getState().currentStep).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// canProceedToPassengers()
// ---------------------------------------------------------------------------
describe('canProceedToPassengers()', () => {
  it('returns falsy when no flight is selected', () => {
    expect(useBookingStore.getState().canProceedToPassengers()).toBeFalsy()
  })

  it('returns truthy for a ONE_WAY trip with an outbound flight', () => {
    useBookingStore.setState({
      selectedFlight: { id: 'f1' },
      searchParams: { tripType: 'ONE_WAY' },
    })
    expect(useBookingStore.getState().canProceedToPassengers()).toBeTruthy()
  })

  it('returns falsy for a RETURN trip when only outbound is selected', () => {
    useBookingStore.setState({
      selectedFlight: { id: 'f1' },
      selectedReturnFlight: null,
      searchParams: { tripType: 'RETURN' },
    })
    expect(useBookingStore.getState().canProceedToPassengers()).toBeFalsy()
  })

  it('returns truthy for a RETURN trip when both flights are selected', () => {
    useBookingStore.setState({
      selectedFlight: { id: 'f1' },
      selectedReturnFlight: { id: 'f2' },
      searchParams: { tripType: 'RETURN' },
    })
    expect(useBookingStore.getState().canProceedToPassengers()).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// canProceedToAddOns()
// ---------------------------------------------------------------------------
describe('canProceedToAddOns()', () => {
  it('returns false when passengers list is empty', () => {
    expect(useBookingStore.getState().canProceedToAddOns()).toBe(false)
  })

  it('returns true when at least one passenger is present', () => {
    useBookingStore.setState({ passengers: [{ name: 'Alice' }] })
    expect(useBookingStore.getState().canProceedToAddOns()).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// canProceedToSummary()
// ---------------------------------------------------------------------------
describe('canProceedToSummary()', () => {
  it('returns falsy with no bookingId and no passengers', () => {
    expect(useBookingStore.getState().canProceedToSummary()).toBeFalsy()
  })

  it('returns falsy when bookingId exists but no passengers', () => {
    useBookingStore.setState({ bookingId: 'bk-1', passengers: [] })
    expect(useBookingStore.getState().canProceedToSummary()).toBeFalsy()
  })

  it('returns truthy when both bookingId and passengers are set', () => {
    useBookingStore.setState({ bookingId: 'bk-1', passengers: [{ name: 'Bob' }] })
    expect(useBookingStore.getState().canProceedToSummary()).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// canProceedToPayment()
// ---------------------------------------------------------------------------
describe('canProceedToPayment()', () => {
  it('returns falsy with no bookingId', () => {
    useBookingStore.setState({ totalAmount: 5000 })
    expect(useBookingStore.getState().canProceedToPayment()).toBeFalsy()
  })

  it('returns falsy with zero totalAmount', () => {
    useBookingStore.setState({ bookingId: 'bk-1', totalAmount: 0 })
    expect(useBookingStore.getState().canProceedToPayment()).toBeFalsy()
  })

  it('returns truthy when both bookingId and totalAmount > 0', () => {
    useBookingStore.setState({ bookingId: 'bk-1', totalAmount: 5000 })
    expect(useBookingStore.getState().canProceedToPayment()).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// setSearchParams()
// ---------------------------------------------------------------------------
describe('setSearchParams()', () => {
  it('merges partial params without overwriting unrelated fields', () => {
    useBookingStore.setState({
      searchParams: { origin: 'DEL', destination: 'BOM', tripType: 'ONE_WAY', adults: 1, children: 0, newborns: 0, travelDate: null, returnDate: null },
    })
    useBookingStore.getState().setSearchParams({ adults: 2 })
    const { searchParams } = useBookingStore.getState()
    expect(searchParams.adults).toBe(2)
    expect(searchParams.origin).toBe('DEL')
    expect(searchParams.destination).toBe('BOM')
  })
})
