export function formatAIText(text: string): string {
	if (!text) return '';

	// Convert markdown-style bold (**bold**) to <strong>
	let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

	// Add spacing and bold labels for key sections
	formatted = formatted.replace(
		/(Recommended slot|Alternative|Reasoning):/gi,
		'<br><br><strong>$1:</strong>',
	);

	// Replace line breaks with <br> tags
	formatted = formatted.replace(/\n/g, '<br>');

	return formatted.trim();
}
