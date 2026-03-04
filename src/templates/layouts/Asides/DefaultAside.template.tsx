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
import useAuthority from '@/hooks/useAuthority';

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
		userAuthority = [],
		authority = [],
		requireAll = false,
		roles = [],
		requireAllRoles = false,
		companyId,
		subsidiaryId,
		branchId,
		children,
	} = props;

	const user = useAppSelector((s) => s.auth.user);
	const userRoles = useAppSelector((s) => s.auth.user?.roles) || [];

	// hooks siempre arriba (no condicionales)
	const permissionMatched = useAuthority(userAuthority, authority || [], requireAll, true);
	const roleMatched = useAuthority(userRoles, roles || [], requireAllRoles, true);

	// Super admin siempre pasa
	if (
		user?.roles?.includes('super-admin') ||
		user?.authority?.includes('super-admin') ||
		userAuthority?.includes('super-admin')
	) {
		return <>{children}</>;
	}

	// Sin autoridad ni roles → público dentro del aside
	if ((!authority || authority.length === 0) && (!roles || roles.length === 0)) {
		return <>{children}</>;
	}

	// Debe cumplir permiso + rol
	if (!permissionMatched) return null;
	if (roles.length && !roleMatched) return null;

	// Validación con contexto (empresa / subempresa / sucursal)
	if (companyId || subsidiaryId || branchId) {
		const hasContextAccess = checkNavContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) return null;
	}

	return <>{children}</>;
};

function checkNavContextualAccess(
	user: any,
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
	const userAuthority = useAppSelector((s) => s.auth.permisos);
	const user = useAppSelector((s) => s.auth.user);
	const userRoles = user?.roles || [];
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
						roles={Pages.manage.roles}
						userAuthority={userAuthority}>
						<NavTitle>Gestión</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.manage.authority}
						roles={Pages.manage.roles}
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
								roles={Pages.manage.subPages.subsidiary.roles}
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
								roles={Pages.manage.subPages.branch.roles}
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
								authority={[
									...(Pages.manage.subPages.rolesPermisos.authority || []),
									...(Pages.manage.subPages.rolesPermisos.roles || []),
								]}
								roles={Pages.manage.subPages.rolesPermisos.roles}
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
					 * INVENTARIO
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.inventory.authority}
						roles={Pages.inventory.roles}
						userAuthority={userAuthority}>
						<NavTitle>Inventario</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.inventory.authority}
						roles={Pages.inventory.roles}
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
								roles={Pages.inventory.subPages.trazabilidadSubsidiary.roles}
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
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * COMERCIAL
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.commercial.authority}
						roles={Pages.commercial.roles}
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

							{/* Clientes Ventas */}
							<AuthorityCheckNav
								authority={Pages.commercial.subPages.clientesVentas.authority}
								roles={Pages.commercial.subPages.clientesVentas.roles}
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
						<NavCollapse
							key='integraciones-nav'
							text={Pages.integrations.text}
							icon={Pages.integrations.icon}
							to=''
							isOpen={collapseStates.integraciones}
							onToggle={() => toggleCollapse('integraciones')}>
							{/* Listado */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.list.authority || []),
									...(Pages.integrations.subPages.list.roles || []),
								]}
								roles={Pages.integrations.subPages.list.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.integrations.subPages.list.text}
									to={Pages.integrations.subPages.list.to}
									icon={Pages.integrations.subPages.list.icon}
									id={Pages.integrations.subPages.list.id}
									onClick={() => navigate(Pages.integrations.subPages.list.to)}
								/>
							</AuthorityCheckNav>

							{/* Productos Sin Mapear */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.unmappedProducts.authority ||
										[]),
									...(Pages.integrations.subPages.unmappedProducts.roles || []),
								]}
								roles={Pages.integrations.subPages.unmappedProducts.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.integrations.subPages.unmappedProducts.text}
									to={Pages.integrations.subPages.unmappedProducts.to}
									icon={Pages.integrations.subPages.unmappedProducts.icon}
									id={Pages.integrations.subPages.unmappedProducts.id}
									onClick={() =>
										navigate(Pages.integrations.subPages.unmappedProducts.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Sincronizar Stock */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.syncStock.authority || []),
									...(Pages.integrations.subPages.syncStock.roles || []),
								]}
								roles={Pages.integrations.subPages.syncStock.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.integrations.subPages.syncStock.text}
									to={Pages.integrations.subPages.syncStock.to}
									icon={Pages.integrations.subPages.syncStock.icon}
									id={Pages.integrations.subPages.syncStock.id}
									onClick={() =>
										navigate(Pages.integrations.subPages.syncStock.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Importar Órdenes */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.importOrders.authority || []),
									...(Pages.integrations.subPages.importOrders.roles || []),
								]}
								roles={Pages.integrations.subPages.importOrders.roles}
								userAuthority={userAuthority}>
								<NavItem
									text={Pages.integrations.subPages.importOrders.text}
									to={Pages.integrations.subPages.importOrders.to}
									icon={Pages.integrations.subPages.importOrders.icon}
									id={Pages.integrations.subPages.importOrders.id}
									onClick={() =>
										navigate(Pages.integrations.subPages.importOrders.to)
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
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * CATÁLOGOS
					 * ====================== */}
					<AuthorityCheckNav
						authority={Pages.catalogs.authority}
						roles={Pages.catalogs.roles}
						userAuthority={userAuthority}>
						<NavTitle>Catálogos</NavTitle>
					</AuthorityCheckNav>
					<AuthorityCheckNav
						authority={Pages.catalogs.authority}
						roles={Pages.catalogs.roles}
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
								roles={Pages.catalogs.subPages.products.roles}
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
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
