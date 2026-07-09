// src/routes/contentRoutes.tsx
import React, { lazy } from 'react';
import { PathRouteProps } from 'react-router-dom';
import pagesConfig from '@/config/pages.config';

import LoginPage from '@/pages/Login.page';
import AceptarInvitacionEmpresa from '@/pages/AceptarInvitacionEmpresa';
import SinPermisos from '@/pages/SinPermisos';
import NotFoundPage from '@/pages/NotFound.page';

const ProfilePage = lazy(() => import('@/pages/perfil/Perfil'));
const Dashboard = lazy(() => import('@/pages/MainDashboard'));
// const ProductosPage = lazy(() => import("@/pages/Usuarios"));
// const UsuariosPage  = lazy(() => import("@/pages/Usuarios"));
// const Cotizaciones  = lazy(() => import("@/pages/Cotizaciones"));
const EmpresaPage = lazy(() => import('@/pages/gestionAdmin/empresa/Empresa'));
const SubEmpresa = lazy(() => import('@/pages/gestionAdmin/subempresa/SubEmpresa'));
const SubEmpresaDetalle = lazy(() => import('@/pages/gestionAdmin/subempresa/SubEmpresaDetalle'));
const SubEmpresaPersonalizacion = lazy(
	() => import('@/pages/gestionAdmin/subempresa/SubEmpresaPersonalizacion'),
);

const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword/ConfirmarNuevaPass'));
const RecoverPasswordPage = lazy(() => import('@/pages/ResetPassword/RecuperarPassword'));
const PortalPedidosPage = lazy(() => import('@/pages/portal-pedidos/PortalPedidosPage'));

const FormLockCare = lazy(() => import('@/pages/Public/formLockCleare/FormLockCare'));
const PublicLockCare = lazy(() => import('@/pages/Public/publicLockCare'));
const CheckOutLockCare = lazy(() => import('@/pages/Public/publicLockCareCheckout'));
const LockersManagement = lazy(() => import('@/pages/LockersManagement'));

// Paginas de Configuracion Sistemas (nuevo módulo)
const IntegrationsListPage = lazy(() => import('@/pages/integraciones/IntegrationsListPage'));
const UnmappedProductsPage = lazy(() => import('@/pages/integraciones/UnmappedProductsPage'));
const SyncStockPage = lazy(() => import('@/pages/integraciones/SyncStockPage'));
const ImportOrdersPage = lazy(() => import('@/pages/integraciones/ImportOrdersPage'));
const ImportTermsPage = lazy(() => import('@/pages/integraciones/ImportTermsPage'));
const WooProductsPage = lazy(() => import('@/pages/integraciones/WooProductsPage'));
const IntegrationsHubPage = lazy(() => import('@/pages/integraciones/IntegrationsHubPage'));

// Reportes
const SalesDashboard = lazy(() => import('@/pages/reportes/sales-dashboard'));
const InventoryReports = lazy(() => import('@/pages/reportes/inventory-reports'));

const Sucursales = lazy(() => import('@/pages/gestionAdmin/sucursales/Sucursales.tsx'));
const SucursalDetalle = lazy(() => import('@/pages/gestionAdmin/sucursales/SucursalDetalle.tsx'));
const RolesPermisos = lazy(() => import('@/pages/gestionAdmin/roles y permisos/RolesPermisos.tsx'));
const UserPermissionsDetail = lazy(
	() => import('@/pages/gestionAdmin/roles y permisos/UserPermissionsDetail.tsx'),
);

// Páginas de Administración
const PermissionsAdmin = lazy(() => import('@/pages/admin/Permission/PermissionsAdmin'));
const InvitationsAdmin = lazy(() => import('@/pages/invitations/InvitationsAdmin.tsx'));
const SystemParametersAdmin = lazy(
	() => import('@/pages/admin/systemParameters/SystemParametersAdmin'),
);
const SystemParameterDetails = lazy(
	() => import('@/pages/admin/systemParameters/SystemParameterDetails'),
);

// Paginas de Comercial
// const InventarioPage = lazy(() => import('../pages/inventario/Inventario'));
const SalesListPage = lazy(() => import('../pages/comercial/ventas/SalesListPage'));
const PendientesSeriePage = lazy(() => import('../pages/comercial/ventas/pendientesSerie'));
const CotizacionesPage = lazy(() => import('../pages/comercial/cotizaciones/CotizacionesAdmin'));
const SolicitudesVentasPage = lazy(() => import('../pages/comercial/SolicitudesVentasPage'));
const EnlacesPublicosPage = lazy(() => import('@/pages/comercial/EnlacesPublicosPage'));

// Paginas de Inventario
const TransferenciasInventario = lazy(
	() => import('@/pages/inventario/transferencias/Transferencias'),
);
const BodegasPage = lazy(() => import('@/pages/catalogos/bodegas/WarehouseListPage'));
const BodegasDetailPage = lazy(() => import('@/pages/catalogos/bodegas/WarehouseDetailPage'));
const TransferenciasComercial = lazy(
	() => import('@/pages/comercial/transferencias/TransferenciasAdmin'),
);
const HistorialInventario = lazy(
	() => import('@/pages/inventario/historial/HistorialInventarioAdmin'),
);
const TrazabilidadSubsidiary = lazy(
	() => import('@/pages/inventario/trazabilidad-sucursal/TrazabilidadSubsidiary'),
);

const ClientesVentas = lazy(() => import('@/pages/comercial/clientesVentas/ClientesVentas'));
const ClientesVentasDetalle = lazy(
	() => import('@/pages/comercial/clientesVentas/ClientesVentasDetalle/index'),
);

const IngresoStock = lazy(() => import('@/pages/inventario/ingresoStock'));

// Páginas de Catálogos
const ProductosPage = lazy(() => import('@/pages/catalogos/productos/Productos'));
const ProductDetailPage = lazy(() => import('@/pages/catalogos/productos/ProductDetail'));
const CategoriasPage = lazy(() => import('@/pages/catalogos/categorias/Categorias'));
const MarcasPage = lazy(() => import('@/pages/catalogos/marcas/Marcas'));
const ProveedoresPage = lazy(() => import('@/pages/catalogos/proveedores/Proveedores'));
const DetalleProveedorPage = lazy(() => import('@/pages/catalogos/proveedores/DetalleProveedor'));
const ClientesPage = lazy(() => import('@/pages/catalogos/clientes/Clientes'));
const DetalleClientePage = lazy(() => import('@/pages/catalogos/clientes/DetalleCliente'));
const DocumentosPage = lazy(() => import('@/pages/documentos/Documentos'));
const GarantiasPage = lazy(() => import('@/pages/garantias/GarantiasPage'));
const GarantiaDetailsPage = lazy(() => import('@/pages/garantias/GarantiaDetailsPage'));
// const TechnicalReviewsHub = lazy(() => import('@/pages/technical-reviews/index'));
// const BatchesList = lazy(
// 	() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchListPage'),
// );
// const BatchCreate = lazy(
// 	() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchCreatePage'),
// );
// const BatchDetail = lazy(
// 	() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchDetailPage'),
// );

// const ItemsList = lazy(() => import('@/pages/technical-reviews/modo-b-items/pages/ItemListPage'));


/// REFACTOR DE TECHNICAL REVIEW

const RefactorTechnicalReview = lazy(() => import('@/pages/refactor-technical-review/index'));
const RefactorBatches = lazy(() => import('@/pages/refactor-technical-review/pages/batches/index'));
const RefactorCrearLote = lazy(
	() => import('@/pages/refactor-technical-review/pages/batches/pages/CrearLote'),
);
const RefactorDetalleLote = lazy(
	() => import('@/pages/refactor-technical-review/pages/batches/pages/DetalleLote'),
);
const RefactorRevisiones = lazy(
	() => import('@/pages/refactor-technical-review/pages/revisiones/index'),
);
const RefactorSeries = lazy(() => import('@/pages/refactor-technical-review/pages/series/index'));
const RefactorTraceability = lazy(
	() => import('@/pages/refactor-technical-review/pages/traceability'),
);

/// Notificaciones
const NotificationsAllPage = lazy(() => import('@/pages/notificaciones/NotificationsAll'));
const NotificationDetailPage = lazy(() => import('@/pages/notificaciones/NotificationDetail'));

/// Recursos Humanos
const RelojControlPage = lazy(
	() => import('@/pages/recursosHumanos/relojControl/RelojControlPage'),
);
const ConfiguracionRH = lazy(() => import('@/pages/recursosHumanos/configuracion/ConfiguracionRH'));

export interface IRoutePersonalizada extends PathRouteProps {
	authority?: string[];
	feature?: string;
	public?: boolean;
}

const cfg = pagesConfig as any;

const contentRoutes: IRoutePersonalizada[] = [
	{ path: cfg.loginPage.to, element: <LoginPage />, public: true },
	{ path: cfg.recuperarPassword.to, element: <RecoverPasswordPage />, public: true },
	{ path: cfg.confirmarNuevaPass.to, element: <ResetPasswordPage />, public: true },
	{ path: cfg.portalPedidosMock.to, element: <PortalPedidosPage />, public: true },
	{ path: cfg.portalPedidos.to, element: <PortalPedidosPage />, public: true },
	{ path: cfg.FormularioLockCare.to, element: <FormLockCare />, public: true },
	{ path: cfg.FormularioLockCare.subPages.publicLockCare.to, element: <PublicLockCare />, public: true },
	{ path: cfg.FormularioLockCare.subPages.checkOutLockCare.to, element: <CheckOutLockCare />, public: true },
	// Gestión interna de casilleros
	{
		path: cfg.technical.subPages.lockersManagement.to,
		element: <LockersManagement />,
		authority: cfg.technical.subPages.lockersManagement.authority,
	},
	// refactor
	{
		path: cfg.technical.subPages.refactor.to,
		element: <RefactorTechnicalReview />,
		authority: cfg.technical.subPages.refactor.authority,
	},
	{
		path: cfg.technical.subPages.lotes.to,
		element: <RefactorBatches />,
		authority: cfg.technical.subPages.lotes.authority,
	},
	{
		path: '/technical-reviews/lotes/crear',
		element: <RefactorCrearLote />,
		authority: cfg.technical.subPages.lotes.authority,
	},
	{
		path: '/technical-reviews/lotes/:batchId',
		element: <RefactorDetalleLote />,
		authority: cfg.technical.subPages.lotes.authority,
	},
	{ path: '/usuarios/activar/:token', element: <AceptarInvitacionEmpresa />, public: true },

	{ path: cfg.profilePage.to, element: <ProfilePage />, authority: cfg.profilePage.authority },
	{ path: cfg.dashboard.to, element: <Dashboard />, authority: cfg.dashboard.authority },

	{
		path: cfg.manage.subPages.company.to,
		element: <EmpresaPage />,
		authority: cfg.manage.subPages.company.authority,
	},
	{
		path: cfg.manage.subPages.subsidiary.to,
		element: <SubEmpresa />,
		authority: cfg.manage.subPages.subsidiary.authority,
	},
	{
		path: cfg.manage.subPages.subsidiaryDetail.to,
		element: <SubEmpresaDetalle />,
		authority: cfg.manage.subPages.subsidiaryDetail.authority,
	},
	{
		path: cfg.manage.subPages.subsidiaryCustomization.to,
		element: <SubEmpresaPersonalizacion />,
		authority: cfg.manage.subPages.subsidiaryCustomization.authority,
	},
	{
		path: cfg.manage.subPages.branch.to,
		element: <Sucursales />,
		authority: cfg.manage.subPages.branch.authority,
	},
	{
		path: cfg.manage.subPages.branchDetail.to,
		element: <SucursalDetalle />,
		authority: cfg.manage.subPages.branchDetail.authority,
	},
	{
		path: cfg.manage.subPages.permissionsAdmin.to,
		element: <PermissionsAdmin />,
		authority: cfg.manage.subPages.permissionsAdmin.authority,
	},
	{
		path: cfg.manage.subPages.rolesPermisos.to,
		element: <RolesPermisos />,
		authority: cfg.manage.subPages.rolesPermisos.authority,
	},
	{
		path: cfg.manage.subPages.rolesPermisosDetail.to,
		element: <UserPermissionsDetail />,
		authority: cfg.manage.subPages.rolesPermisosDetail.authority,
	},
	{
		path: cfg.humanResources.subPages.invitationsAdmin.to,
		element: <InvitationsAdmin />,
		authority: cfg.humanResources.subPages.invitationsAdmin.authority,
	},

	// Recursos Humanos — Reloj Control
	{
		path: cfg.humanResources.subPages.relojControl.to,
		element: <RelojControlPage />,
		authority: cfg.humanResources.subPages.relojControl.authority,
	},
	// Recursos Humanos — Configuración
	{
		path: cfg.humanResources.subPages.configuracionRH.to,
		element: <ConfiguracionRH />,
		authority: cfg.humanResources.subPages.configuracionRH.authority,
	},

	// Rutas de Administración del Sistema
	{
		path: cfg.systemAdmin.subPages.systemParameters.to,
		element: <SystemParametersAdmin />,
		authority: cfg.systemAdmin.subPages.systemParameters.authority,
	},
	{
		path: cfg.systemAdmin.subPages.systemParametersDetail.to,
		element: <SystemParameterDetails />,
		authority: cfg.systemAdmin.subPages.systemParametersDetail.authority,
	},

	// Rutas ERP
	// {
	// 	path: cfg.inventory.to,
	// 	element: <InventarioPage />,
	// 	authority: cfg.inventory.authority,
	// },
	{
		path: cfg.inventory.subPages.transfers.to,
		element: <TransferenciasInventario />,
		authority: cfg.inventory.subPages.transfers.authority,
	},
	{
		path: '/inventario/historial',
		element: <HistorialInventario />,
		authority: cfg.inventory.authority,
	},
	{
		path: cfg.commercial.subPages.sales.to,
		element: <SalesListPage />,
		authority: cfg.commercial.subPages.sales.authority,
	},
	{
		path: cfg.commercial.subPages.pendientesSerie.to,
		element: <PendientesSeriePage />,
		authority: cfg.commercial.subPages.pendientesSerie.authority,
	},
	{
		path: `${cfg.commercial.subPages.sales.to}/:saleId`,
		element: <SalesListPage />,
		authority: cfg.commercial.subPages.sales.authority,
	},
	{
		path: cfg.commercial.subPages.quotes.to,
		element: <CotizacionesPage />,
		authority: cfg.commercial.subPages.quotes.authority,
	},
	{
		path: cfg.commercial.subPages.enlacesPublicos.to,
		element: <EnlacesPublicosPage />,
		authority: cfg.commercial.subPages.enlacesPublicos.authority,
	},
	{
		path: cfg.commercial.subPages.solicitudes.to,
		element: <SolicitudesVentasPage />,
		authority: cfg.commercial.subPages.solicitudes.authority,
	},
	{
		path: `${cfg.commercial.subPages.quotes.to}/:quoteId`,
		element: <CotizacionesPage />,
		authority: cfg.commercial.subPages.quotes.authority,
	},
	{
		path: cfg.commercial.subPages.transfers.to,
		element: <TransferenciasComercial />,
		authority: cfg.commercial.subPages.transfers.authority,
	},
	{
		path: cfg.commercial.subPages.warranties.to,
		element: <GarantiasPage />,
		authority: cfg.commercial.subPages.warranties.authority,
	},
	{
		path: cfg.commercial.subPages.warrantyDetail.to,
		element: <GarantiaDetailsPage />,
		authority: cfg.commercial.subPages.warrantyDetail.authority,
	},
	{
		path: cfg.commercial.subPages.clientesVentas.to,
		element: <ClientesVentas />,
		authority: cfg.commercial.subPages.clientesVentas.authority,
	},
	{
		path: cfg.commercial.subPages.clientesVentasDetalle.to,
		element: <ClientesVentasDetalle />,
		authority: cfg.commercial.subPages.clientesVentasDetalle.authority,
	},

	// Reportes — rutas directas
	{
		path: cfg.reports.subPages.salesDashboard.to,
		element: <SalesDashboard />,
		authority: cfg.reports.subPages.salesDashboard.authority,
	},
	{
		path: cfg.reports.subPages.inventoryReports.to,
		element: <InventoryReports />,
		authority: cfg.reports.subPages.inventoryReports.authority,
	},

	// Integraciones (WooCommerce)
	{
		// Hub unificado con pestañas (`?tab=...`). Punto de entrada del menú.
		path: cfg.integrations.to,
		element: <IntegrationsHubPage />,
		authority: cfg.integrations.authority,
	},
	{
		path: cfg.integrations.subPages.list.to,
		element: <IntegrationsListPage />,
		authority: cfg.integrations.subPages.list.authority,
	},
	{
		path: cfg.integrations.subPages.unmappedProducts.to,
		element: <UnmappedProductsPage />,
		authority: cfg.integrations.subPages.unmappedProducts.authority,
	},
	{
		path: cfg.integrations.subPages.syncStock.to,
		element: <SyncStockPage />,
		authority: cfg.integrations.subPages.syncStock.authority,
	},
	{
		path: cfg.integrations.subPages.importOrders.to,
		element: <ImportOrdersPage />,
		authority: cfg.integrations.subPages.importOrders.authority,
	},
	{
		path: cfg.integrations.subPages.importTerms.to,
		element: <ImportTermsPage />,
		authority: cfg.integrations.subPages.importTerms.authority,
	},
	{
		path: cfg.integrations.subPages.syncedProducts.to,
		element: <WooProductsPage />,
		authority: cfg.integrations.subPages.syncedProducts.authority,
	},

	// Notificaciones
	{
		path: cfg.notifications.to,
		element: <NotificationsAllPage />,
		authority: cfg.notifications.authority,
	},
	{
		path: '/notificaciones/:id',
		element: <NotificationDetailPage />,
		authority: cfg.notifications.authority,
	},

	// Rutas para inventario
	{
		path: cfg.inventory.subPages.warehouses.to,
		element: <BodegasPage />,
		authority: cfg.inventory.subPages.warehouses.authority,
	},
	{
		path: `${cfg.inventory.subPages.warehouses.to}/:id`,
		element: <BodegasDetailPage />,
		authority: cfg.inventory.subPages.warehouses.authority,
	},
	{
		path: `${cfg.inventory.subPages.trazabilidadSubsidiary.to}`,
		element: <TrazabilidadSubsidiary />,
		authority: cfg.inventory.subPages.trazabilidadSubsidiary.authority,
	},

	{
		path: `${cfg.inventory.subPages.ingresoStock.to}`,
		element: <IngresoStock />,
		authority: cfg.inventory.subPages.ingresoStock.authority,
	},

	// Rutas de Catálogos
	{
		path: cfg.catalogs.subPages.products.to,
		element: <ProductosPage />,
		authority: cfg.catalogs.subPages.products.authority,
	},
	{
		path: cfg.catalogs.subPages.productsDetail.to,
		element: <ProductDetailPage />,
		authority: cfg.catalogs.subPages.productsDetail.authority,
	},
	{
		path: cfg.catalogs.subPages.categories.to,
		element: <CategoriasPage />,
		authority: cfg.catalogs.subPages.categories.authority,
	},
	{
		path: cfg.catalogs.subPages.brands.to,
		element: <MarcasPage />,
		authority: cfg.catalogs.subPages.brands.authority,
	},
	{
		path: cfg.catalogs.subPages.suppliers.to,
		element: <ProveedoresPage />,
		authority: cfg.catalogs.subPages.suppliers.authority,
	},
	{
		path: '/catalogos/proveedores/:id',
		element: <DetalleProveedorPage />,
		authority: cfg.catalogs.subPages.suppliers.authority,
	},
	{
		path: cfg.catalogs.subPages.customers.to,
		element: <ClientesPage />,
		authority: cfg.catalogs.subPages.customers.authority,
	},
	{
		path: '/catalogos/clientes/:id',
		element: <DetalleClientePage />,
		authority: cfg.catalogs.subPages.customers.authority,
	},
	{
		path: cfg.catalogs.subPages.documents.to,
		element: <DocumentosPage />,
		authority: cfg.catalogs.subPages.documents.authority,
	},

	// Technical Reviews Routes
	// {
	// 	path: '/technical-reviews',
	// 	element: <TechnicalReviewsHub />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },
	// {
	// 	path: '/technical-reviews/batches',
	// 	element: <BatchesList />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },
	// {
	// 	path: '/technical-reviews/batches/create',
	// 	element: <BatchCreate />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },
	// {
	// 	path: '/technical-reviews/batches/:batchId',
	// 	element: <BatchDetail />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },
	{
		path: '/technical-reviews/batches/:batchId/:itemId',
		element: <RefactorRevisiones />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/:itemId',
		element: <RefactorRevisiones />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/create',
		element: <RefactorRevisiones />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/series',
		element: <RefactorSeries />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	// {
	// 	path: '/technical-reviews/items',
	// 	element: <ItemsList />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },
	{
		path: '/technical-reviews/items/create',
		element: <RefactorRevisiones />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/items/:itemId',
		element: <RefactorRevisiones />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/traceability/:serialNumber',
		element: <RefactorTraceability />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	// {
	// 	path: cfg.technical.subPages.reviews.to,
	// 	element: <TechnicalReviewsHub />,
	// 	authority: cfg.technical.subPages.reviews.authority,
	// },

	{ path: '/sin-permisos', element: <SinPermisos />, public: true },
	{ path: '/', element: <Dashboard />, authority: cfg.dashboard.authority },
	{ path: '*', element: <NotFoundPage />, public: true },
];

export default contentRoutes;
