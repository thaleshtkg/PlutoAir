import { create } from 'zustand'

let _id = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration  ms before auto-dismiss (default 4000, 0 = sticky)
   */
  toast: (message, type = 'info', duration = 4000) => {
    const id = ++_id
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
    return id
  },

  success: (message, duration) => get().toast(message, 'success', duration),
  error:   (message, duration) => get().toast(message, 'error',   duration ?? 6000),
  info:    (message, duration) => get().toast(message, 'info',    duration),
  warn:    (message, duration) => get().toast(message, 'warning', duration),

  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  dismissAll: () => set({ toasts: [] }),
}))

/** Convenience hook — returns bound action shortcuts */
export function useToast() {
  const { toast, success, error, info, warn, dismiss } = useToastStore()
  return { toast, success, error, info, warn, dismiss }
}
