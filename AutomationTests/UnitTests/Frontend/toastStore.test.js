import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore, useToast } from '../../../frontend/src/store/toastStore'
import { renderHook, act } from '@testing-library/react'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// toast()
// ---------------------------------------------------------------------------
describe('toast()', () => {
  it('adds a toast with the correct message and type', () => {
    act(() => {
      useToastStore.getState().toast('Hello world', 'success')
    })
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Hello world')
    expect(toasts[0].type).toBe('success')
  })

  it('auto-dismisses after the given duration', () => {
    act(() => {
      useToastStore.getState().toast('Temp message', 'info', 3000)
    })
    expect(useToastStore.getState().toasts).toHaveLength(1)

    act(() => vi.advanceTimersByTime(3000))
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('does NOT auto-dismiss when duration is 0 (sticky toast)', () => {
    act(() => {
      useToastStore.getState().toast('Sticky', 'warning', 0)
    })
    act(() => vi.advanceTimersByTime(60_000))
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('stacks multiple toasts', () => {
    act(() => {
      useToastStore.getState().toast('First', 'info')
      useToastStore.getState().toast('Second', 'error')
    })
    expect(useToastStore.getState().toasts).toHaveLength(2)
  })

  it('assigns unique ids to each toast', () => {
    act(() => {
      useToastStore.getState().toast('A', 'info')
      useToastStore.getState().toast('B', 'info')
    })
    const { toasts } = useToastStore.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })
})

// ---------------------------------------------------------------------------
// convenience helpers: success / error / info / warn
// ---------------------------------------------------------------------------
describe('convenience helpers', () => {
  it('success() adds a toast with type "success"', () => {
    act(() => { useToastStore.getState().success('Done') })
    expect(useToastStore.getState().toasts[0].type).toBe('success')
  })

  it('error() adds a toast with type "error" and 6-second default duration', () => {
    act(() => { useToastStore.getState().error('Oops') })
    const toast = useToastStore.getState().toasts[0]
    expect(toast.type).toBe('error')
    // should still be present at 5s, gone at 6s
    act(() => vi.advanceTimersByTime(5999))
    expect(useToastStore.getState().toasts).toHaveLength(1)
    act(() => vi.advanceTimersByTime(1))
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('info() adds a toast with type "info"', () => {
    act(() => { useToastStore.getState().info('FYI') })
    expect(useToastStore.getState().toasts[0].type).toBe('info')
  })

  it('warn() adds a toast with type "warning"', () => {
    act(() => { useToastStore.getState().warn('Careful') })
    expect(useToastStore.getState().toasts[0].type).toBe('warning')
  })
})

// ---------------------------------------------------------------------------
// dismiss()
// ---------------------------------------------------------------------------
describe('dismiss()', () => {
  it('removes only the toast with the matching id', () => {
    let id1, id2
    act(() => {
      id1 = useToastStore.getState().toast('First', 'info', 0)
      id2 = useToastStore.getState().toast('Second', 'info', 0)
    })
    act(() => { useToastStore.getState().dismiss(id1) })
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].id).toBe(id2)
  })
})

// ---------------------------------------------------------------------------
// dismissAll()
// ---------------------------------------------------------------------------
describe('dismissAll()', () => {
  it('removes all toasts', () => {
    act(() => {
      useToastStore.getState().toast('A', 'info', 0)
      useToastStore.getState().toast('B', 'success', 0)
      useToastStore.getState().toast('C', 'error', 0)
    })
    act(() => { useToastStore.getState().dismissAll() })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// useToast() hook
// ---------------------------------------------------------------------------
describe('useToast() hook', () => {
  it('exposes toast, success, error, info, warn and dismiss', () => {
    const { result } = renderHook(() => useToast())
    expect(typeof result.current.toast).toBe('function')
    expect(typeof result.current.success).toBe('function')
    expect(typeof result.current.error).toBe('function')
    expect(typeof result.current.info).toBe('function')
    expect(typeof result.current.warn).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
  })

  it('calling success() via hook adds a toast to the store', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.success('Via hook') })
    expect(useToastStore.getState().toasts[0].message).toBe('Via hook')
  })
})
