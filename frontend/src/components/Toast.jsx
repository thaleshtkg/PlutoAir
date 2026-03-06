import { useToastStore } from '../store/toastStore'

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}

const STYLES = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error:   'bg-red-50 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info:    'bg-blue-50 border-blue-400 text-blue-800',
}

function ToastItem({ id, message, type }) {
  const dismiss = useToastStore(s => s.dismiss)
  return (
    <div
      data-testid={`toast-${type}`}
      role="alert"
      className={`flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-xl border-l-4 shadow-lg
        animate-slide-in ${STYLES[type] || STYLES.info}`}
    >
      <span className="text-base flex-shrink-0 mt-0.5">{ICONS[type] || ICONS.info}</span>
      <p className="text-sm font-medium flex-1 leading-snug">{message}</p>
      <button
        aria-label="Dismiss notification"
        onClick={() => dismiss(id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 text-lg leading-none ml-1 -mt-0.5"
      >
        ×
      </button>
    </div>
  )
}

/**
 * Mount once inside <App> — renders all active toasts in the bottom-right corner.
 */
export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  )
}
