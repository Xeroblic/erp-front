export interface ToggleStatusResponse {
	data?: {
		is_active?: unknown;
	};
}

export const readToggleIsActive = (response: ToggleStatusResponse): boolean => {
	const isActive = response.data?.is_active;
	if (typeof isActive !== 'boolean') {
		throw new Error('La API devolvió un estado de activación inválido');
	}

	return isActive;
};
