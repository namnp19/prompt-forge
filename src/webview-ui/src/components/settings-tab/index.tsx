import { useEffect, useRef, useState } from 'react'
import CustomPrompt from './custom-prompt'
import ExcludedExtensions from './excluded-extensions'
import ExcludedFolders from './excluded-folders'
import RespectGitignoreToggle from './respect-gitignore-toggle'

interface SettingsTabProps {
	excludedFolders: string
	excludedExtensions: string
	readGitignore: boolean
	customPromptProject: string
	customPromptGlobal: string
	customPromptScope: 'project' | 'global'
	onSaveSettings: (payload: {
		excludedFolders: string
		excludedExtensions: string
		readGitignore: boolean
		customPromptProject: string
		customPromptGlobal: string
		customPromptScope: 'project' | 'global'
	}) => void
}

const SettingsTab: React.FC<SettingsTabProps> = ({
	excludedFolders,
	excludedExtensions,
	readGitignore,
	customPromptProject,
	customPromptGlobal,
	customPromptScope,
	onSaveSettings,
}) => {
	// Generic form draft state – scalable for future settings
	const [draft, setDraft] = useState<{
		excludedFolders: string
		excludedExtensions: string
		readGitignore: boolean
		customPromptProject: string
		customPromptGlobal: string
		customPromptScope: 'project' | 'global'
	}>(() => ({
		excludedFolders,
		excludedExtensions,
		readGitignore,
		customPromptProject,
		customPromptGlobal,
		customPromptScope,
	}))
	const [isDirty, setIsDirty] = useState(false)
	const [showSaved, setShowSaved] = useState(false)
	const savedTimerRef = useRef<number | null>(null)

	// Sync incoming prop to draft and reset dirty when saved externally
	useEffect(() => {
		setDraft({
			excludedFolders,
			excludedExtensions,
			readGitignore,
			customPromptProject,
			customPromptGlobal,
			customPromptScope,
		})
		setIsDirty(false)
	}, [
		excludedFolders,
		excludedExtensions,
		readGitignore,
		customPromptProject,
		customPromptGlobal,
		customPromptScope,
	])

	const handleChange = (field: keyof typeof draft, value: string | boolean) => {
		setDraft((prev) => {
			const next = { ...prev, [field]: value } as typeof prev
			setIsDirty(
				next.excludedFolders !== excludedFolders ||
					next.excludedExtensions !== excludedExtensions ||
					next.readGitignore !== readGitignore ||
					next.customPromptProject !== customPromptProject ||
					next.customPromptGlobal !== customPromptGlobal ||
					next.customPromptScope !== customPromptScope,
			)
			return next
		})
	}

	const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault()
		onSaveSettings({
			excludedFolders: draft.excludedFolders,
			excludedExtensions: draft.excludedExtensions,
			readGitignore: draft.readGitignore,
			customPromptProject: draft.customPromptProject,
			customPromptGlobal: draft.customPromptGlobal,
			customPromptScope: draft.customPromptScope,
		})
		setIsDirty(false)
		// show a brief toast/label
		setShowSaved(true)
		if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current)
		savedTimerRef.current = window.setTimeout(() => {
			setShowSaved(false)
			savedTimerRef.current = null
		}, 1500)
	}

	return (
		<div className="py-2">
			<vscode-label className="block mb-1">Settings</vscode-label>
			<form
				id="settings-form"
				className="flex flex-col gap-y-3 min-h-full"
				onSubmit={handleSubmit}
			>
				<ExcludedFolders
					excludedFolders={draft.excludedFolders}
					onChangeExcludedFolders={(v) => handleChange('excludedFolders', v)}
					onDraftChange={(v) => handleChange('excludedFolders', v)}
				/>

				<ExcludedExtensions
					excludedExtensions={draft.excludedExtensions}
					onChangeExcludedExtensions={(v) =>
						handleChange('excludedExtensions', v)
					}
					onDraftChange={(v) => handleChange('excludedExtensions', v)}
				/>

				<RespectGitignoreToggle
					checked={draft.readGitignore}
					onChange={(v) => handleChange('readGitignore', v)}
					onDraftChange={(v) => handleChange('readGitignore', v)}
				/>

				<CustomPrompt
					customPromptProject={draft.customPromptProject}
					customPromptGlobal={draft.customPromptGlobal}
					customPromptScope={draft.customPromptScope}
					onChangeProject={(v) => handleChange('customPromptProject', v)}
					onChangeGlobal={(v) => handleChange('customPromptGlobal', v)}
					onChangeScope={(v) => handleChange('customPromptScope', v)}
				/>

				{/* Sticky footer with bottom-left Save button */}
				<div className="sticky bottom-0 left-0 bg-bg border-t border-[var(--vscode-panel-border)] pt-2 pb-2 flex items-center gap-x-3">
					<vscode-button
						type="submit"
						disabled={!isDirty}
						onClick={(e) => {
							const form = (e.currentTarget as unknown as HTMLElement).closest(
								'form',
							) as HTMLFormElement | null
							form?.requestSubmit()
						}}
					>
						Save
					</vscode-button>
					{showSaved && (
						<span className="text-xs text-muted">Settings saved</span>
					)}
				</div>
			</form>
		</div>
	)
}

export default SettingsTab
