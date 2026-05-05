// Message payload types used between the webview and the provider

export interface OpenFilePayload {
	fileUri: string
}

export interface CopyContextPayload {
	selectedUris: string[]
	userInstructions: string
	mode?: 'plan' | 'code'
}

export interface GetTokenCountsPayload {
	selectedUris: string[]
}

export interface GetFileTreePayload {
	excludedFolders?: string
	excludedExtensions?: string
	readGitignore?: boolean
}

export interface SaveSettingsPayload {
	excludedFolders: string
	excludedExtensions: string
	readGitignore: boolean
	customPromptProject: string
	customPromptGlobal: string
	customPromptScope: 'project' | 'global'
}

export interface UpdateSettingsPayload {
	excludedFolders: string
	excludedExtensions: string
	readGitignore: boolean
	customPromptProject: string
	customPromptGlobal: string
	customPromptScope: 'project' | 'global'
}

export interface SavedPrompt {
	id: string
	name: string
	content: string
	createdAt: number
}

export interface SavePromptPayload {
	name: string
	content: string
}

export interface DeletePromptPayload {
	id: string
}
