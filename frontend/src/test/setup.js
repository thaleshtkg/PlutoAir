import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock canvas-confetti (used in ConfirmationPage)
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// Mock jsPDF (used in ConfirmationPage)
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    text: vi.fn(),
    save: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    addPage: vi.fn(),
  })),
}))

// Reset localStorage mock state before each test
beforeEach(() => {
  localStorageMock.clear()
  localStorageMock.getItem.mockReset()
  localStorageMock.setItem.mockReset()
  localStorageMock.removeItem.mockReset()
  localStorageMock.getItem.mockImplementation((key) => {
    const store = {}
    return store[key] ?? null
  })
})
