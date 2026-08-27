// src/templates/layouts/Aside/DefaultAsideTemplate.tsx
import React, { PropsWithChildren, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aside, { AsideBody } from '@/components/layouts/Aside/Aside';
import Nav, { NavItem, NavCollapse, NavTitle } from '@/components/layouts/Navigation/Nav';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import AsideHeadPart from './_parts/AsideHead.part';
import AsideFooterPart from './_parts/AsideFooter.part';
import Pages from '@/config/pages.config';
import useAuthorization from '@/hooks/useAuthorization';
import type { IUserMe } from '@/interface/user.interface';

const EMPTY_ROLES: string[] = [];
const EMPTY_AUTHORITY: string[] = [];

type AuthorityGuardProps = PropsWithChildren<{
	userAuthority?: string[];
	authority?: string[];
	requireAll?: boolean;
	roles?: string[];
	requireAllRoles?: boolean;
	companyId?: number;
	subsidiaryId?: number;
	branchId?: number;
}>;

const AuthorityCheckNav = (props: AuthorityGuardProps) => {
	const {
		userAuthority,
		authority,
		requireAll = false,
		roles,
		requireAllRoles = false,
		companyId,
		subsidiaryId,
		branchId,
		children,
	} = props;

	const user = useAppSelector((s) => s.auth.user);
	const safeUserAuthority = userAuthority ?? EMPTY_AUTHORITY;
	const safeAuthority = authority ?? EMPTY_AUTHORITY;
	const safeRoles = roles ?? EMPTY_ROLES;
	const { isSuperAdmin, authorize, roles: authorizationRoles } = useAuthorization();

	const permissionMatched =
		safeAuthority.length === 0 ? true : authorize({ permissions: safeAuthority, requireAll });
	const roleMatched =
		safeRoles.length === 0
			? true
			: authorize({ roles: safeRoles, requireAll: requireAllRoles });

	// Super admin siempre pasa
	if (
		isSuperAdmin ||
		authorizationRoles.includes('super-admin') ||
		user?.authority?.includes('super-admin') ||
		safeUserAuthority.includes('super-admin')
	) {
		return <>{children}</>;
	}

	// Sin autoridad ni roles → público dentro del aside
	if (safeAuthority.length === 0 && safeRoles.length === 0) {
		return <>{children}</>;
	}

	// Debe cumplir permiso + rol
	if (!permissionMatched) return null;
	if (safeRoles.length && !roleMatched) return null;

	// Validación con contexto (empresa / subempresa / sucursal)
	if (companyId || subsidiaryId || branchId) {
		const hasContextAccess = checkNavContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) return null;
	}

	return <>{children}</>;
};

function checkNavContextualAccess(
	user: IUserMe | null | undefined,
	companyId?: number,
	subsidiaryId?: number,
	branchId?: number,
): boolean {
	if (!user) return false;

	if (user.authority?.includes('super-admin')) return true;

	if (companyId && user.company?.id !== companyId) return false;
	if (subsidiaryId && user.subsidiary?.id !== subsidiaryId) return false;
	if (branchId && user.branch?.id !== branchId) return false;

	return true;
}

const DefaultAsideTemplate = () => {
	const userAuthority = useAppSelector((s) => s.auth.user?.permisos) ?? EMPTY_AUTHORITY;
	const user = useAppSelector((s) => s.auth.user);
	const userRoles = user?.roles ?? EMPTY_ROLES;
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const navigate = useNavigate();

	const [collapseStates, setCollapseStates] = useState<Record<string, boolean>>({
		registro: false,
		inventario: false,
		comercial: false,
		reportes: false,
		integraciones: false,
		servicio: false,
		catalogos: false,
		rrhh: false,
	});

	const toggleCollapse = (key: string) => {
		setCollapseStates((prev) => {
			const closedAll = Object.keys(prev).reduce(
				(acc, k) => ({ ...acc, [k]: false }),
				{} as Record<string, boolean>,
			);
			return { ...closedAll, [key]: !prev[key] };
		});
	};

	return (
		<Aside>
			<AsideHeadPart />
			<AsideBody>
				<Nav>
					{/* HOME */}
					<AuthorityCheckNav userAuthority={userAuthority} roles={userRoles}>
						<NavItem
							text={Pages.dashboard.text}
							icon={Pages.dashboard.icon}
							to={Pages.dashboard.to}
							onClick={() => navigate(Pages.dashboard.to)}
							id={Pages.dashboard.id}
						/>
					</AuthorityCheckNav>

					{/* ======================
					 * GESTIÓN
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.manage.authority}
						userAuthority={userAuthority}>
						<NavTitle>Gestión</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.manage.authority}
						userAuthority={userAuthority}>
						<NavCollapse
							key='registro-nav'
							text='Registro'
							icon='DuoArticle'
							to=''
							isOpen={collapseStates.registro}
							onToggle={() => toggleCollapse('registro')}>
							{/* Empresa */}
							<AuthorityCheckNav
								authority={Pages.manage.subPages.company.authority}
								roles={Pages.manage.subPages.company.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.manage.subPages.company.text}
									to={Pages.manage.subPages.company.to}
									icon={Pages.manage.subPages.company.icon}
									id={Pages.manage.subPages.company.id}
									onClick={() => navigate(Pages.manage.subPages.company.to)}
								/>
							</AuthorityCheckNav>

							{/* Subempresa */}
							<AuthorityCheckNav
								authority={Pages.manage.subPages.subsidiary.authority}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.manage.subPages.subsidiary.text}
									to={Pages.manage.subPages.subsidiary.to}
									icon={Pages.manage.subPages.subsidiary.icon}
									id={Pages.manage.subPages.subsidiary.id}
									onClick={() => navigate(Pages.manage.subPages.subsidiary.to)}
								/>
							</AuthorityCheckNav>

							{/* Sucursal */}
							<AuthorityCheckNav
								authority={Pages.manage.subPages.branch.authority}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.manage.subPages.branch.text}
									to={Pages.manage.subPages.branch.to}
									icon={Pages.manage.subPages.branch.icon}
									id={Pages.manage.subPages.branch.id}
									onClick={() => navigate(Pages.manage.subPages.branch.to)}
								/>
							</AuthorityCheckNav>

							{/* Gestión de usuarios (roles + permisos) */}
							<AuthorityCheckNav
								authority={Pages.manage.subPages.rolesPermisos.authority}
								userAuthority={userAuthority}
								requireAll={Pages.manage.subPages.rolesPermisos.requireAll}>
								<NavItem
									text={Pages.manage.subPages.rolesPermisos.text}
									to={Pages.manage.subPages.rolesPermisos.to}
									icon={Pages.manage.subPages.rolesPermisos.icon}
									id={Pages.manage.subPages.rolesPermisos.id}
									onClick={() => navigate(Pages.manage.subPages.rolesPermisos.to)}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * SERVICIO TÉCNICO
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.technical.subPages.reviews.authority}
						roles={Pages.technical.subPages.reviews.roles}
						userAuthority={userAuthority}>
						<NavTitle>Servicio Técnico</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.technical.subPages.reviews.authority}
						roles={Pages.technical.subPages.reviews.roles}
						userAuthority={userAuthority}>
						<NavCollapse
							key='servicio-nav'
							text='Servicio Técnico'
							icon={Pages.technical.icon}
							to=''
							isOpen={collapseStates.servicio}
							onToggle={() => toggleCollapse('servicio')}>
							{/* Revisiones Técnicas */}
							{/* <AuthorityCheckNav
								authority={Pages.technical.subPages.reviews.authority}
								roles={Pages.technical.subPages.reviews.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.technical.subPages.reviews.text}
									to={Pages.technical.subPages.reviews.to}
									icon={Pages.technical.subPages.reviews.icon}
									id={Pages.technical.subPages.reviews.id}
									onClick={() => navigate(Pages.technical.subPages.reviews.to)}
								/>
							</AuthorityCheckNav> */}

							{/* refactor */}
							<AuthorityCheckNav
								authority={Pages.technical.subPages.refactor.authority}
								roles={Pages.technical.subPages.refactor.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.technical.subPages.refactor.text}
									to={Pages.technical.subPages.refactor.to}
									icon={Pages.technical.subPages.refactor.icon}
									id={Pages.technical.subPages.refactor.id}
									onClick={() => navigate(Pages.technical.subPages.refactor.to)}
								/>
							</AuthorityCheckNav>

							{/* Proveedores */}
							<AuthorityCheckNav
								authority={Pages.catalogs.subPages.suppliers.authority}
								roles={Pages.catalogs.subPages.suppliers.roles}
								userAuthority={userAuthority}
								requireAll={Pages.catalogs.subPages.suppliers.requireAll}>
								<NavItem
									text={Pages.catalogs.subPages.suppliers.text}
									to={Pages.catalogs.subPages.suppliers.to}
									icon={Pages.catalogs.subPages.suppliers.icon}
									id={Pages.catalogs.subPages.suppliers.id}
									onClick={() => navigate(Pages.catalogs.subPages.suppliers.to)}
								/>
							</AuthorityCheckNav>

							{/* Clientes-Proveedor */}
							<AuthorityCheckNav
								authority={Pages.catalogs.subPages.customers.authority}
								roles={Pages.catalogs.subPages.customers.roles}
								userAuthority={userAuthority}
								requireAll={Pages.catalogs.subPages.customers.requireAll}>
								<NavItem
									text={Pages.catalogs.subPages.customers.text}
									to={Pages.catalogs.subPages.customers.to}
									icon={Pages.catalogs.subPages.customers.icon}
									id={Pages.catalogs.subPages.customers.id}
									onClick={() => navigate(Pages.catalogs.subPages.customers.to)}
								/>
							</AuthorityCheckNav>

							{/* Casilleros (Lock Care) */}
							<AuthorityCheckNav
								authority={Pages.technical.subPages.lockersManagement.authority}
								roles={Pages.technical.subPages.lockersManagement.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.technical.subPages.lockersManagement.text}
									to={Pages.technical.subPages.lockersManagement.to}
									icon={Pages.technical.subPages.lockersManagement.icon}
									id={Pages.technical.subPages.lockersManagement.id}
									onClick={() =>
										navigate(Pages.technical.subPages.lockersManagement.to)
									}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * INVENTARIO
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.inventory.authority}
						requireAll={Pages.inventory.requireAll}
						userAuthority={userAuthority}>
						<NavTitle>Inventario</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.inventory.authority}
						requireAll={Pages.inventory.requireAll}
						userAuthority={userAuthority}>
						<NavCollapse
							key='inventario-nav'
							text={Pages.inventory.text}
							icon={Pages.inventory.icon}
							to=''
							isOpen={collapseStates.inventario}
							onToggle={() => toggleCollapse('inventario')}>
							{/* Bodegas */}
							<AuthorityCheckNav
								authority={Pages.inventory.subPages.warehouses.authority}
								roles={Pages.inventory.subPages.warehouses.roles}
								userAuthority={userAuthority}
								requireAll={Pages.inventory.subPages.warehouses.requireAll}>
								<NavItem
									text={Pages.inventory.subPages.warehouses.text}
									to={Pages.inventory.subPages.warehouses.to}
									icon={Pages.inventory.subPages.warehouses.icon}
									id={Pages.inventory.subPages.warehouses.id}
									onClick={() => navigate(Pages.inventory.subPages.warehouses.to)}
								/>
							</AuthorityCheckNav>

							{/* Trazabilidad Subsidiary */}
							<AuthorityCheckNav
								authority={
									Pages.inventory.subPages.trazabilidadSubsidiary.authority
								}
								userAuthority={userAuthority}
								requireAll={
									Pages.inventory.subPages.trazabilidadSubsidiary.requireAll
								}>
								<NavItem
									text={Pages.inventory.subPages.trazabilidadSubsidiary.text}
									to={Pages.inventory.subPages.trazabilidadSubsidiary.to}
									icon={Pages.inventory.subPages.trazabilidadSubsidiary.icon}
									id={Pages.inventory.subPages.trazabilidadSubsidiary.id}
									onClick={() =>
										navigate(Pages.inventory.subPages.trazabilidadSubsidiary.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Transferencias Comerciales */}
							<AuthorityCheckNav
								authority={Pages.inventory.subPages.transfers.authority}
								roles={Pages.inventory.subPages.transfers.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.inventory.subPages.transfers.text}
									to={Pages.inventory.subPages.transfers.to}
									icon={Pages.inventory.subPages.transfers.icon}
									id={Pages.inventory.subPages.transfers.id}
									onClick={() => navigate(Pages.inventory.subPages.transfers.to)}
								/>
							</AuthorityCheckNav>

							{/* Ingreso de Stock */}
							<AuthorityCheckNav
								authority={Pages.inventory.subPages.ingresoStock.authority}
								requireAll={Pages.inventory.subPages.ingresoStock.requireAll}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.inventory.subPages.ingresoStock.text}
									to={Pages.inventory.subPages.ingresoStock.to}
									icon={Pages.inventory.subPages.ingresoStock.icon}
									id={Pages.inventory.subPages.ingresoStock.id}
									onClick={() =>
										navigate(Pages.inventory.subPages.ingresoStock.to)
									}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * COMERCIAL
					 * ====================== */}
					<AuthorityCheckNav
						authority={[
							...Pages.commercial.authority,
							...Pages.commercial.subPages.pagosDiferidos.authority,
						]}
						userAuthority={userAuthority}>
						<NavCollapse
							key='comercial-nav'
							text='Comercial'
							icon='DuoBag1'
							to=''
							isOpen={collapseStates.comercial}
							onToggle={() => toggleCollapse('comercial')}>
							{/* Ventas */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.sales.authority}
								roles={Pages.commercial.subPages.sales.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.sales.text}
									to={Pages.commercial.subPages.sales.to}
									icon={Pages.commercial.subPages.sales.icon}
									id={Pages.commercial.subPages.sales.id}
									onClick={() => navigate(Pages.commercial.subPages.sales.to)}
								/>
							</AuthorityCheckNav>

							{/* Pendientes de serie */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.pendientesSerie.authority}
								roles={Pages.commercial.subPages.pendientesSerie.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.pendientesSerie.text}
									to={Pages.commercial.subPages.pendientesSerie.to}
									icon={Pages.commercial.subPages.pendientesSerie.icon}
									id={Pages.commercial.subPages.pendientesSerie.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.pendientesSerie.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Enlaces Públicos */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.enlacesPublicos.authority}
								roles={Pages.commercial.subPages.enlacesPublicos.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.enlacesPublicos.text}
									to={Pages.commercial.subPages.enlacesPublicos.to}
									icon={Pages.commercial.subPages.enlacesPublicos.icon}
									id={Pages.commercial.subPages.enlacesPublicos.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.enlacesPublicos.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Cotizaciones */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.quotes.authority}
								roles={Pages.commercial.subPages.quotes.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.quotes.text}
									to={Pages.commercial.subPages.quotes.to}
									icon={Pages.commercial.subPages.quotes.icon}
									id={Pages.commercial.subPages.quotes.id}
									onClick={() => navigate(Pages.commercial.subPages.quotes.to)}
								/>
							</AuthorityCheckNav>

							{/* Garantías */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.warranties.authority}
								roles={Pages.commercial.subPages.warranties.roles}
								userAuthority={userAuthority}
								requireAll={Pages.commercial.subPages.warranties.requireAll}>
								<NavItem
									text={Pages.commercial.subPages.warranties.text}
									to={Pages.commercial.subPages.warranties.to}
									icon={Pages.commercial.subPages.warranties.icon}
									id={Pages.commercial.subPages.warranties.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.warranties.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Pagos diferidos — solo por permiso (ZF-15), sin allowlist de roles */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.pagosDiferidos.authority}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.pagosDiferidos.text}
									to={Pages.commercial.subPages.pagosDiferidos.to}
									icon={Pages.commercial.subPages.pagosDiferidos.icon}
									id={Pages.commercial.subPages.pagosDiferidos.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.pagosDiferidos.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Cartera de crédito */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.carteraCredito.authority}
								roles={Pages.commercial.subPages.carteraCredito.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.carteraCredito.text}
									to={Pages.commercial.subPages.carteraCredito.to}
									icon={Pages.commercial.subPages.carteraCredito.icon}
									id={Pages.commercial.subPages.carteraCredito.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.carteraCredito.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Clientes Ventas */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.clientesVentas.authority}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.commercial.subPages.clientesVentas.text}
									to={Pages.commercial.subPages.clientesVentas.to}
									icon={Pages.commercial.subPages.clientesVentas.icon}
									id={Pages.commercial.subPages.clientesVentas.id}
									onClick={() =>
										navigate(Pages.commercial.subPages.clientesVentas.to)
									}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * CATÁLOGOS
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.catalogs.authority}
						requireAll={Pages.catalogs.requireAll}
						userAuthority={userAuthority}>
						<NavTitle>Catálogos</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.catalogs.authority}
						requireAll={Pages.catalogs.requireAll}
						userAuthority={userAuthority}>
						<NavCollapse
							key='catalogos-nav'
							text={Pages.catalogs.text}
							icon={Pages.catalogs.icon}
							to=''
							isOpen={collapseStates.catalogos}
							onToggle={() => toggleCollapse('catalogos')}>
							{/* Productos */}
							<AuthorityCheckNav
								authority={Pages.catalogs.subPages.products.authority}
								userAuthority={userAuthority}
								requireAll={Pages.catalogs.subPages.products.requireAll}>
								<NavItem
									text={Pages.catalogs.subPages.products.text}
									to={Pages.catalogs.subPages.products.to}
									icon={Pages.catalogs.subPages.products.icon}
									id={Pages.catalogs.subPages.products.id}
									onClick={() => navigate(Pages.catalogs.subPages.products.to)}
								/>
							</AuthorityCheckNav>

							{/* Categorías */}
							<AuthorityCheckNav
								authority={Pages.catalogs.subPages.categories.authority}
								roles={Pages.catalogs.subPages.categories.roles}
								userAuthority={userAuthority}
								requireAll={Pages.catalogs.subPages.categories.requireAll}>
								<NavItem
									text={Pages.catalogs.subPages.categories.text}
									to={Pages.catalogs.subPages.categories.to}
									icon={Pages.catalogs.subPages.categories.icon}
									id={Pages.catalogs.subPages.categories.id}
									onClick={() => navigate(Pages.catalogs.subPages.categories.to)}
								/>
							</AuthorityCheckNav>

							{/* Marcas */}
							<AuthorityCheckNav
								authority={Pages.catalogs.subPages.brands.authority}
								roles={Pages.catalogs.subPages.brands.roles}
								userAuthority={userAuthority}
								requireAll={Pages.catalogs.subPages.brands.requireAll}>
								<NavItem
									text={Pages.catalogs.subPages.brands.text}
									to={Pages.catalogs.subPages.brands.to}
									icon={Pages.catalogs.subPages.brands.icon}
									id={Pages.catalogs.subPages.brands.id}
									onClick={() => navigate(Pages.catalogs.subPages.brands.to)}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * GERENCIA - REPORTES
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.reports.authority}
						roles={Pages.reports.roles}
						userAuthority={userAuthority}>
						<NavTitle>Gerencia</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.reports.authority}
						roles={Pages.reports.roles}
						userAuthority={userAuthority}>
						<NavCollapse
							key='reportes-nav'
							text='Reportes'
							icon='DuoChartBar2'
							to=''
							isOpen={collapseStates.reportes}
							onToggle={() => toggleCollapse('reportes')}>
							{/* Dashboard de Ventas */}
							<AuthorityCheckNav
								authority={Pages.reports.subPages.salesDashboard.authority}
								roles={Pages.reports.subPages.salesDashboard.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.reports.subPages.salesDashboard.text}
									to={Pages.reports.subPages.salesDashboard.to}
									icon={Pages.reports.subPages.salesDashboard.icon}
									id={Pages.reports.subPages.salesDashboard.id}
									onClick={() =>
										navigate(Pages.reports.subPages.salesDashboard.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Reportes de Inventario */}
							<AuthorityCheckNav
								authority={Pages.reports.subPages.inventoryReports.authority}
								roles={Pages.reports.subPages.inventoryReports.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.reports.subPages.inventoryReports.text}
									to={Pages.reports.subPages.inventoryReports.to}
									icon={Pages.reports.subPages.inventoryReports.icon}
									id={Pages.reports.subPages.inventoryReports.id}
									onClick={() =>
										navigate(Pages.reports.subPages.inventoryReports.to)
									}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * RECURSOS HUMANOS
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.humanResources.authority}
						roles={Pages.humanResources.roles}
						userAuthority={userAuthority}>
						<NavTitle>Recursos Humanos</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.humanResources.authority}
						roles={Pages.humanResources.roles}
						userAuthority={userAuthority}
						requireAll={Pages.humanResources.requireAll}>
						<NavCollapse
							key='rrhh-nav'
							text={Pages.humanResources.text}
							icon={Pages.humanResources.icon}
							to=''
							isOpen={collapseStates.rrhh}
							onToggle={() => toggleCollapse('rrhh')}>
							{/* Invitaciones */}
							<AuthorityCheckNav
								authority={Pages.humanResources.subPages.invitationsAdmin.authority}
								roles={Pages.humanResources.subPages.invitationsAdmin.roles}
								userAuthority={userAuthority}
								requireAll={
									Pages.humanResources.subPages.invitationsAdmin.requireAll
								}>
								<NavItem
									text={Pages.humanResources.subPages.invitationsAdmin.text}
									to={Pages.humanResources.subPages.invitationsAdmin.to}
									icon={Pages.humanResources.subPages.invitationsAdmin.icon}
									id={Pages.humanResources.subPages.invitationsAdmin.id}
									onClick={() =>
										navigate(Pages.humanResources.subPages.invitationsAdmin.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Reloj Control */}
							<AuthorityCheckNav
								authority={Pages.humanResources.subPages.relojControl.authority}
								roles={Pages.humanResources.subPages.relojControl.roles}
								userAuthority={userAuthority}
								requireAll={Pages.humanResources.subPages.relojControl.requireAll}>
								<NavItem
									text={Pages.humanResources.subPages.relojControl.text}
									to={Pages.humanResources.subPages.relojControl.to}
									icon={Pages.humanResources.subPages.relojControl.icon}
									id={Pages.humanResources.subPages.relojControl.id}
									onClick={() =>
										navigate(Pages.humanResources.subPages.relojControl.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Configuración RH */}
							<AuthorityCheckNav
								authority={Pages.humanResources.subPages.configuracionRH.authority}
								roles={Pages.humanResources.subPages.configuracionRH.roles}
								userAuthority={userAuthority}
								requireAll={
									Pages.humanResources.subPages.configuracionRH.requireAll
								}>
								<NavItem
									text={Pages.humanResources.subPages.configuracionRH.text}
									to={Pages.humanResources.subPages.configuracionRH.to}
									icon={Pages.humanResources.subPages.configuracionRH.icon}
									id={Pages.humanResources.subPages.configuracionRH.id}
									onClick={() =>
										navigate(Pages.humanResources.subPages.configuracionRH.to)
									}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * DOCUMENTOS
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.catalogs.subPages.documents.authority}
						roles={Pages.catalogs.subPages.documents.roles}
						userAuthority={userAuthority}
						requireAll={Pages.catalogs.subPages.documents.requireAll}>
						<NavItem
							text={Pages.catalogs.subPages.documents.text}
							to={Pages.catalogs.subPages.documents.to}
							icon={Pages.catalogs.subPages.documents.icon}
							id={Pages.catalogs.subPages.documents.id}
							onClick={() => navigate(Pages.catalogs.subPages.documents.to)}
						/>
					</AuthorityCheckNav>

					{/* ======================
					 * INTEGRACIONES
					 * ====================== */}
					<AuthorityCheckNav
						authority={[
							...(Pages.integrations.authority || []),
							...(Pages.integrations.roles || []),
						]}
						roles={Pages.integrations.roles}
						userAuthority={userAuthority}>
						<NavTitle>Integraciones</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={[
							...(Pages.integrations.authority || []),
							...(Pages.integrations.roles || []),
						]}
						roles={Pages.integrations.roles}
						userAuthority={userAuthority}
						requireAll={Pages.integrations.requireAll}>
						{/* Hub unificado: una sola entrada que abre la página con pestañas.
						    Las subpáginas siguen existiendo como rutas standalone. */}
						<NavItem
							text={Pages.integrations.text}
							to={Pages.integrations.to}
							icon={Pages.integrations.icon}
							id='integrationsHub'
							onClick={() => navigate(Pages.integrations.to)}
						/>
					</AuthorityCheckNav>
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
