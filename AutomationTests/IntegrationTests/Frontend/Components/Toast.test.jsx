import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import ToastContainer from '../../../../frontend/src/components/Toast'
import { useToastStore } from '../../../../frontend/src/store/toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a toast with role="alert"', () => {
    act(() => { useToastStore.getState().success('Upload complete') })
    render(<ToastContainer />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Upload complete')
  })

  it('renders the correct data-testid for each type', () => {
    act(() => {
      useToastStore.getState().success('ok')
      useToastStore.getState().error('fail')
      useToastStore.getState().info('note')
      useToastStore.getState().warn('careful')
    })
    render(<ToastContainer />)
    expect(screen.getByTestId('toast-success')).toBeInTheDocument()
    expect(screen.getByTestId('toast-error')).toBeInTheDocument()
    expect(screen.getByTestId('toast-info')).toBeInTheDocument()
    expect(screen.getByTestId('toast-warning')).toBeInTheDocument()
  })

  it('renders multiple toasts', () => {
    act(() => {
      useToastStore.getState().info('First')
      useToastStore.getState().info('Second')
    })
    render(<ToastContainer />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts).toHaveLength(2)
  })

  it('dismisses a toast when the dismiss button is clicked', () => {
    act(() => { useToastStore.getState().success('Dismiss me', 0) })
    render(<ToastContainer />)
    const dismissBtn = screen.getByLabelText('Dismiss notification')
    fireEvent.click(dismissBtn)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('has aria-live="polite" on the container', () => {
    act(() => { useToastStore.getState().info('something') })
    render(<ToastContainer />)
    // The live region is the outer container div
    const liveRegion = screen.getByRole('alert').closest('[aria-live]')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })
})
