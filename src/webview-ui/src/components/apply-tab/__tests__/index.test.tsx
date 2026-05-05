import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApplyTab from '../index'
import type { ApplyChangeResponse, ApplyResult } from '../types'

// Mock VS Code API
const postMessageSpy = vi.fn()
vi.mock('../../../utils/vscode', () => ({
	getVsCodeApi: () => ({
		postMessage: postMessageSpy,
		getState: () => ({}),
		setState: () => undefined,
	}),
}))

// Mock child components for focused testing
vi.mock('../response-textarea', () => ({
	default: ({
		responseText,
		onTextChange,
	}: {
		responseText: string
		onTextChange: (event: React.SyntheticEvent) => void
	}) => (
		<textarea
			data-testid="mock-response-textarea"
			value={responseText}
			onChange={(e) => onTextChange(e)}
		/>
	),
}))

vi.mock('../apply-actions', () => ({
	default: ({
		isApplying,
		isPreviewing,
		onPreview,
		onApply,
		handleButtonKeyDown,
	}: {
		isApplying: boolean
		isPreviewing: boolean
		onPreview: () => void
		onApply: () => void
		handleButtonKeyDown: (
			event: React.KeyboardEvent<HTMLElement>,
			action: () => void,
		) => void
	}) => (
		<div data-testid="mock-apply-actions">
			<button
				data-testid="preview-button"
				onClick={onPreview}
				onKeyDown={(e) => handleButtonKeyDown(e, onPreview)}
				disabled={isApplying || isPreviewing}
			>
				{isPreviewing ? 'Previewing…' : 'Preview Changes'}
			</button>
			<button
				data-testid="apply-button"
				onClick={onApply}
				onKeyDown={(e) => handleButtonKeyDown(e, onApply)}
				disabled={isApplying || isPreviewing}
			>
				{isApplying ? 'Applying Changes…' : 'Apply Changes'}
			</button>
		</div>
	),
}))

vi.mock('../results-display', () => ({
	default: ({
		results,
		errors,
	}: {
		results: ApplyResult[] | null
		errors: string[] | null
	}) => (
		<div data-testid="mock-results-display">
			{errors && <div data-testid="errors">{errors.join(', ')}</div>}
			{results && <div data-testid="results">{results.length} results</div>}
		</div>
	),
}))

vi.mock('../preview-table', () => ({
	default: ({
		previewData,
		rowResults,
	}: {
		previewData: { rows: Array<{ path: string }>; errors: string[] } | null
		rowResults: Record<number, { success: boolean; message: string }>
	}) => (
		<div data-testid="mock-preview-table">
			{previewData?.rows.map((row, i) => (
				<div key={i} data-testid={`row-${i}`}>
					<span data-testid={`row-${i}-path`}>{row.path}</span>
					{rowResults[i] && (
						<span data-testid={`row-${i}-result`}>
							{rowResults[i].success ? '✓' : '✗'} {rowResults[i].message}
						</span>
					)}
				</div>
			))}
		</div>
	),
}))

describe('ApplyTab', () => {
	const mockOnApply = vi.fn()
	const mockOnPreview = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders all child components', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		expect(screen.getByTestId('mock-response-textarea')).toBeInTheDocument()
		expect(screen.getByTestId('mock-apply-actions')).toBeInTheDocument()
		expect(screen.getByTestId('mock-results-display')).toBeInTheDocument()
	})

	it('handles text input changes', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		fireEvent.change(textarea, { target: { value: 'test xml content' } })

		expect(textarea).toHaveValue('test xml content')
	})

	it('shows error when applying with empty text', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const applyButton = screen.getByTestId('apply-button')
		fireEvent.click(applyButton)

		expect(mockOnApply).not.toHaveBeenCalled()
		expect(screen.getByTestId('errors')).toHaveTextContent(
			'Please paste an XML response first.',
		)
	})

	it('shows error when previewing with empty text', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const previewButton = screen.getByTestId('preview-button')
		fireEvent.click(previewButton)

		expect(mockOnPreview).not.toHaveBeenCalled()
		expect(screen.getByTestId('errors')).toHaveTextContent(
			'Please paste an XML response first.',
		)
	})

	it('calls onApply with response text when apply button clicked with text', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		const applyButton = screen.getByTestId('apply-button')

		fireEvent.change(textarea, { target: { value: '<file>test</file>' } })
		fireEvent.click(applyButton)

		expect(mockOnApply).toHaveBeenCalledWith('<file>test</file>')
	})

	it('calls onPreview with response text when preview button clicked with text', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		const previewButton = screen.getByTestId('preview-button')

		fireEvent.change(textarea, { target: { value: '<file>test</file>' } })
		fireEvent.click(previewButton)

		expect(mockOnPreview).toHaveBeenCalledWith('<file>test</file>')
	})

	it('handles keyboard events on buttons', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		const previewButton = screen.getByTestId('preview-button')
		const applyButton = screen.getByTestId('apply-button')

		fireEvent.change(textarea, { target: { value: '<file>test</file>' } })

		// Test Enter key
		fireEvent.keyDown(previewButton, { key: 'Enter' })
		expect(mockOnPreview).toHaveBeenCalledWith('<file>test</file>')

		// Test Space key
		fireEvent.keyDown(applyButton, { key: ' ' })
		expect(mockOnApply).toHaveBeenCalledWith('<file>test</file>')

		// Test other keys don't trigger
		fireEvent.keyDown(previewButton, { key: 'Escape' })
		expect(mockOnPreview).toHaveBeenCalledTimes(1) // Still only once
	})

	it('handles successful apply changes response', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const successMessage: ApplyChangeResponse = {
			command: 'applyChangesResult',
			success: true,
			results: [
				{
					path: '/test/file.ts',
					action: 'modify',
					success: true,
					message: 'File modified successfully',
				},
			],
		}

		// Simulate message from extension
		fireEvent(window, new MessageEvent('message', { data: successMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('results')).toHaveTextContent('1 results')
		})
		expect(screen.queryByTestId('errors')).toBeNull()
	})

	it('handles failed apply changes response', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const errorMessage: ApplyChangeResponse = {
			command: 'applyChangesResult',
			success: false,
			errors: ['XML parsing failed', 'Invalid file path'],
		}

		fireEvent(window, new MessageEvent('message', { data: errorMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('errors')).toHaveTextContent(
				'XML parsing failed, Invalid file path',
			)
		})
		expect(screen.queryByTestId('results')).toBeNull()
	})

	it('handles successful preview changes response', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const successMessage: ApplyChangeResponse = {
			command: 'previewChangesResult',
			success: true,
		}

		fireEvent(window, new MessageEvent('message', { data: successMessage }))

		// Should not show errors for successful preview
		await waitFor(() => {
			expect(screen.queryByTestId('errors')).toBeNull()
		})
	})

	it('handles failed preview changes response', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const errorMessage: ApplyChangeResponse = {
			command: 'previewChangesResult',
			success: false,
			errors: ['Preview generation failed'],
		}

		fireEvent(window, new MessageEvent('message', { data: errorMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('errors')).toHaveTextContent(
				'Preview generation failed',
			)
		})
	})

	it('clears errors and results when starting new apply operation', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		const applyButton = screen.getByTestId('apply-button')

		// First, create an error state
		fireEvent.click(applyButton)
		expect(screen.getByTestId('errors')).toBeInTheDocument()

		// Then start a new apply operation
		fireEvent.change(textarea, {
			target: { value: '<file>new content</file>' },
		})
		fireEvent.click(applyButton)

		// Errors should be cleared
		expect(screen.queryByTestId('errors')).toBeNull()
		expect(mockOnApply).toHaveBeenCalledWith('<file>new content</file>')
	})

	it('clears errors when starting new preview operation', () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		const textarea = screen.getByTestId('mock-response-textarea')
		const previewButton = screen.getByTestId('preview-button')

		// First, create an error state
		fireEvent.click(previewButton)
		expect(screen.getByTestId('errors')).toBeInTheDocument()

		// Then start a new preview operation
		fireEvent.change(textarea, {
			target: { value: '<file>new content</file>' },
		})
		fireEvent.click(previewButton)

		// Errors should be cleared
		expect(screen.queryByTestId('errors')).toBeNull()
		expect(mockOnPreview).toHaveBeenCalledWith('<file>new content</file>')
	})

	it('maps applyChangesResult results to rowResults for inline feedback in PreviewTable', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		// First, establish previewData via previewChangesResult
		const previewMessage: ApplyChangeResponse = {
			command: 'previewChangesResult',
			success: true,
			previewData: {
				rows: [
					{
						path: 'src/foo.ts',
						action: 'modify',
						description: 'Update foo',
						changes: { added: 2, removed: 1 },
					},
					{
						path: 'src/bar.ts',
						action: 'rewrite',
						description: 'Rewrite bar',
						changes: { added: 10, removed: 5 },
					},
				],
				errors: [],
			},
		}
		fireEvent(window, new MessageEvent('message', { data: previewMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('mock-preview-table')).toBeInTheDocument()
		})

		// Now apply all — one patch succeeds, one fails
		const applyAllMessage: ApplyChangeResponse = {
			command: 'applyChangesResult',
			success: true,
			results: [
				{
					path: 'src/foo.ts',
					action: 'modify',
					success: true,
					message: 'Applied successfully',
				},
				{
					path: 'src/bar.ts',
					action: 'rewrite',
					success: false,
					message: 'Search text not found',
				},
			],
		}
		fireEvent(window, new MessageEvent('message', { data: applyAllMessage }))

		await waitFor(() => {
			// Row 0 should show success inline message
			expect(screen.getByTestId('row-0-result')).toHaveTextContent(
				'✓ Applied successfully',
			)
			// Row 1 should show error inline message
			expect(screen.getByTestId('row-1-result')).toHaveTextContent(
				'✗ Search text not found',
			)
		})
	})

	it('clears rowResults when starting a new apply all operation', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		// Establish previewData
		const previewMessage: ApplyChangeResponse = {
			command: 'previewChangesResult',
			success: true,
			previewData: {
				rows: [
					{
						path: 'src/foo.ts',
						action: 'modify',
						description: 'Update foo',
						changes: { added: 1, removed: 0 },
					},
				],
				errors: [],
			},
		}
		fireEvent(window, new MessageEvent('message', { data: previewMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('mock-preview-table')).toBeInTheDocument()
		})

		// Apply all once (with a result)
		const firstApplyMessage: ApplyChangeResponse = {
			command: 'applyChangesResult',
			success: true,
			results: [
				{
					path: 'src/foo.ts',
					action: 'modify',
					success: false,
					message: 'Search text not found',
				},
			],
		}
		fireEvent(window, new MessageEvent('message', { data: firstApplyMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('row-0-result')).toBeInTheDocument()
		})

		// Start a new apply all — rowResults should be cleared immediately
		const textarea = screen.getByTestId('mock-response-textarea')
		const applyButton = screen.getByTestId('apply-button')
		fireEvent.change(textarea, { target: { value: '<file>xml</file>' } })
		fireEvent.click(applyButton)

		// rowResults should be cleared (no inline result shown while applying)
		expect(screen.queryByTestId('row-0-result')).toBeNull()
	})

	it('clears previewData and shows errors in ResultsDisplay when applyChangesResult is parse-level failure', async () => {
		render(<ApplyTab onApply={mockOnApply} onPreview={mockOnPreview} />)

		// Establish previewData first
		const previewMessage: ApplyChangeResponse = {
			command: 'previewChangesResult',
			success: true,
			previewData: {
				rows: [
					{
						path: 'src/foo.ts',
						action: 'modify',
						description: 'Update foo',
						changes: { added: 1, removed: 0 },
					},
				],
				errors: [],
			},
		}
		fireEvent(window, new MessageEvent('message', { data: previewMessage }))

		await waitFor(() => {
			expect(screen.getByTestId('mock-preview-table')).toBeInTheDocument()
		})

		// Apply all returns a parse-level failure (no results, just errors)
		const failMessage: ApplyChangeResponse = {
			command: 'applyChangesResult',
			success: false,
			errors: ['XML parsing failed: unexpected token'],
		}
		fireEvent(window, new MessageEvent('message', { data: failMessage }))

		await waitFor(() => {
			// PreviewTable should be hidden, ResultsDisplay with error should be visible
			expect(screen.queryByTestId('mock-preview-table')).toBeNull()
			expect(screen.getByTestId('errors')).toHaveTextContent(
				'XML parsing failed: unexpected token',
			)
		})
	})
})
