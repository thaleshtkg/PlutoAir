import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle responses and token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        localStorage.setItem('token', accessToken)
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken)

        // Update auth store via set() — never mutate state directly
        useAuthStore.setState({
          token: accessToken,
          refreshToken: newRefreshToken || refreshToken,
        })

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return client(originalRequest)
      } catch (refreshError) {
        // Avoid the logout() race: only clear state if no fresh login has occurred
        const currentToken = localStorage.getItem('token')
        const failedToken = originalRequest.headers.Authorization?.replace('Bearer ', '')
        if (!currentToken || currentToken === failedToken) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          // Use synchronous state clear — don't call async logout() which races with login
          useAuthStore.setState({
            user: null, token: null, refreshToken: null,
            sessionTimeRemaining: null, _timerInterval: null,
          })
          const interval = useAuthStore.getState()._timerInterval
          if (interval) clearInterval(interval)
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.warn('Access forbidden')
    }

    return Promise.reject(error)
  }
)

export default client
