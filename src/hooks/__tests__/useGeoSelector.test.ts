import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/services/ApiService', () => ({
	default: { fetchData: vi.fn(() => Promise.resolve({ data: { data: null } })) },
}));

import { useGeoSelector } from '../useGeoSelector';

type Values = Record<string, unknown>;

const makeFormik = (values: Values) => ({
	values,
	setFieldValue: vi.fn(),
});

// Referencias ESTABLES: el hook usa `listas.<x>` como dependencia de efecto, así
// que pasar arrays nuevos en cada render provocaría un loop infinito de renders.
const EMPTY: never[] = [];
const regiones = [
	{ codigo: '1', nombre: 'Metropolitana' },
	{ codigo: '2', nombre: 'Valparaíso' },
];
const provincias = [
	{ codigo: '11', nombre: 'Santiago', codigo_padre: '1' },
	{ codigo: '21', nombre: 'Quillota', codigo_padre: '2' },
];
const comunas = [
	{ codigo: '111', nombre: 'Ñuñoa', codigo_padre: '11' },
	{ codigo: '999', nombre: 'Especial', codigo_padre: '88' },
];

describe('useGeoSelector', () => {
	it('mapea regiones a opciones {value,label}', () => {
		const formik = makeFormik({ region: '', provincia: '', comuna: '' });
		const { result } = renderHook(() =>
			useGeoSelector(formik, { regiones, provincias, comunas: EMPTY }),
		);
		expect(result.current.optionsRegion).toEqual([
			{ value: '1', label: 'Metropolitana' },
			{ value: '2', label: 'Valparaíso' },
		]);
	});

	it('filtra provincias por codigo_padre === región seleccionada', () => {
		const formik = makeFormik({ region: '1', provincia: '11', comuna: '' });
		const { result } = renderHook(() =>
			useGeoSelector(formik, { regiones, provincias, comunas: EMPTY }),
		);
		expect(result.current.optionsProvincia).toEqual([{ value: '11', label: 'Santiago' }]);
	});

	it('sin región: limpia opciones de provincia y resetea los campos dependientes', () => {
		const formik = makeFormik({ region: '', provincia: '11', comuna: '111' });
		const { result } = renderHook(() =>
			useGeoSelector(formik, { regiones, provincias, comunas }),
		);
		expect(result.current.optionsProvincia).toEqual([]);
		expect(formik.setFieldValue).toHaveBeenCalledWith('provincia', '', false);
		expect(formik.setFieldValue).toHaveBeenCalledWith('comuna', '', false);
	});

	it('filtra comunas por codigo_padre === provincia seleccionada', () => {
		const formik = makeFormik({ region: '1', provincia: '11', comuna: '' });
		const { result } = renderHook(() =>
			useGeoSelector(formik, { regiones, provincias, comunas }),
		);
		expect(result.current.optionsComuna).toEqual([{ value: '111', label: 'Ñuñoa' }]);
	});

	it('inyecta la comuna preseleccionada aunque no pertenezca a la provincia', () => {
		const formik = makeFormik({ region: '1', provincia: '11', comuna: '999' });
		const { result } = renderHook(() =>
			useGeoSelector(formik, { regiones, provincias, comunas }),
		);
		// La comuna 999 (preseleccionada) queda al frente con su label real
		expect(result.current.optionsComuna[0]).toEqual({ value: '999', label: 'Especial' });
		expect(result.current.optionsComuna).toContainEqual({ value: '111', label: 'Ñuñoa' });
	});

	it('respeta los nombres de campo personalizados (cfg)', () => {
		const formik = makeFormik({ reg: '1', prov: '11', com: '' });
		const { result } = renderHook(() =>
			useGeoSelector(
				formik,
				{ regiones, provincias, comunas },
				{
					fieldRegion: 'reg',
					fieldProvincia: 'prov',
					fieldComuna: 'com',
				},
			),
		);
		expect(result.current.optionsProvincia).toEqual([{ value: '11', label: 'Santiago' }]);
	});
});
