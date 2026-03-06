import { create } from 'zustand'
import API from '../api/client'

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isInitializing: true,   // true until checkAuth resolves
  error: null,
  sessionTimeRemaining: null,

  // Actions
  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isInitializing: false })
      return
    }
    try {
      const response = await API.get('/auth/me')
      set({ user: response.data.data, token, error: null, isInitializing: false })
      // Start session timer if not already running
      if (!get()._timerInterval) get().startSessionTimer()
    } catch {
      // Only clear if the token hasn't already been replaced by a fresh login
      if (localStorage.getItem('token') === token) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({ user: null, token: null, refreshToken: null, isInitializing: false })
      } else {
        set({ isInitializing: false })
      }
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await API.post('/auth/login', { username, password })
      const { user, tokens } = response.data.data
      const { accessToken, refreshToken } = tokens

      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('sessionStart', Date.now())

      set({
        user,
        token: accessToken,
        refreshToken,
        isLoading: false,
        isInitializing: false,
        error: null,
      })

      setTimeout(() => get().startSessionTimer(), 0)
      return true
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed'
      set({
        isLoading: false,
        error: errorMessage,
      })
      return false
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await API.post('/auth/register', userData)
      const { user, tokens } = response.data.data
      const { accessToken, refreshToken } = tokens

      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('sessionStart', Date.now())

      set({
        user,
        token: accessToken,
        refreshToken,
        isLoading: false,
        isInitializing: false,
        error: null,
      })

      setTimeout(() => get().startSessionTimer(), 0)
      return true
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed'
      set({
        isLoading: false,
        error: errorMessage,
      })
      return false
    }
  },

  logout: async () => {
    set({ isLoading: true })
    get().stopSessionTimer()
    try {
      if (get().token) {
        await API.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('sessionStart')
      set({
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        sessionTimeRemaining: null,
        _timerInterval: null,
      })
    }
  },

  refreshTokens: async () => {
    try {
      const refreshToken = get().refreshToken
      if (!refreshToken) return false

      const response = await API.post('/auth/refresh', { refreshToken })
      // Backend returns { accessToken, refreshToken } flat
      const { accessToken, refreshToken: newRefreshToken } = response.data.data
      localStorage.setItem('token', accessToken)
      if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)

      set({
        token: accessToken,
        refreshToken: newRefreshToken || refreshToken,
      })

      return true
    } catch (error) {
      get().logout()
      return false
    }
  },

  setSessionTimeRemaining: (seconds) => {
    set({ sessionTimeRemaining: seconds })
  },

  startSessionTimer: () => {
    // Clear any existing timer
    if (get()._timerInterval) clearInterval(get()._timerInterval)
    const SESSION_DURATION = 3600 // 60 minutes
    // Try to load existing session start time
    const stored = localStorage.getItem('sessionStart')
    const sessionStart = stored ? parseInt(stored) : Date.now()
    if (!stored) localStorage.setItem('sessionStart', sessionStart)
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
      const remaining = Math.max(0, SESSION_DURATION - elapsed)
      set({ sessionTimeRemaining: remaining })
      if (remaining === 0) {
        clearInterval(interval)
        get().logout()
      }
    }, 1000)
    set({ _timerInterval: interval })
    // Set initial value
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
    set({ sessionTimeRemaining: Math.max(0, SESSION_DURATION - elapsed) })
  },

  stopSessionTimer: () => {
    const interval = get()._timerInterval
    if (interval) clearInterval(interval)
    set({ _timerInterval: null })
  },

  extendSession: async () => {
    try {
      const response = await API.post('/auth/refresh', { refreshToken: get().refreshToken })
      // Backend returns { accessToken, refreshToken } flat
      const { accessToken, refreshToken: newRefreshToken } = response.data.data || {}
      if (accessToken) {
        localStorage.setItem('token', accessToken)
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)
        set({ token: accessToken, refreshToken: newRefreshToken || get().refreshToken })
      }
      localStorage.setItem('sessionStart', Date.now())
      get().startSessionTimer()
      return true
    } catch {
      return false
    }
  },

  isAuthenticated: () => {
    return !!get().token
  },
}))
