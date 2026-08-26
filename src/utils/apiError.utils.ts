type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: undefined;

const collectValidationMessages = (value: unknown): string[] => {
	const errors = asRecord(value);
	if (!errors) return [];

	const messages = Object.values(errors).flatMap((fieldMessages) =>
		Array.isArray(fieldMessages)
			? fieldMessages.filter(
					(fieldMessage): fieldMessage is string =>
						typeof fieldMessage === 'string' && fieldMessage.trim().length > 0,
				)
			: [],
	);

	return [...new Set(messages)];
};

const extractApiErrorMessage = (error: unknown, fallback = 'Error inesperado'): string => {
	const response = asRecord(asRecord(error)?.response);
	const data = asRecord(response?.data);
	const validationMessages = collectValidationMessages(data?.errors);

	if (validationMessages.length > 0) return validationMessages.join(' · ');

	const responseMessage = data?.message;
	if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
		return responseMessage;
	}

	if (typeof error === 'string' && error.trim().length > 0) return error;
	if (error instanceof Error && error.message.trim().length > 0) return error.message;

	return fallback;
};

export default extractApiErrorMessage;
