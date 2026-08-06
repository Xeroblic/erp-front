const getApiErrorMessage = (error: unknown, fallback: string): string => {
	if (error !== null && typeof error === 'object' && 'response' in error) {
		const { response } = error;
		if (response !== null && typeof response === 'object' && 'data' in response) {
			const { data } = response;
			if (data !== null && typeof data === 'object' && 'message' in data) {
				const { message } = data;
				if (typeof message === 'string' && message.trim()) return message;
			}
		}
	}
	return error instanceof Error && error.message ? error.message : fallback;
};

export default getApiErrorMessage;
