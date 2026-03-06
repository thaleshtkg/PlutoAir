import client from './client'

export const authAPI = {
  login: (username, password) =>
    client.post('/auth/login', { username, password }),

  register: (userData) =>
    client.post('/auth/register', userData),

  logout: () =>
    client.post('/auth/logout'),

  refresh: (refreshToken) =>
    client.post('/auth/refresh', { refreshToken }),

  getMe: () =>
    client.get('/auth/me'),

  guestCheck: () =>
    client.post('/auth/guest-check'),
}

export const flightAPI = {
  getCities: () =>
    client.get('/flights/cities'),

  getAirlines: () =>
    client.get('/flights/airlines'),

  search: (searchParams) =>
    client.post('/flights/search', searchParams),

  getDetails: (flightId) =>
    client.get(`/flights/${flightId}`),
}

export const bookingAPI = {
  create: (bookingData) =>
    client.post('/booking', bookingData),

  getBooking: (bookingId) =>
    client.get(`/booking/${bookingId}`),

  addPassengers: (bookingId, passengers) =>
    client.post(`/booking/${bookingId}/passengers`, { passengers }),

  addAddOns: (bookingId, addons) =>
    client.post(`/booking/${bookingId}/addons`, { addons }),

  getSummary: (bookingId) =>
    client.get(`/booking/${bookingId}/summary`),

  confirm: (bookingId) =>
    client.post(`/booking/${bookingId}/confirm`),

  getTicket: (bookingRef) =>
    client.get(`/booking/ticket/${bookingRef}`),
}

export const paymentAPI = {
  initiate: (bookingId, paymentData) =>
    client.post('/payment/initiate', {
      bookingId,
      ...paymentData,
    }),

  handleCallback: (token, status) =>
    client.post('/payment/callback', { token, status }),

  getStatus: (bookingId) =>
    client.get(`/payment/${bookingId}/status`),
}

export default {
  auth: authAPI,
  flights: flightAPI,
  booking: bookingAPI,
  payment: paymentAPI,
}
