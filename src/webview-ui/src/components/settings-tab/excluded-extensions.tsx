import { useEffect, useState } from 'react'

interface ExcludedExtensionsProps {
	excludedExtensions: string
	onChangeExcludedExtensions: (excludedExtensions: string) => void
	onDraftChange?: (excludedExtensions: string) => void
}

const ExcludedExtensions: React.FC<ExcludedExtensionsProps> = ({
	excludedExtensions,
	onChangeExcludedExtensions,
	onDraftChange,
}) => {
	const [localValue, setLocalValue] = useState(excludedExtensions)

	// Sync down when the prop changes externally
	useEffect(() => {
		if (excludedExtensions !== localValue) setLocalValue(excludedExtensions)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [excludedExtensions])

	// Debounce emitting changes to parent
	useEffect(() => {
		const handle = setTimeout(() => {
			onChangeExcludedExtensions(localValue)
		}, 150)
		return () => clearTimeout(handle)
	}, [localValue, onChangeExcludedExtensions])

	return (
		<div>
			<label
				id="excluded-extensions-label"
				htmlFor="excluded-extensions"
				className="text-xs mb-1 block"
			>
				Excluded File Extensions (one per line, e.g. *.css, *.txt, .log):
			</label>
			<vscode-textarea
				id="excluded-extensions"
				name="excludedExtensions"
				aria-labelledby="excluded-extensions-label"
				resize="vertical"
				rows={3}
				placeholder="Enter file extensions to exclude (e.g., *.css&#10;*.txt&#10;*.log)..."
				value={localValue}
				onInput={(e) => {
					const target = e.target as HTMLTextAreaElement
					const next = target.value ?? ''
					setLocalValue(next)
					onDraftChange?.(next)
				}}
				className="w-full min-h-[60px]"
			/>
		</div>
	)
}

export default ExcludedExtensions
