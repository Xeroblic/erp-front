import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import INVENTORY_STOCK_USE_MOCKS from '@/config/inventoryStock.config';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppSelector } from '@/store';
import {
	AJUSTES_TRASLADOS_TAB_PARAM,
	DEFAULT_AJUSTES_TRASLADOS_TAB,
	isAjustesTrasladosTab,
	type AjustesTrasladosAccess,
	type AjustesTrasladosTab,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

/**
 * Contexto compartido por las dos pestañas: sucursal, autorización y pestaña
 * activa. Ajuste y traslado comparten permiso y contexto, así que se resuelven
 * una sola vez antes de montar cualquiera de los dos formularios.
 */
const useAjustesTraslados = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	const [searchParams, setSearchParams] = useSearchParams();

	// Sección 15 del contrato: traslados y ajustes son `edit-product` sobre las
	// ubicaciones de la sucursal, no un permiso propio inventado.
	const canWrite = authorize({
		permission: 'edit-product',
		branchId,
		subsidiaryId,
		scope: 'access',
	});

	let access: AjustesTrasladosAccess = 'ready';
	if (isLoading) access = 'loading';
	else if (!branchId) access = 'no-branch';
	else if (!canWrite) access = 'forbidden';
	else if (!INVENTORY_STOCK_USE_MOCKS) access = 'disabled';

	const requestedTab = searchParams.get(AJUSTES_TRASLADOS_TAB_PARAM);
	const activeTab: AjustesTrasladosTab = isAjustesTrasladosTab(requestedTab)
		? requestedTab
		: DEFAULT_AJUSTES_TRASLADOS_TAB;

	const changeTab = useCallback(
		(tabId: string) => {
			if (!isAjustesTrasladosTab(tabId)) return;
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set(AJUSTES_TRASLADOS_TAB_PARAM, tabId);
					return next;
				},
				{ replace: true },
			);
		},
		[setSearchParams],
	);

	return useMemo(
		() => ({
			access,
			branchId,
			subsidiaryId,
			owner: `${userId}:${subsidiaryId}:${branchId}`,
			activeTab,
			changeTab,
		}),
		[access, branchId, subsidiaryId, userId, activeTab, changeTab],
	);
};

export default useAjustesTraslados;
