interface CopyActionsProps {
	onCopy: ({
		includeXml,
		userInstructions,
		mode,
	}: {
		includeXml: boolean
		userInstructions: string
		mode: 'plan' | 'code'
	}) => void
	userInstructions: string
	mode: 'plan' | 'code'
}

const CopyActions: React.FC<CopyActionsProps> = ({
	onCopy,
	userInstructions,
	mode,
}) => {
	const handleCopy = (xml: boolean) =>
		onCopy({ includeXml: xml, userInstructions, mode })

	return (
		<div className="flex flex-col justify-start gap-2 h-full">
			<vscode-button onClick={() => handleCopy(false)}>
				Copy Context
			</vscode-button>
			<vscode-button onClick={() => handleCopy(true)}>
				Copy Context + XML
			</vscode-button>
		</div>
	)
}

export default CopyActions
