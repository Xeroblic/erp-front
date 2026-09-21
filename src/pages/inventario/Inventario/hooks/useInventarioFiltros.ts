import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
	TInventoryStockSort,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';
import {
	parseInventarioFiltros,
	serializeInventarioFiltros,
	type IInventarioFiltros,
	type TInventarioUbicacion,
	type TInventarioVista,
} from '@/pages/inventario/Inventario/types';

/**
 * Filtros de Inventario sincronizados con la URL (`?vista&bodega&estado&q…`).
 *
 * Viven en la URL y no en `useState` para que cada alerta pueda enlazar a su
 * lista filtrada, el botón «atrás» deshaga un filtro y un enlace copiado abra
 * exactamente lo mismo. No son un formulario que se envía: no hay nada que
 * validar, así que no usan Formik (mismo criterio que `useStockPorUbicacion`).
 *
 * Cualquier cambio de filtro vuelve a la página 1; sólo paginar la conserva.
 */
const useInventarioFiltros = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const filtros = useMemo(() => parseInventarioFiltros(searchParams), [searchParams]);

	const update = useCallback(
		(patch: Partial<IInventarioFiltros>) => {
			setSearchParams(
				(previous) =>
					serializeInventarioFiltros({
						...parseInventarioFiltros(previous),
						page: 1,
						...patch,
					}),
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	// Por bodega no filtra productos: al entrar se limpian, para que ninguna
	// alerta quede marcada como activa sobre una lista que no se está viendo.
	const setVista = useCallback(
		(vista: TInventarioVista) =>
			update(
				vista === 'bodegas'
					? { vista, ubicacion: 'branch', estado: null, busqueda: '' }
					: { vista },
			),
		[update],
	);
	const setUbicacion = useCallback(
		(ubicacion: TInventarioUbicacion) => update({ ubicacion }),
		[update],
	);
	const setEstado = useCallback(
		(estado: TInventoryStockStatusFilter | null) => update({ estado }),
		[update],
	);
	const setBusqueda = useCallback((busqueda: string) => update({ busqueda }), [update]);
	const setOrden = useCallback((orden: TInventoryStockSort) => update({ orden }), [update]);
	const paginate = useCallback(
		(page: number, perPage: number) => update({ page, perPage }),
		[update],
	);

	const limpiar = useCallback(
		() =>
			update({
				ubicacion: 'branch',
				estado: null,
				busqueda: '',
				orden: 'name',
			}),
		[update],
	);

	const hasFilters =
		filtros.ubicacion !== 'branch' || filtros.estado !== null || filtros.busqueda.trim() !== '';

	return {
		filtros,
		hasFilters,
		setVista,
		setUbicacion,
		setEstado,
		setBusqueda,
		setOrden,
		paginate,
		limpiar,
	};
};

export default useInventarioFiltros;
