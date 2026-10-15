import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useSubsidiaryRolloutStage } from '@/hooks/useSubsidiaryRolloutStage';
import { useAppSelector } from '@/store';
import {
	AJUSTES_TRASLADOS_PRODUCT_PARAM,
	AJUSTES_TRASLADOS_TAB_PARAM,
	AJUSTES_TRASLADOS_WAREHOUSE_PARAM,
	DEFAULT_AJUSTES_TRASLADOS_TAB,
	isAjustesTrasladosTab,
	NO_PRESELECTION,
	parsePreselection,
	type AjustesTrasladosAccess,
	type AjustesTrasladosTab,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

/** En la etapa 1 (una sola ubicación) la pestaña de traslados no existe. */
const isAvailableTab = (tab: string, multiLocation: boolean): boolean =>
	multiLocation || tab !== 'traslado';

/**
 * Contexto compartido por las dos pestañas: sucursal, autorización y pestaña
 * activa. Ajuste y traslado comparten permiso y contexto, así que se resuelven
 * una sola vez antes de montar cualquiera de los dos formularios.
 */
const useAjustesTraslados = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	// Etapa de la filial activa. Mientras no se conoce, la pantalla es la de la etapa 1.
	const { isMultiLocation } = useSubsidiaryRolloutStage(subsidiaryId);
	const userId = useAppSelector((state) => state.auth.user?.id);
	const [searchParams, setSearchParams] = useSearchParams();

	// El contrato no define un permiso propio: traslados y ajustes son
	// `edit-product` sobre las ubicaciones de la sucursal. El backend además
	// exige *operar* en ella (excluye a `subsidiary-member`/`company-member`),
	// algo que el perfil no expone por sucursal: ese 403 llega al enviar y el
	// panel lo muestra con el mensaje del servidor, sin ofrecer reintento.
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

	const requestedTab = searchParams.get(AJUSTES_TRASLADOS_TAB_PARAM);
	// Un enlace guardado a traslados cae al ajuste mientras la pestaña está oculta.
	const tabHidden = requestedTab !== null && !isAvailableTab(requestedTab, isMultiLocation);
	const activeTab: AjustesTrasladosTab =
		isAjustesTrasladosTab(requestedTab) && !tabHidden
			? requestedTab
			: DEFAULT_AJUSTES_TRASLADOS_TAB;

	// Producto y ubicación con que se abrió la página (p. ej. desde la ficha de
	// inventario). Sólo se usan al montar el formulario de la pestaña activa: la
	// de una pestaña oculta era el origen de un traslado, no la ubicación de un
	// ajuste, y se descarta.
	const rawWarehouse = searchParams.get(AJUSTES_TRASLADOS_WAREHOUSE_PARAM);
	const rawProduct = searchParams.get(AJUSTES_TRASLADOS_PRODUCT_PARAM);
	const preselection = useMemo(
		() => (tabHidden ? NO_PRESELECTION : parsePreselection(rawWarehouse, rawProduct)),
		[tabHidden, rawWarehouse, rawProduct],
	);

	const changeTab = useCallback(
		(tabId: string) => {
			if (!isAjustesTrasladosTab(tabId) || !isAvailableTab(tabId, isMultiLocation)) return;
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					next.set(AJUSTES_TRASLADOS_TAB_PARAM, tabId);
					// Cambiar de pestaña reinicia el progreso: la otra pestaña se
					// monta vacía, sin heredar la preselección de la anterior.
					next.delete(AJUSTES_TRASLADOS_PRODUCT_PARAM);
					next.delete(AJUSTES_TRASLADOS_WAREHOUSE_PARAM);
					return next;
				},
				{ replace: true },
			);
		},
		[setSearchParams, isMultiLocation],
	);

	return useMemo(
		() => ({
			access,
			branchId,
			subsidiaryId,
			owner: `${userId}:${subsidiaryId}:${branchId}`,
			isMultiLocation,
			activeTab,
			changeTab,
			preselection,
		}),
		[
			access,
			branchId,
			subsidiaryId,
			userId,
			isMultiLocation,
			activeTab,
			changeTab,
			preselection,
		],
	);
};

export default useAjustesTraslados;
