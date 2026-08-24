export interface ToggleStatusResponse {
	success: boolean;
	message: string;
	data: {
		is_active: boolean;
	};
}

export const readToggleIsActive = (response: ToggleStatusResponse): boolean => {
	const isActive = response.data?.is_active;
	if (typeof isActive !== 'boolean') {
		throw new Error('La API devolvió un estado de activación inválido');
	}

	return isActive;
};
