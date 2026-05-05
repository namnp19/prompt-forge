interface CustomPromptProps {
	customPromptProject: string
	customPromptGlobal: string
	customPromptScope: 'project' | 'global'
	onChangeProject: (v: string) => void
	onChangeGlobal: (v: string) => void
	onChangeScope: (v: 'project' | 'global') => void
}

const CustomPrompt: React.FC<CustomPromptProps> = ({
	customPromptProject,
	customPromptGlobal,
	customPromptScope,
	onChangeProject,
	onChangeGlobal,
	onChangeScope,
}) => {
	const currentValue =
		customPromptScope === 'project' ? customPromptProject : customPromptGlobal

	const handleInput = (e: React.FormEvent<HTMLElement>) => {
		const target = e.target as HTMLTextAreaElement
		const next = target.value ?? ''
		if (customPromptScope === 'project') {
			onChangeProject(next)
		} else {
			onChangeGlobal(next)
		}
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-1">
				<label
					id="custom-prompt-label"
					htmlFor="custom-prompt"
					className="text-xs"
				>
					Custom Prompt:
				</label>
				<div className="flex items-center gap-x-1">
					<button
						type="button"
						className={[
							'text-xs px-2 py-0.5 rounded border transition-colors',
							customPromptScope === 'project'
								? 'bg-button text-button-foreground border-transparent'
								: 'bg-transparent text-muted border-[var(--vscode-panel-border)] hover:text-fg',
						].join(' ')}
						onClick={() => onChangeScope('project')}
						aria-pressed={customPromptScope === 'project'}
					>
						Project
					</button>
					<button
						type="button"
						className={[
							'text-xs px-2 py-0.5 rounded border transition-colors',
							customPromptScope === 'global'
								? 'bg-button text-button-foreground border-transparent'
								: 'bg-transparent text-muted border-[var(--vscode-panel-border)] hover:text-fg',
						].join(' ')}
						onClick={() => onChangeScope('global')}
						aria-pressed={customPromptScope === 'global'}
					>
						Global
					</button>
				</div>
			</div>
			<vscode-textarea
				id="custom-prompt"
				name="customPrompt"
				aria-labelledby="custom-prompt-label"
				resize="vertical"
				rows={4}
				placeholder="Enter custom instructions to include in every generated prompt..."
				value={currentValue}
				onInput={handleInput}
				className="w-full"
			/>
			<p className="text-xs text-muted mt-1">
				Inserted before User Instructions in every generated prompt.{' '}
				{customPromptScope === 'project'
					? 'Applies to this project only.'
					: 'Applies to all projects.'}
			</p>
		</div>
	)
}

export default CustomPrompt
