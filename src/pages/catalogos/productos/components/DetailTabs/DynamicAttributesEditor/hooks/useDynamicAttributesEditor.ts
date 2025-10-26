import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '@/pages/catalogos/productos/types/products.types';
import type { AttributesData, ProductKind } from '../types';

const PRODUCT_TYPE_TO_KIND: Record<string, ProductKind> = {
	computador_reacondicionado: 'desktop_pc',
	notebook_reacondicionado: 'notebook',
	aio_reacondicionado: 'aio',
	monitor_reacondicionado: 'monitor',
};

const FIELDS_TO_HIDE: Record<ProductKind, string[]> = {
	general: [],
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
	],
};

const getDefaultProductKind = (productType: string): ProductKind => {
	return PRODUCT_TYPE_TO_KIND[productType] ?? 'desktop_pc';
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

const sanitiseAttributesInput = (value: unknown): AttributesData => {
	if (!value) {
		return applyDefaults({});
	}

	let parsed: unknown = value;

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed);
		} catch {
			return applyDefaults({});
		}
	}

	if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
		return applyDefaults({});
	}

	const attributes = parsed as AttributesData;
	return applyDefaults(attributes);
};

const areAttributesEqual = (a: AttributesData, b: AttributesData): boolean => {
	return JSON.stringify(a) === JSON.stringify(b);
};

export const useDynamicAttributesEditor = () => {
	const { values, setFieldValue } = useFormikContext<ProductDetailForm>();
	const [attributes, setAttributes] = useState<AttributesData>({});

	const productType = values.product_type || 'general';
	const defaultProductKind = useMemo(
		() => getDefaultProductKind(productType),
		[productType],
	);

	const previousProductType = useRef<string>(productType);

	useEffect(() => {
		const nextAttributes = sanitiseAttributesInput(values.attributes_json);

		setAttributes((prev) => {
			if (areAttributesEqual(prev, nextAttributes)) {
				return prev;
			}
			return nextAttributes;
		});
	}, [values.attributes_json]);

	useEffect(() => {
		setFieldValue('attributes_json', attributes);
	}, [attributes, setFieldValue]);

	useEffect(() => {
		setAttributes((prev) => {
			const shouldSync =
				!prev.product_kind || previousProductType.current !== productType;

			if (!shouldSync) {
				return prev;
			}

			if (prev.product_kind === defaultProductKind) {
				return prev;
			}

			return { ...prev, product_kind: defaultProductKind };
		});

		previousProductType.current = productType;
	}, [defaultProductKind, productType]);

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

	const currentProductKind = (attributes.product_kind as ProductKind | undefined) ?? defaultProductKind;
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
export { getDefaultProductKind, shouldShowFieldByProductKind };
