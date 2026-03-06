import { create } from 'zustand'

export const useBookingStore = create((set, get) => ({
  // Search State
  searchParams: {
    origin: null,
    destination: null,
    travelDate: null,
    returnDate: null,
    tripType: 'ONE_WAY',
    adults: 1,
    children: 0,
    newborns: 0,
  },

  // Booking State
  bookingId: null,
  selectedFlight: null,
  selectedReturnFlight: null,
  passengers: [],
  addOns: [],
  totalAmount: 0,

  // Session State
  paymentToken: null,
  bookingRef: null,

  // UI State
  currentStep: 1, // 1-search, 2-results, 3-passengers, 4-addons, 5-summary, 6-payment, 7-confirmation
  errors: {},

  // Search Actions
  setSearchParams: (params) => {
    set((state) => ({
      searchParams: { ...state.searchParams, ...params },
    }))
  },

  // Booking Actions
  setBookingId: (bookingId) => {
    set({ bookingId })
  },

  setSelectedFlight: (flight) => {
    set({ selectedFlight: flight })
  },

  setSelectedReturnFlight: (flight) => {
    set({ selectedReturnFlight: flight })
  },

  setPassengers: (passengers) => {
    set({ passengers })
  },

  addPassenger: (passenger) => {
    set((state) => ({
      passengers: [...state.passengers, passenger],
    }))
  },

  updatePassenger: (index, passenger) => {
    set((state) => {
      const newPassengers = [...state.passengers]
      newPassengers[index] = passenger
      return { passengers: newPassengers }
    })
  },

  setAddOns: (addOns) => {
    set({ addOns })
  },

  addAddOn: (addOn) => {
    set((state) => ({
      addOns: [...state.addOns, addOn],
    }))
  },

  removeAddOn: (addonId) => {
    set((state) => ({
      addOns: state.addOns.filter((a) => a.id !== addonId),
    }))
  },

  setTotalAmount: (amount) => {
    set({ totalAmount: amount })
  },

  // Payment Actions
  setPaymentToken: (token) => {
    set({ paymentToken: token })
  },

  setBookingRef: (ref) => {
    set({ bookingRef: ref })
  },

  // Navigation
  goToStep: (step) => {
    set({ currentStep: step })
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 7),
    }))
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    }))
  },

  // Error Handling
  setErrors: (errors) => {
    set({ errors })
  },

  setError: (field, message) => {
    set((state) => ({
      errors: { ...state.errors, [field]: message },
    }))
  },

  clearError: (field) => {
    set((state) => {
      const newErrors = { ...state.errors }
      delete newErrors[field]
      return { errors: newErrors }
    })
  },

  // Session Management
  resetBooking: () => {
    set({
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
  },

  // Helper to check if booking is ready for next step
  canProceedToPassengers: () => {
    const state = get()
    return (
      state.selectedFlight &&
      (state.searchParams.tripType === 'ONE_WAY' || state.selectedReturnFlight)
    )
  },

  canProceedToAddOns: () => {
    const state = get()
    return state.passengers.length > 0
  },

  canProceedToSummary: () => {
    const state = get()
    return (
      state.bookingId &&
      state.passengers.length > 0
    )
  },

  canProceedToPayment: () => {
    const state = get()
    return state.bookingId && state.totalAmount > 0
  },
}))
