const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const getWithdrawalsErrorMessage = (error: unknown): string => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const responseData = asRecord(responseRecord?.data);
	const responseMessage = responseData?.message;
	if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
	if (error instanceof Error && error.message.trim()) return error.message;
	return 'No se pudieron cargar los retiros';
};

export default getWithdrawalsErrorMessage;
