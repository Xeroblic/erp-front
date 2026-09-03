import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '@/pages/catalogos/productos/types/products.types';
import { normalizePortTypeCounts } from '@/pages/refactor-technical-review/components/validation/constants/ports.rules';
import type { ReviewData, ProductKind } from '../types';
import { getVisibleTabs } from '../constants/tabs.config';

const VALID_KINDS: ProductKind[] = ['desktop_pc', 'notebook', 'aio', 'monitor', 'docking'];

/** Campos cuyo valor es un desglose `{tipo: cantidad}` y no un escalar. */
const BREAKDOWN_FIELDS = ['loose_port_types', 'defective_port_types'] as const;

const asRecord = (v: unknown): Record<string, unknown> | null =>
	v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

export const useReviewAttributes = () => {
	const { values, setFieldValue } = useFormikContext<ProductDetailForm>();

	const productKind: ProductKind = useMemo(() => {
		const pt = values.product_type ?? '';
		if (VALID_KINDS.includes(pt as ProductKind)) return pt as ProductKind;
		const attrs = asRecord(values.attributes_json);
		const pk = attrs?.product_kind;
		if (typeof pk === 'string' && VALID_KINDS.includes(pk as ProductKind))
			return pk as ProductKind;
		return 'notebook';
	}, [values.product_type, values.attributes_json]);

	const [reviewData, setReviewData] = useState<ReviewData>({});
	const isUpdatingFromFormik = useRef(false);

	useEffect(() => {
		const attrs = asRecord(values.attributes_json);
		const raw = asRecord(attrs?.review);
		if (!raw) {
			if (Object.keys(reviewData).length > 0) {
				isUpdatingFromFormik.current = true;
				setReviewData({});
			}
			return;
		}
		isUpdatingFromFormik.current = true;
		setReviewData(raw as ReviewData);
	}, [values.attributes_json]);

	useEffect(() => {
		if (isUpdatingFromFormik.current) {
			isUpdatingFromFormik.current = false;
			return;
		}
		const attrs = asRecord(values.attributes_json) ?? {};
		const currentReview = asRecord(attrs.review);
		const hasChanged = JSON.stringify(currentReview ?? {}) !== JSON.stringify(reviewData);
		if (hasChanged) {
			void setFieldValue('attributes_json', { ...attrs, review: reviewData }, false);
		}
	}, [reviewData]);

	const updateField = useCallback((field: string, value: unknown) => {
		setReviewData((prev) => ({ ...prev, [field]: value }));
	}, []);

	const importFromReview = useCallback((details: Record<string, unknown>) => {
		const mapped: ReviewData = {};
		const fields: (keyof ReviewData)[] = [
			'general_condition',
			'screen_condition',
			'dead_pixels_count',
			'spots_count',
			'screen_inches',
			'screen_resolution',
			'is_touchscreen',
			'cover_condition',
			'hinge_condition',
			'touchpad_condition',
			'bottom_condition',
			'stand_condition',
			'frame_condition',
			'keyboard_condition',
			'keyboard_cover_condition',
			'keyboard_layout',
			'has_numeric_keypad',
			'has_backlit_keyboard',
			'battery_status',
			'battery_percentage',
			'battery_health',
			'brand',
			'model',
			'line',
			'processor',
			'ram_size',
			'ram_slots',
			'ram_type',
			'storage_size',
			'storage_technology',
			'vga_ports',
			'hdmi_ports',
			'displayport_ports',
			'usb_c_ports',
			'usb_a_ports',
			'sd_readers',
			'rj45_ports',
			'dvi_ports',
			'charging_ports',
			'has_usb_hub',
			'all_ports_functional',
			'defective_ports_count',
			'defective_ports_critical_count',
			'loose_ports_count',
			'includes_charger',
			'charger_watts',
			'charger_status',
			'includes_power_adapter',
			'includes_power_cable',
			'includes_video_cable',
			'includes_stand',
			'operating_system',
			'has_biometric',
			'has_wifi',
			'has_bluetooth',
			'has_cd_drive',
			'observations',
		];
		for (const f of fields) {
			if (details[f] !== undefined && details[f] !== null) {
				(mapped as Record<string, unknown>)[f] = details[f];
			}
		}

		// Los dos desgloses no se copian en crudo: una revisión anterior al contrato de
		// mapa los guardó como lista de tipos (`['hdmi','usb_c']`), y el editor sólo sabe
		// mostrar el mapa `{tipo: cantidad}`. `null` es «no se midió» y se omite; `{}` es
		// «se midió, ninguno» y sí se conserva, así que el filtro mira nulidad, no vacío.
		BREAKDOWN_FIELDS.forEach((field) => {
			const raw = details[field];
			if (raw === undefined || raw === null) return;
			mapped[field] = normalizePortTypeCounts(raw);
		});

		setReviewData(mapped);
	}, []);

	const visibleTabs = useMemo(() => getVisibleTabs(productKind), [productKind]);

	return {
		reviewData,
		updateField,
		productKind,
		visibleTabs,
		importFromReview,
	};
};
