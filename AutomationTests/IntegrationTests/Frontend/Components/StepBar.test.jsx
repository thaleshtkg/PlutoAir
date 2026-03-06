import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepBar from '../../../../frontend/src/components/StepBar'

describe('StepBar', () => {
  it('renders all 7 step indicators', () => {
    render(<StepBar current={1} />)
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`step-${i}`)).toBeInTheDocument()
    }
  })

  it('marks the current step as active (ring class)', () => {
    render(<StepBar current={3} />)
    const activeStep = screen.getByTestId('step-3')
    expect(activeStep.className).toMatch(/ring/)
  })

  it('shows a checkmark (✓) for completed steps', () => {
    render(<StepBar current={4} />)
    for (let i = 1; i <= 3; i++) {
      expect(screen.getByTestId(`step-${i}`)).toHaveTextContent('✓')
    }
  })

  it('shows numbers for pending steps', () => {
    render(<StepBar current={2} />)
    // Steps 3–7 are pending — they should show their number
    for (let i = 3; i <= 7; i++) {
      expect(screen.getByTestId(`step-${i}`)).toHaveTextContent(String(i))
    }
  })

  it('renders the step-bar container', () => {
    render(<StepBar current={1} />)
    expect(screen.getByTestId('step-bar')).toBeInTheDocument()
  })

  it('active step does not show a checkmark', () => {
    render(<StepBar current={5} />)
    const activeStep = screen.getByTestId('step-5')
    expect(activeStep).not.toHaveTextContent('✓')
    expect(activeStep).toHaveTextContent('5')
  })

  it('applies smaller circle class when size="sm"', () => {
    render(<StepBar current={1} size="sm" />)
    const step = screen.getByTestId('step-1')
    expect(step.className).toMatch(/w-6/)
  })

  it('applies default medium circle class when no size prop', () => {
    render(<StepBar current={1} />)
    const step = screen.getByTestId('step-1')
    expect(step.className).toMatch(/w-8/)
  })
})
