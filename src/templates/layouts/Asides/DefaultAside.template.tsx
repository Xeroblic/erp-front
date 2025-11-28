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
	companyId?: number;
	subsidiaryId?: number;
	branchId?: number;
}>;

const AuthorityCheckNav = (props: AuthorityGuardProps) => {
	const {
		userAuthority = [],
		authority = [],
		requireAll = false,
		companyId,
		subsidiaryId,
		branchId,
		children,
	} = props;

	const user = useAppSelector((s) => s.auth.user);

	// hook siempre arriba
	const roleMatched = useAuthority(userAuthority, authority, requireAll, true);

	// Sin autoridad → público dentro del aside
	if (!authority || authority.length === 0) {
		return <>{children}</>;
	}

	// Super admin siempre pasa
	if (
		user?.roles?.includes('super-admin') ||
		user?.authority?.includes('super-admin') ||
		userAuthority?.includes('super-admin')
	) {
		return <>{children}</>;
	}

	// Validación con contexto (empresa / subempresa / sucursal)
	if (roleMatched && (companyId || subsidiaryId || branchId)) {
		const hasContextAccess = checkNavContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) return null;
	}

	return roleMatched ? <>{children}</> : null;
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

	const userPermissionsAndRoles = [
		...(userAuthority || []),
		...(user?.roles || []),
		...(user?.authority || []),
	];

	return (
		<Aside>
			<AsideHeadPart />
			<AsideBody>
				<Nav>
					{/* HOME */}
					<AuthorityCheckNav userAuthority={userPermissionsAndRoles}>
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
					<NavTitle>Gestión</NavTitle>
					<NavCollapse
						key='registro-nav'
						text='Registro'
						icon='DuoArticle'
						to=''
						isOpen={collapseStates.registro}
						onToggle={() => toggleCollapse('registro')}
					>
						{/* Empresa */}
						<AuthorityCheckNav
							authority={Pages.manage.subPages.company.authority}
							userAuthority={userPermissionsAndRoles}
						>
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
							userAuthority={userPermissionsAndRoles}
						>
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
							userAuthority={userPermissionsAndRoles}
						>
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
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.manage.subPages.rolesPermisos.requireAll}
						>
							<NavItem
								text={Pages.manage.subPages.rolesPermisos.text}
								to={Pages.manage.subPages.rolesPermisos.to}
								icon={Pages.manage.subPages.rolesPermisos.icon}
								id={Pages.manage.subPages.rolesPermisos.id}
								onClick={() => navigate(Pages.manage.subPages.rolesPermisos.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>

					{/* ======================
					 * INVENTARIO
					 * ====================== */}
					<NavTitle>Inventario</NavTitle>
					<NavCollapse
						key='inventario-nav'
						text={Pages.inventory.text}
						icon={Pages.inventory.icon}
						to=''
						isOpen={collapseStates.inventario}
						onToggle={() => toggleCollapse('inventario')}
					>
						{/* Bodegas */}
						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.warehouses.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.warehouses.requireAll}
						>
							<NavItem
								text={Pages.catalogs.subPages.warehouses.text}
								to={Pages.catalogs.subPages.warehouses.to}
								icon={Pages.catalogs.subPages.warehouses.icon}
								id={Pages.catalogs.subPages.warehouses.id}
								onClick={() => navigate(Pages.catalogs.subPages.warehouses.to)}
							/>
						</AuthorityCheckNav>

						{/* Transferencias Comerciales */}
						<AuthorityCheckNav
							authority={Pages.inventory.subPages.transfers.authority}
							userAuthority={userPermissionsAndRoles}
						>
							<NavItem
								text={Pages.inventory.subPages.transfers.text}
								to={Pages.inventory.subPages.transfers.to}
								icon={Pages.inventory.subPages.transfers.icon}
								id={Pages.inventory.subPages.transfers.id}
								onClick={() => navigate(Pages.inventory.subPages.transfers.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>

					{/* ======================
					 * COMERCIAL
					 * ====================== */}
					<NavCollapse
						key='comercial-nav'
						text='Comercial'
						icon='DuoBag1'
						to=''
						isOpen={collapseStates.comercial}
						onToggle={() => toggleCollapse('comercial')}
					>
						{/* Ventas */}
						<AuthorityCheckNav
							authority={Pages.commercial.subPages.sales.authority}
							userAuthority={userPermissionsAndRoles}
						>
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
							userAuthority={userPermissionsAndRoles}
						>
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
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.commercial.subPages.warranties.requireAll}
						>
							<NavItem
								text={Pages.commercial.subPages.warranties.text}
								to={Pages.commercial.subPages.warranties.to}
								icon={Pages.commercial.subPages.warranties.icon}
								id={Pages.commercial.subPages.warranties.id}
								onClick={() => navigate(Pages.commercial.subPages.warranties.to)}
							/>
						</AuthorityCheckNav>

						{/* Clientes Ventas */}
						<AuthorityCheckNav
							authority={Pages.commercial.subPages.clientesVentas.authority}
							userAuthority={userPermissionsAndRoles}
						>
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

					{/* ======================
					 * GERENCIA - REPORTES
					 * ====================== */}
					<NavTitle>Gerencia</NavTitle>
					<AuthorityCheckNav
						authority={Pages.reports.authority}
						userAuthority={userPermissionsAndRoles}
					>
						<NavCollapse
							key='reportes-nav'
							text='Reportes'
							icon='DuoChartBar2'
							to=''
							isOpen={collapseStates.reportes}
							onToggle={() => toggleCollapse('reportes')}
						>
							{/* Dashboard de Ventas */}
							<NavItem
								text='Dashboard de Ventas'
								to=''
								icon='DuoPrice2'
								id='sales-dashboard'
								onClick={() => {
									const sid = Number(
										effectiveSubsidiaryId ?? user?.subsidiary?.id ?? 0,
									);
									if (sid) navigate(`/subsidiaries/${sid}/reports/sales`);
								}}
							/>

							{/* Reportes de Inventario */}
							<NavItem
								text='Reportes de Inventario'
								to=''
								icon='DuoBox3'
								id='inventory-reports'
								onClick={() => {
									const sid = Number(
										effectiveSubsidiaryId ?? user?.subsidiary?.id ?? 0,
									);
									if (sid) navigate(`/subsidiaries/${sid}/reports/inventory`);
								}}
							/>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* ======================
					 * INTEGRACIONES
					 * ====================== */}
					<NavTitle>Integraciones</NavTitle>
					<AuthorityCheckNav
						authority={[
							...(Pages.integrations.authority || []),
							...(Pages.integrations.roles || []),
						]}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.integrations.requireAll}
					>
						<NavCollapse
							key='integraciones-nav'
							text={Pages.integrations.text}
							icon={Pages.integrations.icon}
							to=''
							isOpen={collapseStates.integraciones}
							onToggle={() => toggleCollapse('integraciones')}
						>
							{/* Listado */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.list.authority || []),
									...(Pages.integrations.subPages.list.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}
							>
								<NavItem
									text={Pages.integrations.subPages.list.text}
									to={Pages.integrations.subPages.list.to}
									icon={Pages.integrations.subPages.list.icon}
									id={Pages.integrations.subPages.list.id}
									onClick={() =>
										navigate(Pages.integrations.subPages.list.to)
									}
								/>
							</AuthorityCheckNav>

							{/* Productos Sin Mapear */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.unmappedProducts.authority ||
										[]),
									...(Pages.integrations.subPages.unmappedProducts.roles ||
										[]),
								]}
								userAuthority={userPermissionsAndRoles}
							>
								<NavItem
									text={Pages.integrations.subPages.unmappedProducts.text}
									to={Pages.integrations.subPages.unmappedProducts.to}
									icon={Pages.integrations.subPages.unmappedProducts.icon}
									id={Pages.integrations.subPages.unmappedProducts.id}
									onClick={() =>
										navigate(
											Pages.integrations.subPages.unmappedProducts.to,
										)
									}
								/>
							</AuthorityCheckNav>

							{/* Sincronizar Stock */}
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.syncStock.authority ||
										[]),
									...(Pages.integrations.subPages.syncStock.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}
							>
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
									...(Pages.integrations.subPages.importOrders.authority ||
										[]),
									...(Pages.integrations.subPages.importOrders.roles ||
										[]),
								]}
								userAuthority={userPermissionsAndRoles}
							>
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
					<NavTitle>Recursos Humanos</NavTitle>
					<AuthorityCheckNav
						authority={Pages.humanResources.subPages.invitationsAdmin.authority}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.humanResources.subPages.invitationsAdmin.requireAll}
					>
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

					<AuthorityCheckNav
						authority={Pages.catalogs.subPages.documents.authority}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.catalogs.subPages.documents.requireAll}
					>
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
					<NavTitle>Servicio Técnico</NavTitle>
					<NavCollapse
						key='servicio-nav'
						text='Servicio Técnico'
						icon={Pages.technical.icon}
						to=''
						isOpen={collapseStates.servicio}
						onToggle={() => toggleCollapse('servicio')}
					>
						{/* Revisiones Técnicas */}
						<AuthorityCheckNav
							authority={Pages.technical.subPages.reviews.authority}
							userAuthority={userPermissionsAndRoles}
						>
							<NavItem
								text={Pages.technical.subPages.reviews.text}
								to={Pages.technical.subPages.reviews.to}
								icon={Pages.technical.subPages.reviews.icon}
								id={Pages.technical.subPages.reviews.id}
								onClick={() =>
									navigate(Pages.technical.subPages.reviews.to)
								}
							/>
						</AuthorityCheckNav>

						{/* Proveedores */}
						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.suppliers.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.suppliers.requireAll}
						>
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
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.customers.requireAll}
						>
							<NavItem
								text={Pages.catalogs.subPages.customers.text}
								to={Pages.catalogs.subPages.customers.to}
								icon={Pages.catalogs.subPages.customers.icon}
								id={Pages.catalogs.subPages.customers.id}
								onClick={() => navigate(Pages.catalogs.subPages.customers.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>

					{/* ======================
					 * CATÁLOGOS
					 * ====================== */}
					<NavTitle>Catálogos</NavTitle>
					<NavCollapse
						key='catalogos-nav'
						text={Pages.catalogs.text}
						icon={Pages.catalogs.icon}
						to=''
						isOpen={collapseStates.catalogos}
						onToggle={() => toggleCollapse('catalogos')}
					>
						{/* Productos */}
						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.products.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.products.requireAll}
						>
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
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.categories.requireAll}
						>
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
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.brands.requireAll}
						>
							<NavItem
								text={Pages.catalogs.subPages.brands.text}
								to={Pages.catalogs.subPages.brands.to}
								icon={Pages.catalogs.subPages.brands.icon}
								id={Pages.catalogs.subPages.brands.id}
								onClick={() => navigate(Pages.catalogs.subPages.brands.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
