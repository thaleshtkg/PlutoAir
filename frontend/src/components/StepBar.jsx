const STEPS = ['Search', 'Select Flight', 'Passengers', 'Add-Ons', 'Summary', 'Payment', 'Confirmation']

/**
 * Shared booking-flow progress bar.
 * @param {number} current  - 1-indexed active step (1 = Search … 7 = Confirmation)
 * @param {string} [size]   - 'sm' | 'md' (default 'md')
 */
export default function StepBar({ current, size = 'md' }) {
  const circleClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  const lineClass   = size === 'sm' ? 'w-4 md:w-10 h-0.5 mx-0.5' : 'w-6 md:w-14 h-0.5 mx-1'

  return (
    <div data-testid="step-bar" className="flex items-center justify-center mb-6 overflow-x-auto pb-2 select-none">
      {STEPS.map((step, i) => {
        const num    = i + 1
        const done   = num < current
        const active = num === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                data-testid={`step-${num}`}
                className={`${circleClass} rounded-full flex items-center justify-center font-bold transition-all
                  ${done   ? 'bg-green-500 text-white'
                  : active ? 'bg-primary-600 text-white ring-4 ring-primary-200 ring-offset-1'
                           : 'bg-gray-200 text-gray-400'}`}
              >
                {done ? '✓' : num}
              </div>
              <span
                className={`text-xs mt-1 hidden md:block whitespace-nowrap
                  ${active ? 'text-primary-600 font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`${lineClass} ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
