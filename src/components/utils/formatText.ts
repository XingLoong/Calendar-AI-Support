export function formatAIText(text: string): string {
	if (!text) return '';

	return text
		.replace(/\*\*(.*?)\*\*/g, (_, bold) => `**${bold.toUpperCase()}**`) // bold emphasis
		.replace(/(Recommended slot|Alternative|Reasoning):/gi, '\n\n**$1:**')
		.trim();
}
