import { useEffect, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Tabs, { Tab } from '@/components/ui/Tabs';
import useAuthorization from '@/hooks/useAuthorization';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBranchesBySubsidiary } from '@/store/selectors/subsidiarySelectors';
import { clearInventoryReports } from '@/store/slices/reports/reportSlice';
import type { IInventoryReportBranch } from '@/interface/inventoryReports.interface';
import { INVENTARIO_PATH } from '@/pages/inventario/Inventario/types';
import useInventoryReportFilters from '@/pages/reportes/inventory-reports/hooks/useInventoryReportFilters';
import useInventoryReportSources from '@/pages/reportes/inventory-reports/hooks/useInventoryReportSources';
import DatosReport from '@/pages/reportes/inventory-reports/components/views/DatosReport';
import UmbralesReport from '@/pages/reportes/inventory-reports/components/views/UmbralesReport';
import AccionesReport from '@/pages/reportes/inventory-reports/components/views/AccionesReport';
import EstadisticasReport from '@/pages/reportes/inventory-reports/components/views/EstadisticasReport';
import {
	INVENTORY_REPORT_VIEWS,
	isInventoryReportView,
	type TInventoryReportView,
} from '@/pages/reportes/inventory-reports/inventoryReportTabs';
import {
	INVENTORY_REPORT_DEFAULT_VIEW,
	type IInventoryReportContext,
} from '@/pages/reportes/inventory-reports/types';

interface IInventoryReportsSessionProps {
	subsidiaryId: number;
	owner: string;
	/** Sucursal activa: respaldo si la personalización no lista las de la filial. */
	activeBranch: IInventoryReportBranch | null;
}

const InventoryReportsSession = ({
	subsidiaryId,
	owner,
	activeBranch,
}: IInventoryReportsSessionProps) => {
	const dispatch = useAppDispatch();
	const filtersApi = useInventoryReportFilters();
	const { filters, setVista } = filtersApi;
	const { ready, sourceOf } = useInventoryReportSources(subsidiaryId);
	const companyName = useAppSelector((state) => {
		const { user } = state.auth;
		if (user?.subsidiary?.id === subsidiaryId) return user.subsidiary.name;
		if (user?.branch?.subsidiary?.id === subsidiaryId) return user.branch.subsidiary.name;
		return null;
	});
	const subsidiaryBranches = useAppSelector(
		(state) => selectBranchesBySubsidiary(state, subsidiaryId),
		shallowEqual,
	);

	const branches = useMemo<IInventoryReportBranch[]>(() => {
		const list = subsidiaryBranches.map((branch) => ({
			id: branch.id,
			name: branch.branch_name,
		}));
		return list.length === 0 && activeBranch ? [activeBranch] : list;
	}, [subsidiaryBranches, activeBranch]);

	const scopeLabel =
		filters.sucursal === null
			? 'Todas las sucursales'
			: (branches.find((branch) => branch.id === filters.sucursal)?.name ??
				'Sucursal seleccionada');

	const context = useMemo<IInventoryReportContext>(
		() => ({ subsidiaryId, owner, branches, scopeLabel, companyName, sourceOf }),
		[subsidiaryId, owner, branches, scopeLabel, companyName, sourceOf],
	);

	// Libera los reportes al salir de la pantalla o cambiar de contexto.
	useEffect(
		() => () => {
			dispatch(clearInventoryReports());
		},
		[dispatch],
	);

	const views = INVENTORY_REPORT_VIEWS.filter((view) =>
		view.reports.every((type) => sourceOf(type) !== null),
	);
	// Datos se muestra de inmediato; otra pestaña espera a saber si existe.
	let activeView: TInventoryReportView | null = INVENTORY_REPORT_DEFAULT_VIEW;
	if (filters.vista !== INVENTORY_REPORT_DEFAULT_VIEW) {
		if (!ready) activeView = null;
		else if (views.some((view) => view.id === filters.vista)) activeView = filters.vista;
	}

	const renderView = (view: TInventoryReportView) => {
		if (view === 'umbrales')
			return <UmbralesReport context={context} filtersApi={filtersApi} />;
		if (view === 'acciones')
			return <AccionesReport context={context} filtersApi={filtersApi} />;
		if (view === 'estadisticas')
			return <EstadisticasReport context={context} filtersApi={filtersApi} />;
		return <DatosReport context={context} filtersApi={filtersApi} />;
	};

	if (!activeView)
		return (
			<p role='status' className='text-sm text-zinc-500'>
				Cargando reportes disponibles…
			</p>
		);
	if (views.length < 2) return renderView(activeView);
	return (
		<Tabs
			activeTab={activeView}
			onTabChange={(tabId) => {
				if (isInventoryReportView(tabId)) setVista(tabId);
			}}
			variant='pills'
			contentClassName='!mt-4'>
			{views.map((view) => (
				<Tab key={view.id} id={view.id} text={view.label} icon={view.icon}>
					{activeView === view.id && renderView(view.id)}
				</Tab>
			))}
		</Tabs>
	);
};

/**
 * Reportes › Inventario: datos, umbrales, acciones y estadísticas de todas
 * las sucursales de la empresa. Mismo formato que Inventario, que responde lo
 * operativo de la sucursal activa y enlaza acá.
 */
const InventoryReportsView = () => {
	const navigate = useNavigate();
	const { branchId, subsidiaryId, visibleBranches } = useCurrentBranch();
	const { authorize, isLoading } = useAuthorization();
	const userId = useAppSelector((state) => state.auth.user?.id);
	// Las mismas dos comprobaciones de `GET S/reports`: permiso y ver la empresa.
	const canRead = authorize({ permission: 'view-reports', subsidiaryId, scope: 'visible' });
	const owner = `${userId}:${subsidiaryId}`;
	const activeBranch = useMemo<IInventoryReportBranch | null>(
		() =>
			branchId === null
				? null
				: (visibleBranches.find((branch) => branch.id === branchId) ?? {
						id: branchId,
						name: `Sucursal ${branchId}`,
					}),
		[branchId, visibleBranches],
	);

	// La sesión autorizada se monta con `key` ANTES de pintar: un cambio de
	// empresa o de permiso no alcanza a mostrar datos del contexto anterior.
	let content;
	if (isLoading) content = <p role='status'>Comprobando acceso…</p>;
	else if (!subsidiaryId)
		content = (
			<Alert title='Selecciona una empresa'>
				Necesitas una empresa activa para consultar sus reportes de inventario.
			</Alert>
		);
	else if (!canRead)
		content = (
			<Alert color='amber' title='Sin permiso'>
				No tienes permiso para consultar los reportes de esta empresa.
			</Alert>
		);
	else
		content = (
			<InventoryReportsSession
				key={owner}
				owner={owner}
				subsidiaryId={subsidiaryId}
				activeBranch={activeBranch}
			/>
		);

	return (
		<PageWrapper isProtectedRoute title='Reportes de inventario'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroChartBar'
						title='Reportes de inventario'
						description='Datos, umbrales, acciones y estadísticas de todas las sucursales de la empresa'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<PermissionGuard permission='view-product'>
						<Button
							variant='outline'
							icon='HeroCube'
							onClick={() => navigate(INVENTARIO_PATH)}>
							Ver inventario
						</Button>
					</PermissionGuard>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>{content}</Container>
		</PageWrapper>
	);
};

export default InventoryReportsView;
