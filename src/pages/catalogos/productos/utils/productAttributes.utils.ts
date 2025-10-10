import type { AttributesJson } from '../types/attributes.types';

export interface ProductAttributesDiff {
	set?: Record<string, unknown>;
	unset?: string[];
	hasChanges: boolean;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const deepEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) return true;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let index = 0; index < a.length; index += 1) {
			if (!deepEqual(a[index], b[index])) return false;
		}
		return true;
	}

	if (isPlainObject(a) && isPlainObject(b)) {
		const aKeys = Object.keys(a);
		const bKeys = Object.keys(b);
		if (aKeys.length !== bKeys.length) return false;
		for (const key of aKeys) {
			if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
			if (!deepEqual(a[key], b[key])) return false;
		}
		return true;
	}

	return false;
};

interface DiffAccumulator {
	set: Record<string, unknown>;
	unset: string[];
}

const diffRecursive = (
	previous: Record<string, unknown>,
	next: Record<string, unknown>,
	basePath = '',
): DiffAccumulator => {
	const result: DiffAccumulator = { set: {}, unset: [] };
	const keys = new Set([
		...Object.keys(previous ?? {}),
		...Object.keys(next ?? {}),
	]);

	for (const key of keys) {
		const path = basePath ? `${basePath}.${key}` : key;
		const previousHasKey = Object.prototype.hasOwnProperty.call(previous, key);
		const nextHasKey = Object.prototype.hasOwnProperty.call(next, key);

		const previousValue = previousHasKey ? previous[key] : undefined;
		const nextValue = nextHasKey ? next[key] : undefined;

		if (!nextHasKey) {
			if (previousHasKey) result.unset.push(path);
			continue;
		}

		if (isPlainObject(previousValue) && isPlainObject(nextValue)) {
			const nested = diffRecursive(previousValue, nextValue, path);
			Object.assign(result.set, nested.set);
			result.unset.push(...nested.unset);
			continue;
		}

		if (Array.isArray(previousValue) && Array.isArray(nextValue)) {
			if (!deepEqual(previousValue, nextValue)) {
				result.set[path] = nextValue;
			}
			continue;
		}

		if (!deepEqual(previousValue, nextValue)) {
			result.set[path] = nextValue;
		}
	}

	return result;
};

export const diffProductAttributes = (
	previous: AttributesJson,
	next: AttributesJson,
): ProductAttributesDiff => {
	const previousValue = isPlainObject(previous) ? previous : {};
	const nextValue = isPlainObject(next) ? next : {};

	const { set, unset } = diffRecursive(
		previousValue as Record<string, unknown>,
		nextValue as Record<string, unknown>,
	);

	const uniqueUnset = Array.from(new Set(unset));
	const setKeys = Object.keys(set);

	return {
		set: setKeys.length > 0 ? set : undefined,
		unset: uniqueUnset.length > 0 ? uniqueUnset : undefined,
		hasChanges: setKeys.length > 0 || uniqueUnset.length > 0,
	};
};
