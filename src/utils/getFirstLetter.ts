export const getFirstCapitalize = (text: string): string => {
	const trimmed = text.trim();
	if (!trimmed) return '';
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export const getFirstLetter = (text: string, letterCount = 2): string =>
	text
		.split(/\s/)
		.slice(0, letterCount)
		.map((word) => word[0])
		.join('')
		.toUpperCase();
