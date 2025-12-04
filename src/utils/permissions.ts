import { normalizePermission, normalizePermissions } from '@/utils/permissionNormalize';

export const hasPermission = (pattern: string, granted: string[]): boolean => {
	const normalizedGranted = normalizePermissions(granted);
	const normalizedPattern = normalizePermission(pattern);

	if (normalizedGranted.includes('super-admin')) return true;

	if (pattern.endsWith(':*')) {
		const entity = pattern.slice(0, -2).trim().toLowerCase();
		return normalizedGranted.some((p) => p.endsWith(`-${entity}`));
	}
	if (normalizedPattern.startsWith('*-')) {
		const entity = normalizedPattern.slice(2);
		return normalizedGranted.some((p) => p.endsWith(`-${entity}`));
	}

	return normalizedGranted.includes(normalizedPattern);
};
