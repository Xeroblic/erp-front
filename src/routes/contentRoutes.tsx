import React, { lazy } from 'react';
import { Navigate, PathRouteProps, useParams } from 'react-router-dom';
import pagesConfig from '@/config/pages.config';

import LoginPage from '@/pages/Login.page';
import AceptarInvitacionEmpresa from '@/pages/AceptarInvitacionEmpresa';
import SinPermisos from '@/pages/SinPermisos';
import NotFoundPage from '@/pages/NotFound.page';

const ProfilePage = lazy(() => import('@/pages/perfil/Perfil'));
const Dashboard = lazy(() => import('@/pages/MainDashboard'));
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

const Sucursales = lazy(() => import('@/pages/gestionAdmin/sucursales/Sucursales'));
const SucursalDetalle = lazy(() => import('@/pages/gestionAdmin/sucursales/SucursalDetalle'));
const RolesPermisos = lazy(() => import('@/pages/gestionAdmin/roles y permisos/RolesPermisos'));
const UserPermissionsDetail = lazy(
	() => import('@/pages/gestionAdmin/roles y permisos/UserPermissionsDetail'),
);

// Páginas de Administración
const PermissionsAdmin = lazy(() => import('@/pages/admin/Permission/PermissionsAdmin'));
const InvitationsAdmin = lazy(() => import('@/pages/invitations/InvitationsAdmin'));
const SystemParametersAdmin = lazy(
	() => import('@/pages/admin/systemParameters/SystemParametersAdmin'),
);
const SystemParameterDetails = lazy(
	() => import('@/pages/admin/systemParameters/SystemParameterDetails'),
);

// Paginas de Comercial
const SalesListPage = lazy(() => import('../pages/comercial/ventas/SalesListPage'));
const PendientesSeriePage = lazy(() => import('../pages/comercial/ventas/pendientesSerie'));
const CotizacionesPage = lazy(() => import('../pages/comercial/cotizaciones/CotizacionesAdmin'));
const SolicitudesVentasPage = lazy(() => import('../pages/comercial/SolicitudesVentasPage'));
const EnlacesPublicosPage = lazy(() => import('@/pages/comercial/EnlacesPublicosPage'));

// Paginas de Inventario
const BodegasPage = lazy(() => import('@/pages/catalogos/bodegas'));
const BodegasDetailPage = lazy(() => import('@/pages/catalogos/bodegas/WarehouseDetailView'));
const TransferenciasComercial = lazy(
	() => import('@/pages/comercial/transferencias/TransferenciasAdmin'),
);
const TrazabilidadSucursal = lazy(
	() => import('@/pages/inventario/trazabilidad-sucursal/TrazabilidadSucursal'),
);

const PagosDiferidos = lazy(() => import('@/pages/comercial/pagosDiferidos'));
const CarteraCredito = lazy(() => import('@/pages/comercial/carteraCredito'));
const ClientesVentas = lazy(() => import('@/pages/comercial/clientesVentas/ClientesVentas'));
const ClientesVentasDetalle = lazy(
	() => import('@/pages/comercial/clientesVentas/ClientesVentasDetalle/index'),
);

const IngresoStock = lazy(() => import('@/pages/inventario/ingresoStock'));
const CatalogoAbastecimiento = lazy(
	() => import('@/pages/inventario/abastecimiento/CatalogoContrato'),
);
const Proveedores = lazy(() => import('@/pages/inventario/abastecimiento/Proveedores'));
const ProveedoresDetalle = lazy(
	() => import('@/pages/inventario/abastecimiento/Proveedores/ProveedoresDetalle'),
);
const DocumentosCompra = lazy(() => import('@/pages/inventario/abastecimiento/DocumentosCompra'));
const DocumentoCompraDetalle = lazy(
	() => import('@/pages/inventario/abastecimiento/DocumentosCompra/DocumentoCompraDetalle'),
);
const Recepciones = lazy(() => import('@/pages/inventario/abastecimiento/Recepciones'));
const Inventario = lazy(() => import('@/pages/inventario/Inventario'));
const AjustesTraslados = lazy(() => import('@/pages/inventario/abastecimiento/AjustesTraslados'));
const RecepcionDetalle = lazy(
	() => import('@/pages/inventario/abastecimiento/Recepciones/RecepcionDetalle'),
);
const InventarioProducto = lazy(() => import('@/pages/inventario/Inventario/InventarioProducto'));
const InventarioBodega = lazy(() => import('@/pages/inventario/Inventario/InventarioBodega'));

/** Detalle de Stock por ubicación → ficha de Inventario del mismo producto. */
const StockDetalleRedirect = () => {
	const { productId } = useParams();
	return <Navigate to={`/inventario/stock/${productId ?? ''}`} replace />;
};
const RetirosEquiposPage = lazy(() => import('@/pages/inventario/retirosEquipos'));

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

const contentRoutes: IRoutePersonalizada[] = [
	{ path: pagesConfig.loginPage.to, element: <LoginPage />, public: true },
	{ path: pagesConfig.recuperarPassword.to, element: <RecoverPasswordPage />, public: true },
	{ path: pagesConfig.confirmarNuevaPass.to, element: <ResetPasswordPage />, public: true },
	{ path: pagesConfig.portalPedidosMock.to, element: <PortalPedidosPage />, public: true },
	{ path: pagesConfig.portalPedidos.to, element: <PortalPedidosPage />, public: true },
	{ path: pagesConfig.FormularioLockCare.to, element: <FormLockCare />, public: true },
	{
		path: pagesConfig.FormularioLockCare.subPages.publicLockCare.to,
		element: <PublicLockCare />,
		public: true,
	},
	{
		path: pagesConfig.FormularioLockCare.subPages.checkOutLockCare.to,
		element: <CheckOutLockCare />,
		public: true,
	},
	// Gestión interna de casilleros
	{
		path: pagesConfig.technical.subPages.lockersManagement.to,
		element: <LockersManagement />,
		authority: pagesConfig.technical.subPages.lockersManagement.authority,
	},
	{
		path: pagesConfig.technical.subPages.refactor.to,
		element: <RefactorTechnicalReview />,
		authority: pagesConfig.technical.subPages.refactor.authority,
	},
	{
		path: pagesConfig.technical.subPages.lotes.to,
		element: <RefactorBatches />,
		authority: pagesConfig.technical.subPages.lotes.authority,
	},
	{
		path: '/technical-reviews/lotes/crear',
		element: <RefactorCrearLote />,
		authority: pagesConfig.technical.subPages.lotes.authority,
	},
	{
		path: '/technical-reviews/lotes/:batchId',
		element: <RefactorDetalleLote />,
		authority: pagesConfig.technical.subPages.lotes.authority,
	},
	{ path: '/usuarios/activar/:token', element: <AceptarInvitacionEmpresa />, public: true },

	{
		path: pagesConfig.profilePage.to,
		element: <ProfilePage />,
		authority: pagesConfig.profilePage.authority,
	},
	{
		path: pagesConfig.dashboard.to,
		element: <Dashboard />,
		authority: pagesConfig.dashboard.authority,
	},

	{
		path: pagesConfig.manage.subPages.company.to,
		element: <EmpresaPage />,
		authority: pagesConfig.manage.subPages.company.authority,
	},
	{
		path: pagesConfig.manage.subPages.subsidiary.to,
		element: <SubEmpresa />,
		authority: pagesConfig.manage.subPages.subsidiary.authority,
	},
	{
		path: pagesConfig.manage.subPages.subsidiaryDetail.to,
		element: <SubEmpresaDetalle />,
		authority: pagesConfig.manage.subPages.subsidiaryDetail.authority,
	},
	{
		path: pagesConfig.manage.subPages.subsidiaryCustomization.to,
		element: <SubEmpresaPersonalizacion />,
		authority: pagesConfig.manage.subPages.subsidiaryCustomization.authority,
	},
	{
		path: pagesConfig.manage.subPages.branch.to,
		element: <Sucursales />,
		authority: pagesConfig.manage.subPages.branch.authority,
	},
	{
		path: pagesConfig.manage.subPages.branchDetail.to,
		element: <SucursalDetalle />,
		authority: pagesConfig.manage.subPages.branchDetail.authority,
	},
	{
		path: pagesConfig.manage.subPages.permissionsAdmin.to,
		element: <PermissionsAdmin />,
		authority: pagesConfig.manage.subPages.permissionsAdmin.authority,
	},
	{
		path: pagesConfig.manage.subPages.rolesPermisos.to,
		element: <RolesPermisos />,
		authority: pagesConfig.manage.subPages.rolesPermisos.authority,
	},
	{
		path: pagesConfig.manage.subPages.rolesPermisosDetail.to,
		element: <UserPermissionsDetail />,
		authority: pagesConfig.manage.subPages.rolesPermisosDetail.authority,
	},
	{
		path: pagesConfig.humanResources.subPages.invitationsAdmin.to,
		element: <InvitationsAdmin />,
		authority: pagesConfig.humanResources.subPages.invitationsAdmin.authority,
	},

	// Recursos Humanos — Reloj Control
	{
		path: pagesConfig.humanResources.subPages.relojControl.to,
		element: <RelojControlPage />,
		authority: pagesConfig.humanResources.subPages.relojControl.authority,
	},
	// Recursos Humanos — Configuración
	{
		path: pagesConfig.humanResources.subPages.configuracionRH.to,
		element: <ConfiguracionRH />,
		authority: pagesConfig.humanResources.subPages.configuracionRH.authority,
	},

	// Rutas de Administración del Sistema
	{
		path: pagesConfig.systemAdmin.subPages.systemParameters.to,
		element: <SystemParametersAdmin />,
		authority: pagesConfig.systemAdmin.subPages.systemParameters.authority,
	},
	{
		path: pagesConfig.systemAdmin.subPages.systemParametersDetail.to,
		element: <SystemParameterDetails />,
		authority: pagesConfig.systemAdmin.subPages.systemParametersDetail.authority,
	},

	// Rutas ERP
	{
		path: pagesConfig.commercial.subPages.sales.to,
		element: <SalesListPage />,
		authority: pagesConfig.commercial.subPages.sales.authority,
	},
	{
		path: pagesConfig.commercial.subPages.pendientesSerie.to,
		element: <PendientesSeriePage />,
		authority: pagesConfig.commercial.subPages.pendientesSerie.authority,
	},
	{
		path: `${pagesConfig.commercial.subPages.sales.to}/:saleId`,
		element: <SalesListPage />,
		authority: pagesConfig.commercial.subPages.sales.authority,
	},
	{
		path: pagesConfig.commercial.subPages.quotes.to,
		element: <CotizacionesPage />,
		authority: pagesConfig.commercial.subPages.quotes.authority,
	},
	{
		path: pagesConfig.commercial.subPages.enlacesPublicos.to,
		element: <EnlacesPublicosPage />,
		authority: pagesConfig.commercial.subPages.enlacesPublicos.authority,
	},
	{
		path: pagesConfig.commercial.subPages.solicitudes.to,
		element: <SolicitudesVentasPage />,
		authority: pagesConfig.commercial.subPages.solicitudes.authority,
	},
	{
		path: `${pagesConfig.commercial.subPages.quotes.to}/:quoteId`,
		element: <CotizacionesPage />,
		authority: pagesConfig.commercial.subPages.quotes.authority,
	},
	{
		path: pagesConfig.commercial.subPages.transfers.to,
		element: <TransferenciasComercial />,
		authority: pagesConfig.commercial.subPages.transfers.authority,
	},
	{
		path: pagesConfig.commercial.subPages.warranties.to,
		element: <GarantiasPage />,
		authority: pagesConfig.commercial.subPages.warranties.authority,
	},
	{
		path: pagesConfig.commercial.subPages.warrantyDetail.to,
		element: <GarantiaDetailsPage />,
		authority: pagesConfig.commercial.subPages.warrantyDetail.authority,
	},
	{
		path: pagesConfig.commercial.subPages.pagosDiferidos.to,
		element: <PagosDiferidos />,
		authority: pagesConfig.commercial.subPages.pagosDiferidos.authority,
	},
	{
		path: pagesConfig.commercial.subPages.carteraCredito.to,
		element: <CarteraCredito />,
		authority: pagesConfig.commercial.subPages.carteraCredito.authority,
	},
	{
		path: pagesConfig.commercial.subPages.clientesVentas.to,
		element: <ClientesVentas />,
		authority: pagesConfig.commercial.subPages.clientesVentas.authority,
	},
	{
		path: pagesConfig.commercial.subPages.clientesVentasDetalle.to,
		element: <ClientesVentasDetalle />,
		authority: pagesConfig.commercial.subPages.clientesVentasDetalle.authority,
	},

	// Reportes — rutas directas
	{
		path: pagesConfig.reports.subPages.salesDashboard.to,
		element: <SalesDashboard />,
		authority: pagesConfig.reports.subPages.salesDashboard.authority,
	},
	{
		path: pagesConfig.reports.subPages.inventoryReports.to,
		element: <InventoryReports />,
		authority: pagesConfig.reports.subPages.inventoryReports.authority,
	},

	// Integraciones (WooCommerce)
	{
		// Hub unificado con pestañas (`?tab=...`). Punto de entrada del menú.
		path: pagesConfig.integrations.to,
		element: <IntegrationsHubPage />,
		authority: pagesConfig.integrations.authority,
	},
	{
		path: pagesConfig.integrations.subPages.list.to,
		element: <IntegrationsListPage />,
		authority: pagesConfig.integrations.subPages.list.authority,
	},
	{
		path: pagesConfig.integrations.subPages.unmappedProducts.to,
		element: <UnmappedProductsPage />,
		authority: pagesConfig.integrations.subPages.unmappedProducts.authority,
	},
	{
		path: pagesConfig.integrations.subPages.syncStock.to,
		element: <SyncStockPage />,
		authority: pagesConfig.integrations.subPages.syncStock.authority,
	},
	{
		path: pagesConfig.integrations.subPages.importOrders.to,
		element: <ImportOrdersPage />,
		authority: pagesConfig.integrations.subPages.importOrders.authority,
	},
	{
		path: pagesConfig.integrations.subPages.importTerms.to,
		element: <ImportTermsPage />,
		authority: pagesConfig.integrations.subPages.importTerms.authority,
	},
	{
		path: pagesConfig.integrations.subPages.syncedProducts.to,
		element: <WooProductsPage />,
		authority: pagesConfig.integrations.subPages.syncedProducts.authority,
	},

	// Notificaciones
	{
		path: pagesConfig.notifications.to,
		element: <NotificationsAllPage />,
		authority: pagesConfig.notifications.authority,
	},
	{
		path: '/notificaciones/:id',
		element: <NotificationDetailPage />,
		authority: pagesConfig.notifications.authority,
	},

	// Rutas para inventario
	{
		path: pagesConfig.inventory.subPages.warehouses.to,
		element: <BodegasPage />,
		authority: pagesConfig.inventory.subPages.warehouses.authority,
	},
	{
		path: `${pagesConfig.inventory.subPages.warehouses.to}/:id`,
		element: <BodegasDetailPage />,
		authority: pagesConfig.inventory.subPages.warehouses.authority,
	},
	{
		path: `${pagesConfig.inventory.subPages.trazabilidadSubsidiary.to}`,
		element: <TrazabilidadSucursal />,
		authority: pagesConfig.inventory.subPages.trazabilidadSubsidiary.authority,
	},

	{
		path: `${pagesConfig.inventory.subPages.ingresoStock.to}`,
		element: <IngresoStock />,
		authority: pagesConfig.inventory.subPages.ingresoStock.authority,
	},

	{
		path: pagesConfig.inventory.subPages.catalogoAbastecimiento.to,
		element: <CatalogoAbastecimiento />,
		authority: pagesConfig.inventory.subPages.catalogoAbastecimiento.authority,
	},

	{
		path: pagesConfig.inventory.subPages.proveedores.to,
		element: <Proveedores />,
		authority: pagesConfig.inventory.subPages.proveedores.authority,
	},

	{
		path: pagesConfig.inventory.subPages.proveedoresDetalle.to,
		element: <ProveedoresDetalle />,
		authority: pagesConfig.inventory.subPages.proveedoresDetalle.authority,
	},

	{
		path: pagesConfig.inventory.subPages.documentosCompra.to,
		element: <DocumentosCompra />,
		authority: pagesConfig.inventory.subPages.documentosCompra.authority,
	},

	{
		path: pagesConfig.inventory.subPages.documentosCompraDetalle.to,
		element: <DocumentoCompraDetalle />,
		authority: pagesConfig.inventory.subPages.documentosCompraDetalle.authority,
	},

	{
		path: pagesConfig.inventory.subPages.recepciones.to,
		element: <Recepciones />,
		authority: pagesConfig.inventory.subPages.recepciones.authority,
	},

	{
		path: pagesConfig.inventory.subPages.recepcionDetalle.to,
		element: <RecepcionDetalle />,
		authority: pagesConfig.inventory.subPages.recepcionDetalle.authority,
	},
	{
		path: pagesConfig.inventory.subPages.inventario.to,
		element: <Inventario />,
		authority: pagesConfig.inventory.subPages.inventario.authority,
	},
	{
		path: pagesConfig.inventory.subPages.inventarioBodega.to,
		element: <InventarioBodega />,
		authority: pagesConfig.inventory.subPages.inventarioBodega.authority,
	},
	{
		path: pagesConfig.inventory.subPages.inventarioProducto.to,
		element: <InventarioProducto />,
		authority: pagesConfig.inventory.subPages.inventarioProducto.authority,
	},
	// Stock por ubicación se unificó en Inventario: los enlaces guardados siguen
	// abriendo (la ficha conserva el producto; la ubicación se elige en ella).
	{
		path: '/inventario/abastecimiento/stock',
		element: <Navigate to={pagesConfig.inventory.subPages.inventario.to} replace />,
		authority: pagesConfig.inventory.subPages.inventario.authority,
	},
	{
		path: '/inventario/abastecimiento/stock/:productId',
		element: <StockDetalleRedirect />,
		authority: pagesConfig.inventory.subPages.inventarioProducto.authority,
	},

	{
		path: pagesConfig.inventory.subPages.ajustesTraslados.to,
		element: <AjustesTraslados />,
		authority: pagesConfig.inventory.subPages.ajustesTraslados.authority,
	},
	// Rutas previas a la unificación: redirigen a su pestaña para no romper
	// enlaces guardados.
	{
		path: '/inventario/abastecimiento/traslados',
		element: (
			<Navigate
				to={`${pagesConfig.inventory.subPages.ajustesTraslados.to}?tab=traslado`}
				replace
			/>
		),
		authority: pagesConfig.inventory.subPages.ajustesTraslados.authority,
	},
	{
		path: '/inventario/abastecimiento/ajustes',
		element: (
			<Navigate
				to={`${pagesConfig.inventory.subPages.ajustesTraslados.to}?tab=ajuste`}
				replace
			/>
		),
		authority: pagesConfig.inventory.subPages.ajustesTraslados.authority,
	},
	// El formulario de transferencias entre bodegas se retiró: confirmaba con éxito sin
	// llamar a la API. Mover unidades entre bodegas es la pestaña Traslado.
	{
		path: '/inventario/transferencias',
		element: (
			<Navigate
				to={`${pagesConfig.inventory.subPages.ajustesTraslados.to}?tab=traslado`}
				replace
			/>
		),
		authority: pagesConfig.inventory.subPages.ajustesTraslados.authority,
	},
	// El historial de inventario sólo listaba transferencias con la misma tabla de
	// Comercial › Transferencias, que es donde se consultan ahora.
	{
		path: '/inventario/historial',
		element: <Navigate to={pagesConfig.commercial.subPages.transfers.to} replace />,
		authority: pagesConfig.commercial.subPages.transfers.authority,
	},

	{
		path: pagesConfig.inventory.subPages.retirosEquipos.to,
		element: <RetirosEquiposPage />,
		authority: pagesConfig.inventory.subPages.retirosEquipos.authority,
	},

	// Rutas de Catálogos
	{
		path: pagesConfig.catalogs.subPages.products.to,
		element: <ProductosPage />,
		authority: pagesConfig.catalogs.subPages.products.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.productsDetail.to,
		element: <ProductDetailPage />,
		authority: pagesConfig.catalogs.subPages.productsDetail.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.categories.to,
		element: <CategoriasPage />,
		authority: pagesConfig.catalogs.subPages.categories.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.brands.to,
		element: <MarcasPage />,
		authority: pagesConfig.catalogs.subPages.brands.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.suppliers.to,
		element: <ProveedoresPage />,
		authority: pagesConfig.catalogs.subPages.suppliers.authority,
	},
	{
		path: '/catalogos/proveedores/:id',
		element: <DetalleProveedorPage />,
		authority: pagesConfig.catalogs.subPages.suppliers.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.customers.to,
		element: <ClientesPage />,
		authority: pagesConfig.catalogs.subPages.customers.authority,
	},
	{
		path: '/catalogos/clientes/:id',
		element: <DetalleClientePage />,
		authority: pagesConfig.catalogs.subPages.customers.authority,
	},
	{
		path: pagesConfig.catalogs.subPages.documents.to,
		element: <DocumentosPage />,
		authority: pagesConfig.catalogs.subPages.documents.authority,
	},

	{
		path: '/technical-reviews/batches/:batchId/:itemId',
		element: <RefactorRevisiones />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/:itemId',
		element: <RefactorRevisiones />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/batches/:batchId/items/create',
		element: <RefactorRevisiones />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/series',
		element: <RefactorSeries />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/items/create',
		element: <RefactorRevisiones />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/items/:itemId',
		element: <RefactorRevisiones />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},
	{
		path: '/technical-reviews/traceability/:serialNumber',
		element: <RefactorTraceability />,
		authority: pagesConfig.technical.subPages.reviews.authority,
	},

	{ path: '/sin-permisos', element: <SinPermisos />, public: true },
	{ path: '/', element: <Dashboard />, authority: pagesConfig.dashboard.authority },
	{ path: '*', element: <NotFoundPage />, public: true },
];

export default contentRoutes;
