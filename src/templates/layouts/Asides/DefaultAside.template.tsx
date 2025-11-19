import React, { PropsWithChildren, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aside, { AsideBody } from '@/components/layouts/Aside/Aside';
import Nav, {
	NavItem,
	NavCollapse,
	NavSeparator,
	NavTitle,
} from '@/components/layouts/Navigation/Nav';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import AsideHeadPart from './_parts/AsideHead.part';
import AsideFooterPart from './_parts/AsideFooter.part';
import Pages from '@/config/pages.config';
import useAuthority from '@/hooks/useAuthority';

type AuthorityGuardProps = PropsWithChildren<{
	userAuthority?: string[];
	authority?: string[];
	/** Modo AND - todos los permisos deben coincidir */
	requireAll?: boolean;
	/** ID de empresa específica */
	companyId?: number;
	/** ID de subsidiaria específica */
	subsidiaryId?: number;
	/** ID de sucursal específica */
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

	// IMPORTANTE: Siempre llamar hooks primero, antes de cualquier return condicional
	const roleMatched = useAuthority(userAuthority, authority, requireAll, true);

	// Si `authority` es vacío o `undefined`, la vista es sin protección
	if (!authority || authority.length === 0) {
		return <>{children}</>;
	}

	// SUPER ADMIN: Acceso completo sin restricciones
	if (
		user?.roles?.includes('super-admin') ||
		user?.authority?.includes('super-admin') ||
		userAuthority?.includes('super-admin')
	) {
		return <>{children}</>;
	}

	// Verificación contextual adicional
	if (roleMatched && (companyId || subsidiaryId || branchId)) {
		const hasContextAccess = checkNavContextualAccess(user, companyId, subsidiaryId, branchId);
		if (!hasContextAccess) {
			return null;
		}
	}

	return <>{roleMatched ? children : null}</>;
};

// Función auxiliar para verificar acceso contextual en navegación
function checkNavContextualAccess(
	user: any,
	companyId?: number,
	subsidiaryId?: number,
	branchId?: number,
): boolean {
	if (!user) return false;

	// Si es super admin, acceso completo
	if (user.authority?.includes('super-admin')) {
		return true;
	}

	// Verificar acceso por empresa
	if (companyId && user.company?.id !== companyId) {
		return false;
	}

	// Verificar acceso por subsidiaria
	if (subsidiaryId && user.subsidiary?.id !== subsidiaryId) {
		return false;
	}

	// Verificar acceso por sucursal
	if (branchId && user.branch?.id !== branchId) {
		return false;
	}

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
		catalogos: false,
		servicio: false,
		comercial: false, // COMENTADO: Módulo aún no operativo
		integraciones: false, // Módulo de Integraciones WooCommerce
		reportes: false,
	});

	const toggleCollapse = (key: string) => {
		setCollapseStates((prev) => {
			const closedAll = Object.keys(prev).reduce(
				(acc, k) => {
					acc[k] = false;
					return acc;
				},
				{} as Record<string, boolean>,
			);
			return {
				...closedAll,
				[key]: !prev[key],
			};
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
					{/* =================================================
					MÓDULOS OPERATIVOS DEL ERP ZENTRIA
					================================================= */}

					{/* Dashboard - OPERATIVO */}
					<AuthorityCheckNav
						// authority={Pages.dashboard.authority}
						userAuthority={userPermissionsAndRoles}>
						<NavItem
							text={Pages.dashboard.text}
							icon={Pages.dashboard.icon}
							to={Pages.dashboard.to}
							onClick={() => navigate(Pages.dashboard.to)}
							id={Pages.dashboard.id}
						/>
					</AuthorityCheckNav>

					<NavTitle>Gestión</NavTitle>

					{/* Gestión - OPERATIVO: Empresa, Subempresas, Sucursales, Usuarios, Integraciones, Permisos */}
					<NavCollapse
						key='registro-nav'
						text='Registro'
						icon='HeroDocumentText'
						to=''
						isOpen={collapseStates.registro}
						onToggle={() => toggleCollapse('registro')}>
						<AuthorityCheckNav
							authority={Pages.manage.subPages.company.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.company.text}
								to={Pages.manage.subPages.company.to}
								icon={Pages.manage.subPages.company.icon}
								id={Pages.manage.subPages.company.id}
								onClick={() => navigate(Pages.manage.subPages.company.to)}
							/>
						</AuthorityCheckNav>

						{/* Gestión - Subempresas */}
						<AuthorityCheckNav
							authority={Pages.manage.subPages.subsidiary.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.subsidiary.text}
								to={Pages.manage.subPages.subsidiary.to}
								icon={Pages.manage.subPages.subsidiary.icon}
								id={Pages.manage.subPages.subsidiary.id}
								onClick={() => navigate(Pages.manage.subPages.subsidiary.to)}
							/>
						</AuthorityCheckNav>

						{/* Gestión - Personalización de Subempresas */}
						{/* <AuthorityCheckNav
							authority={Pages.manage.subPages.subsidiaryCustomization.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.subsidiaryCustomization.text}
								to={Pages.manage.subPages.subsidiaryCustomization.to}
								icon={Pages.manage.subPages.subsidiaryCustomization.icon}
								id={Pages.manage.subPages.subsidiaryCustomization.id}
								onClick={() =>
									navigate(Pages.manage.subPages.subsidiaryCustomization.to)
								}
							/>
						</AuthorityCheckNav> */}

						{/* Gestión - Sucursales */}
						<AuthorityCheckNav
							authority={Pages.manage.subPages.branch.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.branch.text}
								to={Pages.manage.subPages.branch.to}
								icon={Pages.manage.subPages.branch.icon}
								id={Pages.manage.subPages.branch.id}
								onClick={() => navigate(Pages.manage.subPages.branch.to)}
							/>
						</AuthorityCheckNav>

						{/* Gestión - Usuarios */}
						{/* <AuthorityCheckNav
							authority={Pages.manage.subPages.manageUsers.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.manageUsers.text}
								to={Pages.manage.subPages.manageUsers.to}
								icon={Pages.manage.subPages.manageUsers.icon}
								id={Pages.manage.subPages.manageUsers.id}
								onClick={() => navigate(Pages.manage.subPages.manageUsers.to)}
							/>
						</AuthorityCheckNav> */}

						{/* Gestión - Integraciones */}
						{/* <AuthorityCheckNav
							authority={Pages.manage.subPages.integrations.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.manage.subPages.integrations.text}
								to={Pages.manage.subPages.integrations.to}
								icon={Pages.manage.subPages.integrations.icon}
								id={Pages.manage.subPages.integrations.id}
								onClick={() => navigate(Pages.manage.subPages.integrations.to)}
							/>
							<NavItem
								text={'WooCommerce Integración'}
								to={'/gestion/integraciones/woocommerce'}
								icon={'HeroGlobeAlt'}
								id={'woocommerce-integration'}
								onClick={() => navigate('/gestion/integraciones/woocommerce')}
							/>
							<NavItem
								text={'Sincronización de Stock WooCommerce'}
								to={'/gestion/integraciones/woocommerce-stock-sync'}
								icon={'HeroArrowPath'}
								id={'woocommerce-stock-sync'}
								onClick={() =>
									navigate('/gestion/integraciones/woocommerce-stock-sync')
								}
							/>
							<AuthorityCheckNav
								authority={
									Pages.manage.subPages.integrations.subPages.woocommerceSync
										.authority
								}
								userAuthority={userPermissionsAndRoles}>
								<NavItem
									text={
										Pages.manage.subPages.integrations.subPages.woocommerceSync
											.text
									}
									to={
										Pages.manage.subPages.integrations.subPages.woocommerceSync
											.to
									}
									icon={
										Pages.manage.subPages.integrations.subPages.woocommerceSync
											.icon
									}
									id={
										Pages.manage.subPages.integrations.subPages.woocommerceSync
											.id
									}
									onClick={() =>
										navigate(
											Pages.manage.subPages.integrations.subPages
												.woocommerceSync.to,
										)
									}
								/>
							</AuthorityCheckNav>
							<NavItem
								text={'Importar Pedidos WooCommerce'}
								to={'/gestion/integraciones/woocommerce-import'}
								icon={'HeroDocumentArrowDown'}
								id={'woocommerce-import'}
								onClick={() =>
									navigate('/gestion/integraciones/woocommerce-import')
								}
							/>
						</AuthorityCheckNav> */}

						{/* Administrar Permisos */}

						{/* <AuthorityCheckNav
							authority={[
								...(Pages.manage.subPages.permissionsAdmin.authority || []),
								...(Pages.manage.subPages.permissionsAdmin.roles || []),
							]}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.manage.subPages.permissionsAdmin.requireAll}>
							<NavItem
								text={Pages.manage.subPages.permissionsAdmin.text}
								to={Pages.manage.subPages.permissionsAdmin.to}
								icon={Pages.manage.subPages.permissionsAdmin.icon}
								id={Pages.manage.subPages.permissionsAdmin.id}
								onClick={() => navigate(Pages.manage.subPages.permissionsAdmin.to)}
							/>
						</AuthorityCheckNav> */}

						{/* Roles y Permisos */}
						<AuthorityCheckNav
							authority={[
								...(Pages.manage.subPages.rolesPermisos.authority || []),
								...(Pages.manage.subPages.rolesPermisos.roles || []),
							]}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.manage.subPages.rolesPermisos.requireAll}>
							<NavItem
								text={Pages.manage.subPages.rolesPermisos.text}
								to={Pages.manage.subPages.rolesPermisos.to}
								icon={Pages.manage.subPages.rolesPermisos.icon}
								id={Pages.manage.subPages.rolesPermisos.id}
								onClick={() => navigate(Pages.manage.subPages.rolesPermisos.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav authority={[]}></AuthorityCheckNav>
					</NavCollapse>

					<NavTitle>Inventario</NavTitle>
					<NavCollapse
						key='inventario-nav'
						text={Pages.inventory.text}
						icon={Pages.inventory.icon}
						to=''
						isOpen={collapseStates.inventario}
						onToggle={() => toggleCollapse('inventario')}>
						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.warehouses.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.warehouses.requireAll}>
							<NavItem
								text={Pages.catalogs.subPages.warehouses.text}
								to={Pages.catalogs.subPages.warehouses.to}
								icon={Pages.catalogs.subPages.warehouses.icon}
								id={Pages.catalogs.subPages.warehouses.id}
								onClick={() => navigate(Pages.catalogs.subPages.warehouses.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>

					{/* =================================================
					MÓDULOS PENDIENTES POR IMPLEMENTAR
					================================================= */}

					{/* Comercial - PENDIENTE: Módulo aún no operativo */}
					<NavCollapse
						key='comercial-nav'
						text='Comercial'
						icon='HeroShoppingBag'
						to=''
						isOpen={collapseStates.comercial}
						onToggle={() => toggleCollapse('comercial')}>
						<AuthorityCheckNav
							authority={Pages.commercial.subPages.sales.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.commercial.subPages.sales.text}
								to={Pages.commercial.subPages.sales.to}
								icon={Pages.commercial.subPages.sales.icon}
								id={Pages.commercial.subPages.sales.id}
								onClick={() => navigate(Pages.commercial.subPages.sales.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.commercial.subPages.quotes.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.commercial.subPages.quotes.text}
								to={Pages.commercial.subPages.quotes.to}
								icon={Pages.commercial.subPages.quotes.icon}
								id={Pages.commercial.subPages.quotes.id}
								onClick={() => navigate(Pages.commercial.subPages.quotes.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.commercial.subPages.transfers.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.commercial.subPages.transfers.text}
								to={Pages.commercial.subPages.transfers.to}
								icon={Pages.commercial.subPages.transfers.icon}
								id={Pages.commercial.subPages.transfers.id}
								onClick={() => navigate(Pages.commercial.subPages.transfers.to)}
							/>
						</AuthorityCheckNav>
						<AuthorityCheckNav
							authority={Pages.commercial.subPages.warranties.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.commercial.subPages.warranties.requireAll}>
							<NavItem
								text={Pages.commercial.subPages.warranties.text}
								to={Pages.commercial.subPages.warranties.to}
								icon={Pages.commercial.subPages.warranties.icon}
								id={Pages.commercial.subPages.warranties.id}
								onClick={() => navigate(Pages.commercial.subPages.warranties.to)}
							/>
						</AuthorityCheckNav>
					</NavCollapse>
					<NavTitle>Gerencia</NavTitle>
					{/* Reportes - Mostrar sólo listado por subsidiaria (List + Results) */}
					<AuthorityCheckNav
						authority={Pages.reports.authority}
						userAuthority={userPermissionsAndRoles}>
						<NavCollapse
							key='reportes-nav'
							text='Reportes'
							icon='HeroChartBar'
							to=''
							isOpen={collapseStates.reportes}
							onToggle={() => toggleCollapse('reportes')}>
							<AuthorityCheckNav
								authority={Pages.reports.authority}
								userAuthority={userPermissionsAndRoles}>
								<NavItem
									text={'Dashboard de Ventas'}
									to={''}
									icon={'HeroReceiptPercent'}
									id={'sales-dashboard'}
									onClick={() => {
										const sid = Number(
											effectiveSubsidiaryId ?? user?.subsidiary?.id ?? 0,
										);
										if (sid) navigate(`/subsidiaries/${sid}/reports/sales`);
									}}
								/>
								<NavItem
									text={'Reportes de Inventario'}
									to={''}
									icon={'HeroCubeTransparent'}
									id={'inventory-reports'}
									onClick={() => {
										const sid = Number(
											effectiveSubsidiaryId ?? user?.subsidiary?.id ?? 0,
										);
										if (sid) navigate(`/subsidiaries/${sid}/reports/inventory`);
									}}
								/>
								<NavItem
									text={'Reportes Financieros'}
									to={''}
									icon={'HeroBanknotes'}
									id={'financial-reports'}
									onClick={() => {
										const sid = Number(
											effectiveSubsidiaryId ?? user?.subsidiary?.id ?? 0,
										);
										if (sid) navigate(`/subsidiaries/${sid}/reports/financial`);
									}}
								/>
							</AuthorityCheckNav>
						</NavCollapse>
					</AuthorityCheckNav>

					{/* =================================================
					INTEGRACIONES - SOLO SUPER ADMIN
					================================================= */}
					<NavTitle>Integraciones</NavTitle>

					<AuthorityCheckNav
						authority={[
							...(Pages.integrations.authority || []),
							...(Pages.integrations.roles || []),
						]}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.integrations.requireAll}>
						<NavCollapse
							key='integraciones-nav'
							text={Pages.integrations.text}
							icon={Pages.integrations.icon}
							to=''
							isOpen={collapseStates.integraciones || false}
							onToggle={() => toggleCollapse('integraciones')}>
							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.list.authority || []),
									...(Pages.integrations.subPages.list.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}>
								<NavItem
									text={Pages.integrations.subPages.list.text}
									to={Pages.integrations.subPages.list.to}
									icon={Pages.integrations.subPages.list.icon}
									id={Pages.integrations.subPages.list.id}
									onClick={() => navigate(Pages.integrations.subPages.list.to)}
								/>
							</AuthorityCheckNav>

							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.unmappedProducts.authority ||
										[]),
									...(Pages.integrations.subPages.unmappedProducts.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}>
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

							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.syncStock.authority || []),
									...(Pages.integrations.subPages.syncStock.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}>
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

							<AuthorityCheckNav
								authority={[
									...(Pages.integrations.subPages.importOrders.authority || []),
									...(Pages.integrations.subPages.importOrders.roles || []),
								]}
								userAuthority={userPermissionsAndRoles}>
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

					<NavTitle>Recursos Humanos</NavTitle>

					{/* Invitaciones - OPERATIVO */}

					<AuthorityCheckNav
						authority={Pages.humanResources.subPages.invitationsAdmin.authority}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.humanResources.subPages.invitationsAdmin.requireAll}>
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
						requireAll={Pages.catalogs.subPages.documents.requireAll}>
						<NavItem
							text={Pages.catalogs.subPages.documents.text}
							to={Pages.catalogs.subPages.documents.to}
							icon={Pages.catalogs.subPages.documents.icon}
							id={Pages.catalogs.subPages.documents.id}
							onClick={() => navigate(Pages.catalogs.subPages.documents.to)}
						/>
					</AuthorityCheckNav>

					<NavTitle>Servicio Técnico</NavTitle>
					<NavCollapse
						key='servicio-nav'
						text='Servicio Técnico'
						icon={Pages.technical.icon}
						to=''
						isOpen={collapseStates.servicio}
						onToggle={() => toggleCollapse('servicio')}>
						<AuthorityCheckNav
							authority={Pages.technical.subPages.reviews.authority}
							userAuthority={userPermissionsAndRoles}>
							<NavItem
								text={Pages.technical.subPages.reviews.text}
								to={Pages.technical.subPages.reviews.to}
								icon={Pages.technical.subPages.reviews.icon}
								id={Pages.technical.subPages.reviews.id}
								onClick={() => navigate(Pages.technical.subPages.reviews.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.suppliers.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.suppliers.requireAll}>
							<NavItem
								text={Pages.catalogs.subPages.suppliers.text}
								to={Pages.catalogs.subPages.suppliers.to}
								icon={Pages.catalogs.subPages.suppliers.icon}
								id={Pages.catalogs.subPages.suppliers.id}
								onClick={() => navigate(Pages.catalogs.subPages.suppliers.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.customers.authority}
							userAuthority={userPermissionsAndRoles}
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

					<NavTitle>Catálogos</NavTitle>

					{/* CATÁLOGOS OPERATIVOS: Productos, Categorías, Marcas */}
					<NavCollapse
						key='catalogos-nav'
						text={Pages.catalogs.text}
						icon={Pages.catalogs.icon}
						to=''
						isOpen={collapseStates.catalogos}
						onToggle={() => toggleCollapse('catalogos')}>
						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.products.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.products.requireAll}>
							<NavItem
								text={Pages.catalogs.subPages.products.text}
								to={Pages.catalogs.subPages.products.to}
								icon={Pages.catalogs.subPages.products.icon}
								id={Pages.catalogs.subPages.products.id}
								onClick={() => navigate(Pages.catalogs.subPages.products.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.categories.authority}
							userAuthority={userPermissionsAndRoles}
							requireAll={Pages.catalogs.subPages.categories.requireAll}>
							<NavItem
								text={Pages.catalogs.subPages.categories.text}
								to={Pages.catalogs.subPages.categories.to}
								icon={Pages.catalogs.subPages.categories.icon}
								id={Pages.catalogs.subPages.categories.id}
								onClick={() => navigate(Pages.catalogs.subPages.categories.to)}
							/>
						</AuthorityCheckNav>

						<AuthorityCheckNav
							authority={Pages.catalogs.subPages.brands.authority}
							userAuthority={userPermissionsAndRoles}
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

					{/* Proveedores - PENDIENTE: No está operativo aún */}
					{/* <AuthorityCheckNav
						authority={Pages.catalogs.subPages.suppliers.authority}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.catalogs.subPages.suppliers.requireAll}>
						<NavItem
							text={Pages.catalogs.subPages.suppliers.text}
							to={Pages.catalogs.subPages.suppliers.to}
							icon={Pages.catalogs.subPages.suppliers.icon}
							id={Pages.catalogs.subPages.suppliers.id}
							onClick={() => navigate(Pages.catalogs.subPages.suppliers.to)}
						/>
					</AuthorityCheckNav> */}

					{/* Clientes - PENDIENTE: No está operativo aún */}
					{/* <AuthorityCheckNav
						authority={Pages.catalogs.subPages.customers.authority}
						userAuthority={userPermissionsAndRoles}
						requireAll={Pages.catalogs.subPages.customers.requireAll}>
						<NavItem
							text={Pages.catalogs.subPages.customers.text}
							to={Pages.catalogs.subPages.customers.to}
							icon={Pages.catalogs.subPages.customers.icon}
							id={Pages.catalogs.subPages.customers.id}
							onClick={() => navigate(Pages.catalogs.subPages.customers.to)}
						/>
					</AuthorityCheckNav> */}

					{/* <AuthorityCheckNav authority={Pages.listaItem.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaItem.text} to={Pages.listaItem.to} icon={Pages.listaItem.icon} id={Pages.listaItem.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* <AuthorityCheckNav authority={Pages.listaProveedoresEmpresa.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaProveedoresEmpresa.text} to={Pages.listaProveedoresEmpresa.to} icon={Pages.listaProveedoresEmpresa.icon} id={Pages.listaProveedoresEmpresa.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaItemsEmpresa.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaItemsEmpresa.text} to={Pages.listaItemsEmpresa.to} icon={Pages.listaItemsEmpresa.icon} id={Pages.listaItemsEmpresa.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaBodegas.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaBodegas.text} to={Pages.listaBodegas.to} icon={Pages.listaBodegas.icon} id={Pages.listaBodegas.id}></NavItem>
					</AuthorityCheckNav>
					<AuthorityCheckNav authority={Pages.listaOrdenesCompra.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaOrdenesCompra.text} to={Pages.listaOrdenesCompra.to} icon={Pages.listaOrdenesCompra.icon} id={Pages.listaOrdenesCompra.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* <NavTitle>Registros</NavTitle> */}
					{/* <NavCollapse text="Registro" icon="HeroDocumentText" to={''}>
						<AuthorityCheckNav authority={Pages.listaCategorias.authority} userAuthority={listaGrupos?.grupos}>
							<NavItem text="Lista Categorías" to={Pages.listaCategorias.to} />
						</AuthorityCheckNav>
						<AuthorityCheckNav authority={Pages.listaFabricantes.authority} userAuthority={listaGrupos?.grupos}>
							<NavItem text="Lista Fabricantes" to={Pages.listaFabricantes.to} />
						</AuthorityCheckNav>
					</NavCollapse>
					<AuthorityCheckNav authority={Pages.listaClientes.authority} userAuthority={listaGrupos?.grupos}>
						<NavItem text={Pages.listaClientes.text} to={Pages.listaClientes.to} icon={Pages.listaClientes.icon} id={Pages.listaClientes.id}></NavItem>
					</AuthorityCheckNav> */}
					{/* =================================================
					SECCIONES DE LA TEMPLATE ORIGINAL - COMENTADAS
					================================================= */}

					{/* Apps de ejemplo de la template original */}
					{/* <NavItem {...appPages.salesAppPages.subPages.salesDashboardPage} />
					<NavItem {...appPages.aiAppPages.subPages.aiDashboardPage}>
						<Badge
							variant='outline'
							color='amber'
							className='border-transparent leading-none'>
							NEW
						</Badge>
					</NavItem>
					<NavItem {...appPages.crmAppPages.subPages.crmDashboardPage}>
						<NavButton
							title='New Customer'
							icon='HeroPlusCircle'
							onClick={() => {
								navigate(`../${appPages.crmAppPages.subPages.customerPage.to}/new`);
							}}
						/>
					</NavItem>
					<NavItem {...appPages.projectAppPages.subPages.projectDashboardPage}>
						<Badge
							variant='outline'
							color='emerald'
							className='border-transparent leading-none'>
							6
						</Badge>
					</NavItem>

					<NavTitle>Apps</NavTitle>
					<NavCollapse
						text={appPages.salesAppPages.text}
						to={appPages.salesAppPages.to}
						icon={appPages.salesAppPages.icon}>
						<NavItem {...appPages.salesAppPages.subPages.salesDashboardPage} />
						<NavCollapse
							text={appPages.salesAppPages.subPages.productPage.text}
							to={appPages.salesAppPages.subPages.productPage.to}
							icon={appPages.salesAppPages.subPages.productPage.icon}>
							<NavItem
								{...appPages.salesAppPages.subPages.productPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.salesAppPages.subPages.productPage.subPages.editPage}
							/>
						</NavCollapse>
						<NavCollapse
							text={appPages.salesAppPages.subPages.categoryPage.text}
							to={appPages.salesAppPages.subPages.categoryPage.to}
							icon={appPages.salesAppPages.subPages.categoryPage.icon}>
							<NavItem
								{...appPages.salesAppPages.subPages.categoryPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.salesAppPages.subPages.categoryPage.subPages.editPage}
							/>
						</NavCollapse>
					</NavCollapse>

					<NavCollapse
						text={appPages.aiAppPages.text}
						to={appPages.aiAppPages.to}
						icon={appPages.aiAppPages.icon}>
						<NavItem {...appPages.aiAppPages.subPages.aiDashboardPage} />
						<NavCollapse
							text={appPages.aiAppPages.subPages.chatPages.text}
							to={appPages.aiAppPages.subPages.chatPages.to}
							icon={appPages.aiAppPages.subPages.chatPages.icon}>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.photoPage}>
								<Badge
									variant='outline'
									color='amber'
									className='border-transparent leading-none'>
									22
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.videoPage}>
								<Badge
									variant='outline'
									color='violet'
									className='!border-transparent leading-none'>
									8
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.audioPage}>
								<Badge
									variant='outline'
									color='blue'
									className='!border-transparent leading-none'>
									13
								</Badge>
							</NavItem>
							<NavItem {...appPages.aiAppPages.subPages.chatPages.subPages.codePage}>
								<Badge
									variant='outline'
									color='emerald'
									className='!border-transparent leading-none'>
									3
								</Badge>
							</NavItem>
						</NavCollapse>
					</NavCollapse>

					<NavCollapse
						text={appPages.crmAppPages.text}
						to={appPages.crmAppPages.to}
						icon={appPages.crmAppPages.icon}>
						<NavItem {...appPages.crmAppPages.subPages.crmDashboardPage} />
						<NavCollapse
							text={appPages.crmAppPages.subPages.customerPage.text}
							to={appPages.crmAppPages.subPages.customerPage.to}
							icon={appPages.crmAppPages.subPages.customerPage.icon}>
							<NavItem
								{...appPages.crmAppPages.subPages.customerPage.subPages.listPage}
							/>
							<NavItem
								{...appPages.crmAppPages.subPages.customerPage.subPages.editPage}
							/>
						</NavCollapse>
						<NavCollapse
							text={appPages.crmAppPages.subPages.rolePage.text}
							to={appPages.crmAppPages.subPages.rolePage.to}
							icon={appPages.crmAppPages.subPages.rolePage.icon}>
							<NavItem
								{...appPages.crmAppPages.subPages.rolePage.subPages.listPage}
							/>
							<NavItem
								{...appPages.crmAppPages.subPages.rolePage.subPages.editPage}
							/>
						</NavCollapse>
					</NavCollapse>
					<NavCollapse
						text={appPages.projectAppPages.text}
						to={appPages.projectAppPages.to}
						icon={appPages.projectAppPages.icon}>
						<NavItem {...appPages.projectAppPages.subPages.projectDashboardPage}>
							<NavButton
								title='New Project'
								icon='HeroPlusCircle'
								onClick={() => {
									navigate(
										`../${appPages.projectAppPages.subPages.projectBoardPageLink.to}/new`,
									);
								}}
							/>
						</NavItem>
						<NavItem {...appPages.projectAppPages.subPages.projectBoardPage}>
							<Badge
								variant='outline'
								color='emerald'
								className='border-transparent leading-none'>
								6
							</Badge>
						</NavItem>
					</NavCollapse>
					<NavItem
						text={appPages.mailAppPages.text}
						to={appPages.mailAppPages.subPages.inboxPages.to}
						icon={appPages.mailAppPages.icon}>
						<Badge
							variant='outline'
							color='emerald'
							className='border-transparent leading-none'>
							3
						</Badge>
						<NavButton
							icon='HeroPlusCircle'
							title='New Mail'
							onClick={() => {
								navigate(`../${appPages.mailAppPages.subPages.newMailPages.to}`);
							}}
						/>
					</NavItem>
					<NavItem
						text={appPages.educationAppPages.text}
						to={appPages.educationAppPages.to}
						icon={appPages.educationAppPages.icon}>
						<Badge variant='outline' className='border-transparent leading-none'>
							Soon
						</Badge>
					</NavItem>
					<NavItem
						text={appPages.reservationAppPages.text}
						to={appPages.reservationAppPages.to}
						icon={appPages.reservationAppPages.icon}>
						<Badge variant='outline' className='border-transparent leading-none'>
							Soon
						</Badge>
					</NavItem>

					<NavSeparator />

					<NavTitle>Components & Templates</NavTitle>
					<NavCollapse
						text={componentsPages.uiPages.text}
						to={componentsPages.uiPages.to}
						icon={componentsPages.uiPages.icon}>
						<NavItem {...componentsPages.uiPages.subPages.alertPage} />
						<NavItem {...componentsPages.uiPages.subPages.badgePage} />
						<NavItem {...componentsPages.uiPages.subPages.buttonPage} />
						<NavItem {...componentsPages.uiPages.subPages.buttonGroupPage} />
						<NavItem {...componentsPages.uiPages.subPages.cardPage} />
						<NavItem {...componentsPages.uiPages.subPages.collapsePage} />
						<NavItem {...componentsPages.uiPages.subPages.dropdownPage} />
						<NavItem {...componentsPages.uiPages.subPages.modalPage} />
						<NavItem {...componentsPages.uiPages.subPages.offcanvasPage} />
						<NavItem {...componentsPages.uiPages.subPages.progressPage} />
						<NavItem {...componentsPages.uiPages.subPages.tablePage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/@tanstack/react-table',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.uiPages.subPages.tooltipPage} />
					</NavCollapse>
					<NavCollapse
						text={componentsPages.formPages.text}
						to={componentsPages.formPages.to}
						icon={componentsPages.formPages.icon}>
						<NavItem {...componentsPages.formPages.subPages.fieldWrapPage} />
						<NavItem {...componentsPages.formPages.subPages.checkboxPage} />
						<NavItem {...componentsPages.formPages.subPages.checkboxGroupPage} />
						<NavItem {...componentsPages.formPages.subPages.inputPage} />
						<NavItem {...componentsPages.formPages.subPages.labelPage} />
						<NavItem {...componentsPages.formPages.subPages.radioPage} />
						<NavItem {...componentsPages.formPages.subPages.richTextPage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/slate-react',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.formPages.subPages.selectPage} />
						<NavItem {...componentsPages.formPages.subPages.selectReactPage}>
							<NavButton
								title='Open Npm page'
								icon='CustomNpm'
								onClick={() => {
									window.open(
										'https://www.npmjs.com/package/react-select',
										'_blank',
									);
								}}
							/>
						</NavItem>
						<NavItem {...componentsPages.formPages.subPages.textareaPage} />
						<NavItem {...componentsPages.formPages.subPages.validationPage}>
							<Badge variant='outline'>Formik</Badge>
						</NavItem>
					</NavCollapse>
					<NavCollapse
						text={componentsPages.integratedPages.text}
						to={componentsPages.integratedPages.to}
						icon={componentsPages.integratedPages.icon}>
						<NavItem {...componentsPages.integratedPages.subPages.reactDateRangePage} />
						<NavItem {...componentsPages.integratedPages.subPages.fullCalendarPage} />
						<NavItem {...componentsPages.integratedPages.subPages.apexChartsPage} />
						<NavItem
							{...componentsPages.integratedPages.subPages.reactSimpleMapsPage}
						/>
						<NavItem {...componentsPages.integratedPages.subPages.waveSurferPage} />
						<NavItem {...componentsPages.formPages.subPages.richTextPage} />
						<NavItem {...componentsPages.formPages.subPages.selectReactPage} />
					</NavCollapse>

					<NavCollapse
						text={componentsPages.iconsPage.text}
						to={componentsPages.iconsPage.to}
						icon={componentsPages.iconsPage.icon}>
						<NavItem {...componentsPages.iconsPage} />
						<NavItem {...componentsPages.iconsPage.subPages.heroiconsPage}>
							<Badge
								variant='outline'
								color='violet'
								className='!border-transparent leading-none'>
								292
							</Badge>
						</NavItem>
						<NavItem {...componentsPages.iconsPage.subPages.duotoneIconsPage}>
							<Badge
								variant='outline'
								color='violet'
								className='!border-transparent leading-none'>
								640
							</Badge>
						</NavItem>
					</NavCollapse>

					<NavSeparator />
					<NavTitle>Members</NavTitle>
					<NavUser
						text={`${usersDb[0].firstName} ${usersDb[0].lastName}`}
						image={usersDb[0].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[0].username}`}
					/>
					<NavUser
						text={`${usersDb[1].firstName} ${usersDb[1].lastName}`}
						image={usersDb[1].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[1].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser>
					<NavUser
						text={`${usersDb[2].firstName} ${usersDb[2].lastName}`}
						image={usersDb[2].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[2].username}`}
					/>
					<NavUser
						text={`${usersDb[3].firstName} ${usersDb[3].lastName}`}
						image={usersDb[3].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[3].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser>
					<NavUser
						text={`${usersDb[4].firstName} ${usersDb[4].lastName}`}
						image={usersDb[4].image?.thumb}
						to={`${appPages.chatAppPages.to}/${usersDb[4].username}`}>
						<NavButton
							title='New Message'
							icon='HeroChatBubbleLeftEllipsis'
							iconColor='emerald'
							onClick={() => {}}
						/>
					</NavUser> */}
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default DefaultAsideTemplate;
