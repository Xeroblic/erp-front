import type { AttributesJson } from '../types/attributes.types';
import type { AttributesData } from '../components/DetailTabs/DynamicAttributesEditor/types';

export const DEFAULT_ATTRIBUTES: AttributesData = {
	packaging: {
		charger_included: false,
	},
};

const applyDefaults = (data: AttributesData): AttributesData => {
	const result: AttributesData = {
		...DEFAULT_ATTRIBUTES,
		...data,
	};

	if (data.packaging) {
		result.packaging = {
			...DEFAULT_ATTRIBUTES.packaging,
			...data.packaging,
		};
	}

	return result;
};

export const sanitiseAttributesInput = (value: unknown, applyDefaultsFlag = true): AttributesData => {
	if (!value) {
		return applyDefaultsFlag ? applyDefaults({}) : {};
	}

	let parsed: unknown = value;

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed);
		} catch {
			return applyDefaultsFlag ? applyDefaults({}) : {};
		}
	}

	if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
		return applyDefaultsFlag ? applyDefaults({}) : {};
	}

	const attributes = parsed as AttributesData;
	return applyDefaultsFlag ? applyDefaults(attributes) : attributes;
};

export const areAttributesEqual = (a: AttributesData, b: AttributesData): boolean => {
	return JSON.stringify(a) === JSON.stringify(b);
};

const pruneValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		const prunedArray = value
			.map((item) => pruneValue(item))
			.filter((item) => item !== undefined);
		return prunedArray.length > 0 ? prunedArray : undefined;
	}

	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>).reduce<
			Record<string, unknown>
		>((accumulator, [key, item]) => {
			const pruned = pruneValue(item);
			if (pruned !== undefined) {
				accumulator[key] = pruned;
			}
			return accumulator;
		}, {});

		return Object.keys(entries).length > 0 ? entries : undefined;
	}

	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === 'string' && value.trim() === '') {
		return undefined;
	}

	return value;
};

const pruneAttributes = (attributes: AttributesData): AttributesData => {
	const pruned = pruneValue(attributes);

	if (!pruned || typeof pruned !== 'object') {
		return {};
	}

	return pruned as AttributesData;
};

export const prepareAttributesForSubmit = (
	value: AttributesData | AttributesJson | string | null | undefined,
	applyDefaultsFlag = true,
): Record<string, unknown> | null => {
	const sanitised = sanitiseAttributesInput(value ?? {}, applyDefaultsFlag);
	const pruned = pruneAttributes(sanitised);
	return Object.keys(pruned).length > 0 ? (pruned as Record<string, unknown>) : null;
};

export const areAttributeRecordsEqual = (
	current: Record<string, unknown> | null | undefined,
	previous: Record<string, unknown> | null | undefined,
): boolean => {
	return JSON.stringify(current ?? null) === JSON.stringify(previous ?? null);
};

export const formatAttributesPreview = (
	value: AttributesData | AttributesJson | string | null | undefined,
): string => {
	const sanitised = sanitiseAttributesInput(value ?? {}, true);
	const pruned = pruneAttributes(sanitised);
	return Object.keys(pruned).length > 0 ? JSON.stringify(pruned, null, 2) : '';
};
