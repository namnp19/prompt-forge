import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExcludedExtensions from '../excluded-extensions'

describe('ExcludedExtensions', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.runOnlyPendingTimers()
		vi.useRealTimers()
	})

	it('debounces onChangeExcludedExtensions and emits last value only once', async () => {
		const onChange = vi.fn()
		render(
			<ExcludedExtensions
				excludedExtensions={'*.css'}
				onChangeExcludedExtensions={onChange}
			/>,
		)

		const textarea = screen.getByLabelText(/Excluded File Extensions/i)

		fireEvent.input(textarea, { target: { value: '*.css' } })
		fireEvent.input(textarea, { target: { value: '*.css\n*.txt' } })
		fireEvent.input(textarea, { target: { value: '*.css\n*.txt\n*.log' } })

		await vi.advanceTimersByTimeAsync(149)
		expect(onChange).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(2)
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenLastCalledWith('*.css\n*.txt\n*.log')
	})

	it('syncs local state with prop changes', () => {
		const onChange = vi.fn()
		const { rerender } = render(
			<ExcludedExtensions
				excludedExtensions={'*.css'}
				onChangeExcludedExtensions={onChange}
			/>,
		)

		rerender(
			<ExcludedExtensions
				excludedExtensions={'*.ts'}
				onChangeExcludedExtensions={onChange}
			/>,
		)

		const el = screen.getByLabelText(/Excluded File Extensions/i) as HTMLElement
		expect(el.getAttribute('value')).toBe('*.ts')
	})

	it('associates label with textarea via htmlFor/id', () => {
		const onChange = vi.fn()
		render(
			<ExcludedExtensions
				excludedExtensions={''}
				onChangeExcludedExtensions={onChange}
			/>,
		)
		const el = screen.getByLabelText(/Excluded File Extensions/i)
		expect(el).toBeInTheDocument()
		expect((el as HTMLElement).id).toBe('excluded-extensions')
	})
})
