import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '@/pages/catalogos/productos/types/products.types';
import type { AttributesData, ProductKind } from '../types';

const VALID_PRODUCT_KINDS: ProductKind[] = ['desktop_pc', 'notebook', 'aio', 'monitor'];

const FIELDS_TO_HIDE: Record<ProductKind, string[]> = {
	desktop_pc: [
		'cpu.cores',
		'cpu.threads',
		'cpu.base_clock_mhz',
		'cpu.boost_clock_mhz',
		'gpu.model',
		'gpu.vram_gb',
		'os.license.type',
		'os.license.activated',
		'audio',
		'notes',
		'display',
		'camera',
		'keyboard',
	],
	notebook: [
		'cpu.cores',
		'cpu.threads',
		'cpu.base_clock_mhz',
		'cpu.boost_clock_mhz',
		'gpu.model',
		'gpu.vram_gb',
		'os.license.type',
		'os.license.activated',
		'display.panel',
		'display.refresh_hz',
		'camera',
		'audio',
		'keyboard',
		'notes',
	],
	aio: [
		'cpu.cores',
		'cpu.threads',
		'cpu.base_clock_mhz',
		'cpu.boost_clock_mhz',
		'gpu.model',
		'gpu.vram_gb',
		'os.license.type',
		'os.license.activated',
		'display.panel',
		'display.refresh_hz',
		'camera',
		'audio',
		'keyboard',
		'notes',
	],
	monitor: [
		'cpu',
		'ram',
		'storage',
		'gpu',
		'os',
		'camera',
		'audio',
		'keyboard',
		'display.response_time_ms',
		'display.aspect_ratio',
		'display.brightness_nits',
		'connectivity.wifi',
		'connectivity.bluetooth',
		'connectivity.ethernet',
		'connectivity.power_input',
		'notes',
	],
};

const shouldShowFieldByProductKind = (productKind: ProductKind, fieldName: string) => {
	const hiddenFields = FIELDS_TO_HIDE[productKind] ?? [];
	return !hiddenFields.includes(fieldName);
};

const DEFAULT_ATTRIBUTES: AttributesData = {
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

const sanitiseAttributesInput = (value: unknown, applyDefaultsFlag = true): AttributesData => {
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

const areAttributesEqual = (a: AttributesData, b: AttributesData): boolean => {
	return JSON.stringify(a) === JSON.stringify(b);
};

export const useDynamicAttributesEditor = () => {
	const { values, setFieldValue } = useFormikContext<ProductDetailForm>();
	const [attributes, setAttributes] = useState<AttributesData>({});
	const setFieldValueRef = useRef(setFieldValue);
	const isUpdatingFromFormik = useRef(false);

	useEffect(() => {
		setFieldValueRef.current = setFieldValue;
	}, [setFieldValue]);

	const productTypeStr = values.product_type || 'desktop_pc';
	const currentProductKind: ProductKind =
		(attributes.product_kind as ProductKind) || (productTypeStr as ProductKind);

	useEffect(() => {
		const nextAttributes = sanitiseAttributesInput(values.attributes_json);

		setAttributes((prev) => {
			if (areAttributesEqual(prev, nextAttributes)) {
				return prev;
			}
			isUpdatingFromFormik.current = true;
			return nextAttributes;
		});
	}, [values.attributes_json]);

	useEffect(() => {
		if (isUpdatingFromFormik.current) {
			isUpdatingFromFormik.current = false;
			return;
		}

		const currentFormikValue = values.attributes_json;
		const sanitised = sanitiseAttributesInput(currentFormikValue, false);

		if (!areAttributesEqual(attributes, sanitised)) {
			setFieldValueRef.current('attributes_json', attributes, false);
		}
	}, [attributes]);

	useEffect(() => {
		const productType = values.product_type;

		if (!productType || !VALID_PRODUCT_KINDS.includes(productType as ProductKind)) {
			return;
		}

		const currentProductKind = attributes.product_kind;

		if (currentProductKind !== productType) {
			setAttributes((prev) => ({
				...prev,
				product_kind: productType,
			}));
		}
	}, [values.product_type, attributes.product_kind]);

	const updateAttribute = useCallback((path: string, value: unknown) => {
		setAttributes((prev) => {
			const updated = { ...prev };
			const keys = path.split('.');
			let current: Record<string, unknown> = updated;

			for (let index = 0; index < keys.length - 1; index += 1) {
				const key = keys[index];
				const next = current[key];
				if (typeof next !== 'object' || next === null) {
					current[key] = {};
				}
				current = current[key] as Record<string, unknown>;
			}

			current[keys[keys.length - 1]] = value;
			return updated;
		});
	}, []);

	const currentCpuBrand = attributes.cpu?.brand || '';

	const isFieldVisible = useCallback(
		(fieldName: string) => shouldShowFieldByProductKind(currentProductKind, fieldName),
		[currentProductKind],
	);

	return {
		attributes,
		updateAttribute,
		currentProductKind,
		currentCpuBrand,
		isFieldVisible,
	};
};

export type { ProductKind };
export { shouldShowFieldByProductKind };
