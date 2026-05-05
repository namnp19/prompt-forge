import { useState } from 'react'

interface SavedPrompt {
	id: string
	name: string
	content: string
	createdAt: number
}

interface UserInstructionsProps {
	userInstructions: string
	onUserInstructionsChange: (instructions: string) => void
	savedPrompts?: SavedPrompt[]
	onSavePrompt?: (name: string, content: string) => void
	onDeletePrompt?: (id: string) => void
}

const UserInstructions: React.FC<UserInstructionsProps> = ({
	userInstructions,
	onUserInstructionsChange,
	savedPrompts = [],
	onSavePrompt,
	onDeletePrompt,
}) => {
	const [promptName, setPromptName] = useState('')
	const [showSaveRow, setShowSaveRow] = useState(false)

	const handleSave = () => {
		if (!promptName.trim() || !userInstructions.trim()) return
		onSavePrompt?.(promptName.trim(), userInstructions)
		setPromptName('')
		setShowSaveRow(false)
	}

	const handleLoad = (prompt: SavedPrompt) => {
		onUserInstructionsChange(prompt.content)
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between mb-1">
				<vscode-label htmlFor="user-instructions">
					User Instruction
				</vscode-label>
				<button
					type="button"
					className="text-[10px] text-muted hover:text-fg cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
					title={showSaveRow ? 'Cancel save' : 'Save current prompt'}
					onClick={() => setShowSaveRow((v) => !v)}
				>
					<span
						className={`codicon ${showSaveRow ? 'codicon-close' : 'codicon-save'}`}
					/>
				</button>
			</div>

			<vscode-textarea
				id="user-instructions"
				resize="vertical"
				rows={5}
				placeholder="Enter instructions for the AI..."
				value={userInstructions}
				onInput={(e) => {
					const target = e.target as HTMLInputElement
					onUserInstructionsChange(target.value)
				}}
				className="w-full min-h-[50px]"
			/>

			{showSaveRow && (
				<div className="flex items-center gap-1 mt-1">
					<vscode-textfield
						placeholder="Prompt name..."
						value={promptName}
						onInput={(e) => setPromptName((e.target as HTMLInputElement).value)}
						className="flex-1 text-xs"
					/>
					<vscode-button
						onClick={handleSave}
						disabled={!promptName.trim() || !userInstructions.trim()}
						title="Save prompt"
					>
						Save
					</vscode-button>
				</div>
			)}

			{savedPrompts.length > 0 && (
				<div className="mt-1 border border-panel rounded">
					<div className="text-[10px] text-muted px-2 pt-1 pb-0.5 font-medium border-b border-panel">
						Saved Prompts
					</div>
					<div className="max-h-32 overflow-y-auto">
						{savedPrompts.map((prompt) => (
							<div
								key={prompt.id}
								className="flex items-center justify-between px-2 py-1 hover:bg-button/10 group"
							>
								<button
									type="button"
									className="flex-1 text-left text-xs text-fg bg-transparent border-none cursor-pointer truncate p-0"
									title={`Load: ${prompt.name}`}
									onClick={() => handleLoad(prompt)}
								>
									{prompt.name}
								</button>
								<button
									type="button"
									className="text-muted hover:text-error opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer p-0 ml-1"
									title="Delete prompt"
									onClick={() => onDeletePrompt?.(prompt.id)}
								>
									<span className="codicon codicon-trash text-[10px]" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default UserInstructions
