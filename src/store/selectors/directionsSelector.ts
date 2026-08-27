// src/store/selectors/directionSelector.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/rootReducer'; // Ajusta la ruta

const selectAllRegiones = (state: RootState) => state.core.listaRegiones || [];
const selectAllProvincias = (state: RootState) => state.core.listaProvincias || [];
const selectAllComunas = (state: RootState) => state.core.listaComunas || [];

export const selectComunasSearchOptions = createSelector(
	[selectAllRegiones, selectAllProvincias, selectAllComunas],
	(regiones, provincias, comunas) => {
		if (!comunas.length) return [];

		const regionMap = new Map(regiones.map((r) => [r.codigo, r]));
		const provinceMap = new Map(provincias.map((p) => [p.codigo, p]));

		const options = comunas.map((comuna) => {
			const provincia = provinceMap.get(comuna.codigo_padre);
			const region = provincia ? regionMap.get(provincia.codigo_padre) : null;

			const comunaName = comuna?.nombre || 'Comuna desconocida';
			const provinciaName = provincia?.nombre || '';
			const regionName = region?.nombre || '';

			const label = [comunaName, provinciaName, regionName].filter(Boolean).join(', ');

			return {
				value: comuna.codigo,
				label: label,
				data: {
					comuna_id: comuna.codigo,
					province_id: provincia?.codigo || null,
					region_id: region?.codigo || null,
				},
			};
		});

		return options.sort((a, b) => a.label.localeCompare(b.label));
	},
);
