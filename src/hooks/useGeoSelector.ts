import { useEffect, useMemo, useRef, useState } from 'react';
import ApiService from '@/services/ApiService';
import type { TSelectOption } from '@/components/form/SelectReact';

type Region = { codigo: string; nombre: string; codigo_padre?: string };
type Provincia = { codigo: string; nombre: string; codigo_padre?: string };
type Comuna = { codigo: string; nombre: string; codigo_padre?: string };

type FormikLike = {
	values: Record<string, any>;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
};

export interface GeoSelectorConfig {
	fieldRegion?: string; // default: 'region'
	fieldProvincia?: string; // default: 'provincia'
	fieldComuna?: string; // default: 'comuna'
}

/**
 * Hook reutilizable para selects de Región/Provincia/Comuna.
 * - Igual lógica de Perfil (deriva región/provincia desde comuna cuando aplica)
 * - Permite renombrar los campos en formik
 */
export function useGeoSelector(
	formik: FormikLike,
	listas: { regiones: Region[]; provincias: Provincia[]; comunas: Comuna[] },
	cfg: GeoSelectorConfig = {},
) {
	const fieldRegion = cfg.fieldRegion ?? 'region';
	const fieldProvincia = cfg.fieldProvincia ?? 'provincia';
	const fieldComuna = cfg.fieldComuna ?? 'comuna';

	const [optionsRegion, setOptionsRegion] = useState<TSelectOption[]>([]);
	const [optionsProvincia, setOptionsProvincia] = useState<TSelectOption[]>([]);
	const [optionsComuna, setOptionsComuna] = useState<TSelectOption[]>([]);

	// Regiones -> options
	useEffect(() => {
		setOptionsRegion(
			(listas.regiones || [])
				.filter((r) => r?.codigo !== undefined)
				.map((r) => ({ value: String(r.codigo), label: r.nombre })),
		);
	}, [listas.regiones]);

	// Derivar región/provincia desde comuna cuando sólo comuna está seteada
	const derivedGeoRef = useRef(false);
	useEffect(() => {
		if (derivedGeoRef.current) return;
		const comunaVal = formik.values[fieldComuna];
		const regionVal = formik.values[fieldRegion];
		const provVal = formik.values[fieldProvincia];
		const needsDerive = (!regionVal || !provVal) && !!comunaVal;
		if (!needsDerive) return;

		const comunaId = parseInt(String(comunaVal), 10);
		if (!Number.isFinite(comunaId)) return;

		(async () => {
			try {
				const resp = await ApiService.fetchData<{ data?: any } | any>({
					url: `/communes/${comunaId}`,
					method: 'get',
					params: { with: 'province.region' },
				});
				const raw = resp.data?.data ?? resp.data;
				const provinceId = raw?.province?.id ?? raw?.province_id;
				const regionId =
					raw?.province?.region?.id ?? raw?.region_id ?? raw?.province?.region_id;
				if (regionId) formik.setFieldValue(fieldRegion, String(regionId), false);
				if (provinceId) formik.setFieldValue(fieldProvincia, String(provinceId), false);
				if (
					!formik.values[fieldComuna] ||
					String(formik.values[fieldComuna]) !== String(comunaId)
				) {
					formik.setFieldValue(fieldComuna, String(comunaId), false);
				}
				derivedGeoRef.current = true;
			} catch {
				// ignore
			}
		})();
	}, [formik.values[fieldComuna], fieldComuna, fieldProvincia, fieldRegion]);

	// Provincias -> options según región
	useEffect(() => {
		const regionVal = formik.values[fieldRegion];
		if (!regionVal) {
			setOptionsProvincia([]);
			if (formik.values[fieldProvincia]) formik.setFieldValue(fieldProvincia, '', false);
			if (formik.values[fieldComuna]) formik.setFieldValue(fieldComuna, '', false);
			return;
		}

		const filtered = (listas.provincias || []).filter(
			(p) => p?.codigo !== undefined && String(p.codigo_padre) === String(regionVal),
		);
		setOptionsProvincia(filtered.map((p) => ({ value: String(p.codigo), label: p.nombre })));

		const provinciaValida = filtered.some(
			(p) => String(p.codigo) === String(formik.values[fieldProvincia]),
		);
		if (!provinciaValida) {
			if (formik.values[fieldProvincia]) formik.setFieldValue(fieldProvincia, '', false);
			if (formik.values[fieldComuna]) formik.setFieldValue(fieldComuna, '', false);
		}
	}, [formik.values[fieldRegion], listas.provincias, fieldProvincia, fieldRegion, fieldComuna]);

	// Comunas -> options según provincia
	useEffect(() => {
		const provinciaVal = formik.values[fieldProvincia];
		// If provincia isn't set we normally clear comunas — but if the form already has a comuna value
		// we should keep it visible in the select so the user sees the preselected value.
		if (!provinciaVal) {
			const currentComuna = formik.values[fieldComuna]
				? String(formik.values[fieldComuna])
				: '';
			if (!currentComuna) {
				setOptionsComuna([]);
				return;
			}
			// Try to find the comuna in the full list to get its real label
			const all = listas.comunas || [];
			const found = all.find((c) => String(c.codigo) === currentComuna);
			const opt: TSelectOption = found
				? { value: String(found.codigo), label: found.nombre }
				: { value: currentComuna, label: 'Cargando…' };
			setOptionsComuna([opt]);
			return;
		}
		const all = listas.comunas || [];
		if (all.length === 0) return;

		const filtered = all.filter(
			(c) => c?.codigo !== undefined && String(c.codigo_padre) === String(provinciaVal),
		);
		let opts = filtered.map((c) => ({ value: String(c.codigo), label: c.nombre }));

		const currentComuna = formik.values[fieldComuna] ? String(formik.values[fieldComuna]) : '';
		if (currentComuna) {
			const exists = opts.some((o) => String(o.value) === currentComuna);
			if (!exists) {
				const inAll = all.find((c) => String(c.codigo) === currentComuna);
				if (inAll) {
					opts = [{ value: String(inAll.codigo), label: inAll.nombre }, ...opts];
				} else {
					opts = [{ value: currentComuna, label: currentComuna }, ...opts];
				}
			}
		}
		// Estabiliza: no limpiar comuna si aún no aparece en la lista.
		// Ya se inyectó una opción temporal para mantenerla visible.
		setOptionsComuna(opts);
	}, [formik.values[fieldProvincia], listas.comunas, fieldComuna, fieldProvincia]);

	return { optionsRegion, optionsProvincia, optionsComuna };
}
