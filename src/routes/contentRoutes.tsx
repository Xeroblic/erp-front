// src/routes/contentRoutes.tsx
import React, { lazy } from 'react';
import { PathRouteProps } from 'react-router-dom';
import pagesConfig from '@/config/pages.config';

import LoginPage from '@/pages/Login.page';
import RecuperarPassword from '@/pages/ResetPassword/RecuperarPassword';
import ConfirmarNuevaPass from '@/pages/ResetPassword/ConfirmarNuevaPass';
import SinPermisos from '@/pages/SinPermisos';
import NotFoundPage from '@/pages/NotFound.page';

const ProfilePage = lazy(() => import('@/pages/Perfil'));
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
const Sucursales = lazy(() => import('@/pages/gestionAdmin/sucursales/Sucursales.tsx'));
const SucursalDetalle = lazy(() => import('@/pages/gestionAdmin/sucursales/SucursalDetalle.tsx'));
const RolesPermisos = lazy(() => import('@/pages/gestionAdmin/roles y permisos/RolesPermisos.tsx'));
const GestionUsuarios = lazy(() => import('@/pages/gestionAdmin/usuarios/Usuarios.tsx'));

// Páginas de Administración
const PermissionsAdmin = lazy(() => import('@/pages/admin/PermissionsAdmin.tsx'));
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
const VentasAdmin = lazy(() => import('@/pages/comercial/ventas/VentasAdmin'));
const CotizacionesPage = lazy(() => import('@/pages/comercial/cotizaciones/CotizacionesAdmin'));
const TransferenciasInventario = lazy(
	() => import('@/pages/inventario/transferencias/Transferencias'),
);
const TransferenciasComercial = lazy(
	() => import('@/pages/comercial/transferencias/TransferenciasAdmin'),
);

// Páginas de Catálogos
const ProductosPage = lazy(() => import('@/pages/catalogos/productos/Productos'));
const BodegasPage = lazy(() => import('@/pages/catalogos/bodegas/Bodegas'));
const CategoriasPage = lazy(() => import('@/pages/catalogos/categorias/Categorias'));
const MarcasPage = lazy(() => import('@/pages/catalogos/marcas/Marcas'));
const ProveedoresPage = lazy(() => import('@/pages/catalogos/proveedores/Proveedores'));
const ClientesPage = lazy(() => import('@/pages/catalogos/clientes/Clientes'));
const DocumentosPage = lazy(() => import('@/pages/documentos/Documentos'));
const RevisionesTecnicasPage = lazy(() => import('@/pages/revisiones-tecnicas/RevisionesTecnicas'));

export interface IRoutePersonalizada extends PathRouteProps {
	authority?: string[];
	feature?: string;
	public?: boolean;
}

const cfg = pagesConfig as any;

const contentRoutes: IRoutePersonalizada[] = [
	{ path: cfg.loginPage.to, element: <LoginPage />, public: true },
	{ path: cfg.recuperarPassword.to, element: <RecuperarPassword />, public: true },

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
		path: cfg.manage.subPages.roles.to,
		element: <RolesPermisos />,
		authority: cfg.manage.subPages.roles.authority,
	},
	{
		path: cfg.manage.subPages.manageUsers.to,
		element: <GestionUsuarios />,
		authority: cfg.manage.subPages.manageUsers.authority,
	},
	{
		path: cfg.manage.subPages.permissionsAdmin.to,
		element: <PermissionsAdmin />,
		authority: cfg.manage.subPages.permissionsAdmin.authority,
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
		element: <VentasAdmin />,
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

	// Rutas de Catálogos
	{
		path: cfg.catalogs.subPages.products.to,
		element: <ProductosPage />,
		authority: cfg.catalogs.subPages.products.authority,
	},
	{
		path: cfg.catalogs.subPages.warehouses.to,
		element: <BodegasPage />,
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
		path: cfg.catalogs.subPages.customers.to,
		element: <ClientesPage />,
		authority: cfg.catalogs.subPages.customers.authority,
	},
	{
		path: cfg.catalogs.subPages.documents.to,
		element: <DocumentosPage />,
		authority: cfg.catalogs.subPages.documents.authority,
	},
	{
		path: cfg.technical.subPages.reviews.to,
		element: <RevisionesTecnicasPage />,
		authority: cfg.technical.subPages.reviews.authority,
	},

	{ path: '/sin-permisos', element: <SinPermisos />, public: true },
	{ path: '/', element: <Dashboard />, authority: cfg.dashboard.authority },
	{ path: '*', element: <NotFoundPage />, public: true },
];

export default contentRoutes;
