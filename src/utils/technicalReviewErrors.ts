export interface TechnicalReviewValidationError {
	message: string;
	errors: Record<string, string[]>;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

export const getTechnicalReviewFieldError = (error: unknown, field: string): string | undefined => {
	const messages = asRecord(asRecord(error)?.errors)?.[field];
	return Array.isArray(messages) && typeof messages[0] === 'string' ? messages[0] : undefined;
};

export const toTechnicalReviewError = (error: unknown): TechnicalReviewValidationError => {
	const response = asRecord(asRecord(asRecord(error)?.response)?.data);
	const errors = Object.fromEntries(
		Object.entries(asRecord(response?.errors) ?? {}).map(([field, messages]) => [
			field,
			Array.isArray(messages)
				? messages.filter((message): message is string => typeof message === 'string')
				: [],
		]),
	);
	let message = 'No se pudo finalizar la revisión';
	if (error instanceof Error) message = error.message;
	if (typeof response?.message === 'string') message = response.message;
	return {
		message,
		errors,
	};
};
