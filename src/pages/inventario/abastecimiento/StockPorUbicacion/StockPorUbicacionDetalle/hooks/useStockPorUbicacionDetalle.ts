import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import { getInventoryWarehouses } from '@/services/procurement/inventoryStock.service';
import type { IInventoryStockRow } from '@/interface/procurement.interface';
import { inventoryLocationParams } from '@/pages/inventario/abastecimiento/StockPorUbicacion/types';

interface IStockPorUbicacionDetalleNavigationState {
	row?: IInventoryStockRow;
	location?: string;
	owner?: string;
}

/**
 * Ficha de stock de un producto en una ubicación (sección 8 del contrato):
 * procedencias por FIFO y «Documentar stock inicial» viven acá, no
 * expandidos en la fila del listado (StockPorUbicacionView).
 *
 * La ubicación (`branch` | `unlocated` | `warehouse:<id>`) vigente al hacer
 * clic viaja en la URL vía `?location=`, así el deep-link reproduce la misma
 * consulta. La fila agregada (físico/apto/documentado…) viaja en el `state`
 * de navegación como atajo — evita repetir la consulta de listado sólo para
 * pintar el resumen — y por eso sólo existe cuando se llegó haciendo clic
 * desde el listado; un deep-link o un refresh no la trae, y el resumen se
 * omite (las procedencias, que sí se piden acá, no dependen de ella).
 */
const useStockPorUbicacionDetalle = () => {
	const { productId: productIdParam } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const routerLocation = useLocation();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const userId = useAppSelector((state) => state.auth.user?.id);

	const productId = Number(productIdParam);
	const hasValidProductId = Number.isFinite(productId) && productId > 0;

	const navigationState = (routerLocation.state ??
		null) as IStockPorUbicacionDetalleNavigationState | null;
	const location = searchParams.get('location') ?? 'branch';
	const locationParams = useMemo(() => inventoryLocationParams(location), [location]);
	const hasValidLocation =
		location === 'branch' ||
		location === 'unlocated' ||
		(typeof branchId === 'number' &&
			/^warehouse:[1-9]\d*$/.test(location) &&
			getInventoryWarehouses(branchId).some(
				(warehouse) => warehouse.id === locationParams.warehouse_id,
			));
	const summaryOwner = `${userId}:${subsidiaryId}:${branchId}`;
	const isNavigationSnapshotCurrent = Boolean(
		navigationState?.row &&
			navigationState.owner === summaryOwner &&
			navigationState.location === location &&
			navigationState.row.product.id === productId,
	);
	const snapshotIdentity = `${routerLocation.key}:${summaryOwner}:${location}:${productId}`;
	const [summarySnapshot, setSummarySnapshot] = useState<{
		identity: string;
		row: IInventoryStockRow | null;
	}>({
		identity: snapshotIdentity,
		row: isNavigationSnapshotCurrent ? (navigationState?.row ?? null) : null,
	});
	const activeSnapshotIdentityRef = useRef(snapshotIdentity);
	activeSnapshotIdentityRef.current = snapshotIdentity;
	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	const currentRow =
		summarySnapshot.identity === snapshotIdentity
			? summarySnapshot.row
			: (navigationState?.row ?? null);
	const summaryRow = isNavigationSnapshotCurrent ? currentRow : null;

	const owner = `${userId}:${subsidiaryId}:${branchId}:stock-detalle:${productId}`;
	const handleDocumented = useCallback(
		(quantity: number) => {
			if (
				!mountedRef.current ||
				activeSnapshotIdentityRef.current !== snapshotIdentity ||
				!summaryRow
			)
				return;
			setSummarySnapshot((current) => {
				const row = current.identity === snapshotIdentity ? current.row : summaryRow;
				return {
					identity: snapshotIdentity,
					row: row
						? {
								...row,
								documented_quantity: row.documented_quantity + quantity,
								undocumented_quantity: row.undocumented_quantity - quantity,
							}
						: null,
				};
			});
		},
		[snapshotIdentity, summaryRow],
	);

	const goToList = useCallback(() => navigate('/inventario/abastecimiento/stock'), [navigate]);

	return {
		productId,
		hasValidProductId,
		branchId,
		subsidiaryId,
		location,
		locationParams,
		hasValidLocation,
		summaryRow,
		owner,
		handleDocumented,
		goToList,
	};
};

export default useStockPorUbicacionDetalle;
