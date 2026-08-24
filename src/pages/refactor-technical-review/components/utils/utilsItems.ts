export const extractValue = (value: any): string | null => {
	if (value == null) return null;
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	if (typeof value === 'object' && 'value' in value) return String(value.value);
	return String(value);
};

export const resolveEquipmentTypeMeta = (
	equipmentType: any,
): { value: string; label: string; icon: string } => {
	const value = (
		typeof equipmentType === 'object' && equipmentType !== null && 'value' in equipmentType
			? equipmentType.value
			: equipmentType
	) as string | null;

	const normalizedValue = value ?? 'unknown';

	if (
		typeof equipmentType === 'object' &&
		equipmentType !== null &&
		'label' in equipmentType &&
		equipmentType.label
	) {
		return {
			value: normalizedValue,
			label: String(equipmentType.label),
			icon:
				normalizedValue === 'notebook'
					? 'HeroComputerDesktop'
					: normalizedValue === 'desktop'
						? 'HeroServerStack'
						: normalizedValue === 'aio'
							? 'HeroDeviceTablet'
							: normalizedValue === 'docking'
								? 'HeroCpuChip'
								: 'HeroTv',
		};
	}

	const label =
		normalizedValue === 'notebook'
			? 'Notebook'
			: normalizedValue === 'desktop'
				? 'Desktop'
				: normalizedValue === 'aio'
					? 'AIO'
					: normalizedValue === 'docking'
						? 'Docking'
						: normalizedValue === 'monitor'
							? 'Monitor'
							: 'Desconocido';

	const icon =
		normalizedValue === 'notebook'
			? 'HeroComputerDesktop'
			: normalizedValue === 'desktop'
				? 'HeroServerStack'
				: normalizedValue === 'aio'
					? 'HeroDeviceTablet'
					: normalizedValue === 'docking'
						? 'HeroCpuChip'
						: 'HeroTv';

	return { value: normalizedValue, label, icon };
};

export const formatDateTime = (value?: string | null, fallbackDash = true): string => {
	if (!value) return fallbackDash ? '—' : '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return fallbackDash ? '—' : '';
	return date.toLocaleString('es-CL', {
		dateStyle: 'short',
		timeStyle: 'short',
	});
};
