import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
	TInventoryStockSort,
	TInventoryStockStatusFilter,
} from '@/interface/inventoryOverview.interface';
import {
	DEFAULT_INVENTARIO_FILTROS,
	parseInventarioFiltros,
	serializeInventarioFiltros,
	type IInventarioFiltros,
	type TInventarioUbicacion,
	type TInventarioVista,
	type TOperacionTipo,
} from '@/pages/inventario/Inventario/types';

/** Filtros que cada pestaña limpia al cambiar: los de una no significan nada en la otra. */
const SIN_FILTROS: Partial<IInventarioFiltros> = {
	ubicacion: DEFAULT_INVENTARIO_FILTROS.ubicacion,
	estado: DEFAULT_INVENTARIO_FILTROS.estado,
	busqueda: DEFAULT_INVENTARIO_FILTROS.busqueda,
	orden: DEFAULT_INVENTARIO_FILTROS.orden,
	tipo: DEFAULT_INVENTARIO_FILTROS.tipo,
	desde: DEFAULT_INVENTARIO_FILTROS.desde,
	hasta: DEFAULT_INVENTARIO_FILTROS.hasta,
};

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

	// Cada pestaña entra sin filtros: Por bodega no filtra productos y la
	// búsqueda de Trazabilidad incluye proveedores y folios. Así ninguna alerta
	// queda marcada como activa sobre una lista que no se está viendo.
	const setVista = useCallback(
		(vista: TInventarioVista) => update({ ...SIN_FILTROS, vista }),
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
	const setTipo = useCallback((tipo: TOperacionTipo | null) => update({ tipo }), [update]);
	const setDesde = useCallback((desde: string) => update({ desde }), [update]);
	const setHasta = useCallback((hasta: string) => update({ hasta }), [update]);
	const paginate = useCallback(
		(page: number, perPage: number) => update({ page, perPage }),
		[update],
	);

	const limpiar = useCallback(() => update(SIN_FILTROS), [update]);

	const hasFilters =
		filtros.ubicacion !== 'branch' ||
		filtros.busqueda.trim() !== '' ||
		(filtros.vista === 'trazabilidad'
			? filtros.tipo !== null || filtros.desde !== '' || filtros.hasta !== ''
			: filtros.estado !== null);

	return {
		filtros,
		hasFilters,
		setVista,
		setUbicacion,
		setEstado,
		setBusqueda,
		setOrden,
		setTipo,
		setDesde,
		setHasta,
		paginate,
		limpiar,
	};
};

export default useInventarioFiltros;
