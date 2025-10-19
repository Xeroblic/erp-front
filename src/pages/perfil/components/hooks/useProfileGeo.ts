import { useEffect, useRef, useState } from 'react';
import ApiService from '@/services/ApiService';
import type { TSelectOption } from '@/components/form/SelectReact';

type Region = { codigo: string; nombre: string; codigo_padre?: string };
type Provincia = { codigo: string; nombre: string; codigo_padre?: string };
type Comuna = { codigo: string; nombre: string; codigo_padre?: string };

type FormikLike = {
	values: { region: string; provincia: string; comuna: string } & Record<string, any>;
	setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
};

export function useProfileGeo(
	formik: FormikLike,
	listaRegiones: Region[],
	listaProvincias: Provincia[],
	listaComunas: Comuna[],
) {
	const [optionsRegion, setOptionsRegion] = useState<TSelectOption[]>([]);
	const [optionsProvincia, setOptionsProvincia] = useState<TSelectOption[]>([]);
	const [optionsComuna, setOptionsComuna] = useState<TSelectOption[]>([]);

	useEffect(() => {
		setOptionsRegion(
			(listaRegiones || [])
				.filter((r) => r?.codigo !== undefined)
				.map((r) => ({ value: String(r.codigo), label: r.nombre })),
		);
	}, [listaRegiones]);

	const derivedGeoRef = useRef(false);
	useEffect(() => {
		if (derivedGeoRef.current) return;
		const needsDerive = (!formik.values.region || !formik.values.provincia) && !!formik.values.comuna;
		if (!needsDerive) return;

		const comunaId = parseInt(formik.values.comuna, 10);
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
				const regionId = raw?.province?.region?.id ?? raw?.region_id ?? raw?.province?.region_id;
				if (regionId) formik.setFieldValue('region', String(regionId), false);
				if (provinceId) formik.setFieldValue('provincia', String(provinceId), false);
				if (!formik.values.comuna || String(formik.values.comuna) !== String(comunaId)) {
					formik.setFieldValue('comuna', String(comunaId), false);
				}
				derivedGeoRef.current = true;
			} catch {

			}
		})();
	}, [formik.values.comuna]);

	useEffect(() => {
		if (!formik.values.region) {
			setOptionsProvincia([]);
			if (formik.values.provincia) formik.setFieldValue('provincia', '', false);
			if (formik.values.comuna) formik.setFieldValue('comuna', '', false);
			return;
		}

		const filtered = (listaProvincias || []).filter((p) =>
			p?.codigo !== undefined && String(p.codigo_padre) === formik.values.region,
		);

		setOptionsProvincia(filtered.map((p) => ({ value: String(p.codigo), label: p.nombre })));

		const provinciaValida = filtered.some((p) => String(p.codigo) === formik.values.provincia);
		if (!provinciaValida) {
			if (formik.values.provincia) formik.setFieldValue('provincia', '', false);
			if (formik.values.comuna) formik.setFieldValue('comuna', '', false);
		}
	}, [formik.values.region, listaProvincias]);

  useEffect(() => {
    if (!formik.values.provincia) {
      setOptionsComuna([]);
      return;
    }

    const all = listaComunas || [];
    if (all.length === 0) {
      return;
    }

    const filtered = all.filter(
      (c) => c?.codigo !== undefined && String(c.codigo_padre) === formik.values.provincia,
    );

    let opts = filtered.map((c) => ({ value: String(c.codigo), label: c.nombre }));
    const currentComuna = formik.values.comuna ? String(formik.values.comuna) : '';
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
    setOptionsComuna(opts);

    if (opts.length > 0) {
      const comunaValida = opts.some((c) => String(c.value) === String(formik.values.comuna));
      if (!comunaValida && formik.values.comuna) {
        formik.setFieldValue('comuna', '', false);
      }
    }
  }, [formik.values.provincia, listaComunas]);

	return { optionsRegion, optionsProvincia, optionsComuna };
}
