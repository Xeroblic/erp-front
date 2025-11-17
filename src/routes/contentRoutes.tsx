// src/routes/contentRoutes.tsx
import React, { lazy } from 'react';
import { PathRouteProps } from 'react-router-dom';
import pagesConfig from '@/config/pages.config';

import LoginPage from '@/pages/Login.page';
import RecuperarPassword from '@/pages/ResetPassword/RecuperarPassword';
import ConfirmarNuevaPass from '@/pages/ResetPassword/ConfirmarNuevaPass';
import AceptarInvitacionEmpresa from '@/pages/AceptarInvitacionEmpresa';
import SinPermisos from '@/pages/SinPermisos';
import NotFoundPage from '@/pages/NotFound.page';

const ProfilePage = lazy(() => import('@/pages/perfil/Perfil'));
const Dashboard = lazy(() => import('@/pages/MainDashboard'));
// const ProductosPage = lazy(() => import("@/pages/Productos"));
// const UsuariosPage  = lazy(() => import("@/pages/Usuarios"));
// const Cotizaciones  = lazy(() => import("@/pages/Cotizaciones"));
const EmpresaPage = lazy(() => import('@/pages/gestionAdmin/empresa/Empresa'));
const SubEmpresa = lazy(() => import('@/pages/gestionAdmin/subempresa/SubEmpresa'));
const SubEmpresaDetalle = lazy(() => import('@/pages/gestionAdmin/subempresa/SubEmpresaDetalle'));
const SubEmpresaPersonalizacion = lazy(
	() => import('@/pages/gestionAdmin/subempresa/SubEmpresaPersonalizacion'),
);

// Páginas de Integraciones (nuevo módulo)
const IntegrationsListPage = lazy(() => import('@/pages/integraciones/IntegrationsListPage'));
const UnmappedProductsPage = lazy(() => import('@/pages/integraciones/UnmappedProductsPage'));
const SyncStockPage = lazy(() => import('@/pages/integraciones/SyncStockPage'));
const ImportOrdersPage = lazy(() => import('@/pages/integraciones/ImportOrdersPage'));

// Reportes
const ReportsHome = lazy(() => import('@/pages/reportes/ReportsHome'));
const SalesDashboard = lazy(() => import('@/pages/reportes/SalesDashboard'));
const InventoryReports = lazy(() => import('@/pages/reportes/InventoryReports'));
const FinancialReports = lazy(() => import('@/pages/reportes/FinancialReports'));

const Sucursales = lazy(() => import('@/pages/gestionAdmin/sucursales/Sucursales.tsx'));
const SucursalDetalle = lazy(() => import('@/pages/gestionAdmin/sucursales/SucursalDetalle.tsx'));
const RolesPermisos = lazy(() => import('@/pages/gestionAdmin/roles y permisos/RolesPermisos.tsx'));
const UserPermissionsDetail = lazy(
	() => import('@/pages/gestionAdmin/roles y permisos/UserPermissionsDetail.tsx'),
);
const GestionUsuarios = lazy(() => import('@/pages/gestionAdmin/usuarios/Usuarios.tsx'));

// Páginas de Administración
const PermissionsAdmin = lazy(() => import('@/pages/admin/Permission/PermissionsAdmin'));
const InvitationsAdmin = lazy(() => import('@/pages/invitations/InvitationsAdmin.tsx'));
const SystemParametersAdmin = lazy(
	() => import('@/pages/admin/systemParameters/SystemParametersAdmin'),
);
const SystemParameterDetails = lazy(
	() => import('@/pages/admin/systemParameters/SystemParameterDetails'),
);

// Páginas ERP
const InventarioPage = lazy(() => import('@/pages/inventario/Inventario'));
const HistorialInventario = lazy(
	() => import('@/pages/inventario/historial/HistorialInventarioAdmin'),
);
const SalesListPage = lazy(() => import('@/pages/ventas/SalesListPage'));
const CotizacionesPage = lazy(() => import('@/pages/comercial/cotizaciones/CotizacionesAdmin'));
const TransferenciasInventario = lazy(
	() => import('@/pages/inventario/transferencias/Transferencias'),
);
const TransferenciasComercial = lazy(
	() => import('@/pages/comercial/transferencias/TransferenciasAdmin'),
);

// Páginas de Catálogos
const ProductosPage = lazy(() => import('@/pages/catalogos/productos/Productos'));
const ProductDetailPage = lazy(() => import('@/pages/catalogos/productos/ProductDetail'));
const BodegasPage = lazy(() => import('@/pages/catalogos/bodegas/WarehouseListPage'));
const BodegasDetailPage = lazy(() => import('@/pages/catalogos/bodegas/WarehouseDetailPage'));
const CategoriasPage = lazy(() => import('@/pages/catalogos/categorias/Categorias'));
const MarcasPage = lazy(() => import('@/pages/catalogos/marcas/Marcas'));
const ProveedoresPage = lazy(() => import('@/pages/catalogos/proveedores/Proveedores'));
const DetalleProveedorPage = lazy(() => import('@/pages/catalogos/proveedores/DetalleProveedor'));
const ClientesPage = lazy(() => import('@/pages/catalogos/clientes/Clientes'));
const DetalleClientePage = lazy(() => import('@/pages/catalogos/clientes/DetalleCliente'));
const DocumentosPage = lazy(() => import('@/pages/documentos/Documentos'));
const GarantiasPage = lazy(() => import('@/pages/garantias/GarantiasPage'));
const GarantiaDetailsPage = lazy(() => import('@/pages/garantias/GarantiaDetailsPage'));

// Páginas de Technical Reviews
const TechnicalReviewsHub = lazy(() => import('@/pages/technical-reviews/index'));
const BatchesList = lazy(() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchListPage'));
const BatchCreate = lazy(() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchCreatePage'));
const BatchDetail = lazy(() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchDetailPage'));
const BatchItemReview = lazy(
	() => import('@/pages/technical-reviews/modo-a-batches/pages/BatchItemReviewPage'),
);
const ItemsList = lazy(() => import('@/pages/technical-reviews/modo-b-items/pages/ItemListPage'));
const ItemReview = lazy(() => import('@/pages/technical-reviews/modo-b-items/pages/ItemReviewPage'));

const NotificationsAllPage = lazy(() => import('@/pages/notificaciones/NotificationsAll'));
const NotificationDetailPage = lazy(() => import('@/pages/notificaciones/NotificationDetail'));

export interface IRoutePersonalizada extends PathRouteProps {
	authority?: string[];
	feature?: string;
	public?: boolean;
}

const cfg = pagesConfig as any;

const contentRoutes: IRoutePersonalizada[] = [
	{ path: cfg.loginPage.to, element: <LoginPage />, public: true },
	{ path: cfg.recuperarPassword.to, element: <RecuperarPassword />, public: true },
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
		path: cfg.manage.subPages.manageUsers.to,
		element: <GestionUsuarios />,
		authority: cfg.manage.subPages.manageUsers.authority,
	},
	{
		path: cfg.humanResources.subPages.invitationsAdmin.to,
		element: <InvitationsAdmin />,
		authority: cfg.humanResources.subPages.invitationsAdmin.authority,
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
	{
		path: cfg.inventory.to,
		element: <InventarioPage />,
		authority: cfg.inventory.authority,
	},
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
		path: cfg.commercial.subPages.quotes.to,
		element: <CotizacionesPage />,
		authority: cfg.commercial.subPages.quotes.authority,
	},
	{
		path: cfg.commercial.subPages.transfers.to,
		element: <TransferenciasComercial />,
		authority: cfg.commercial.subPages.transfers.authority,
	},

	// Reportes
	{
		path: cfg.reports.to,
		element: <ReportsHome />,
		authority: cfg.reports.authority,
	},
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
	{
		path: cfg.reports.subPages.financialReports.to,
		element: <FinancialReports />,
		authority: cfg.reports.subPages.financialReports.authority,
	},

	// Integraciones (WooCommerce)
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
		path: cfg.catalogs.subPages.warehouses.to,
		element: <BodegasPage />,
		authority: cfg.catalogs.subPages.warehouses.authority,
	},
	{
		path: `${cfg.catalogs.subPages.warehouses.to}/:id`,
		element: <BodegasDetailPage />,
		authority: cfg.catalogs.subPages.warehouses.authority,
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
	{
		path: cfg.catalogs.subPages.warranties.to,
		element: <GarantiasPage />,
		authority: cfg.catalogs.subPages.warranties.authority,
	},
	{
		path: cfg.catalogs.subPages.warrantyDetail.to,
		element: <GarantiaDetailsPage />,
		authority: cfg.catalogs.subPages.warrantyDetail.authority,
	},

	// Technical Reviews Routes
	{
		path: '/technical-reviews',
		element: <TechnicalReviewsHub />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches',
		element: <BatchesList />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/create',
		element: <BatchCreate />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId',
		element: <BatchDetail />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/:itemId',
		element: <BatchItemReview />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/create',
		element: <BatchItemReview />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/:itemId',
		element: <BatchItemReview />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/items',
		element: <ItemsList />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/items/:itemId',
		element: <ItemReview />,
		authority: cfg.technical.subPages.reviews.authority,
	},
	{
		path: cfg.technical.subPages.reviews.to,
		element: <TechnicalReviewsHub />,
		authority: cfg.technical.subPages.reviews.authority,
	},

	{ path: '/sin-permisos', element: <SinPermisos />, public: true },
	{ path: '/', element: <Dashboard />, authority: cfg.dashboard.authority },
	{ path: '*', element: <NotFoundPage />, public: true },
];

export default contentRoutes;
