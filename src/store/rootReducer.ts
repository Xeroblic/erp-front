import { combineReducers, CombinedState, AnyAction, Reducer } from 'redux';
import RtkQueryService from '@/services/RtkQueryService';

import auth, { AuthState, logout } from './slices/auth/authSlice';
import core, { CoreState } from './slices/core/coreSlice';
import invitations from './slices/invitations/invitationsSlice';
import empresa, { EmpresaState } from './slices/empresa/empresaSlice';
import calendario, { CalendarioState } from './slices/calendario/calendarioSlice';
import item, { ItemState } from './slices/item/itemSlice';
// import bodega, { BodegaState } from './slices/bodega/bodegaSlice'
import cliente, { ClienteState } from './slices/clientes/clienteSlice';
import rolesPermisos, { RolesPermisosState } from './slices/rolesPermisos/rolesPermisosSlice';
import subEmpresa, { SubempresaState } from './slices/subempresa/subEmpresaSlice';
import sucursales, { SucursalesState } from './slices/sucursales/sucursalesSlice';
import permissions from './slices/permissions/permissionsSlice';
import usersAdmin from './slices/usersAdmin/usersAdminSlice';
// Importamos el tipo sin crear dependencia circular
import type { PersonalizacionState } from './slices/personalizacion/personalizacionSlice';

// Importar nuevos slices ERP
import transferencias, { TransferState } from './slices/transfers/transfersSlice';
import cotizaciones, { QuoteState } from './slices/quotes/quotesSlice';
import ventas from './slices/sales/salesSlice';
import inventario from './slices/inventory/inventorySlice';
import brands from './slices/brands/brandsSlice';
import categories, { CategoriesState } from './slices/categories/categoriesSlice';
import products, { ProductsState } from './slices/products/productsSlice';
import notifications from './slices/notifications/notificationsSlice';
import suppliers from './slices/suppliers/suppliersSlice';
import customerSuppliers from './slices/customerSuppliers/customerSuppliersSlice';

export interface RootState {
	auth: AuthState;
	core: CoreState;
	invitations: ReturnType<typeof invitations>;
	empresa: EmpresaState;
	rolesPermisos: RolesPermisosState;
	subEmpresa: SubempresaState;
	sucursales: SucursalesState;
	permissions: ReturnType<typeof permissions>;
	usersAdmin: ReturnType<typeof usersAdmin>;
	personalizacion?: PersonalizacionState; // Opcional al inicio, se agrega dinámicamente
	// calendario?: CalendarioState;
	// item?: ItemState;
	// bodega?: BodegaState;
	cliente: ClienteState;
	// Nuevos slices ERP
	transferencias: TransferState;
	cotizaciones: QuoteState;
	ventas: ReturnType<typeof ventas>;
	inventario: ReturnType<typeof inventario>;
	brands: ReturnType<typeof brands>;
	categories: CategoriesState;
	products: ProductsState;
	notifications: ReturnType<typeof notifications>;
	suppliers: ReturnType<typeof suppliers>;
	customerSuppliers: ReturnType<typeof customerSuppliers>;
	[RtkQueryService.reducerPath]: any;
}

export interface AsyncReducers {
	[key: string]: Reducer<any, AnyAction>;
}

// Reducers estáticos
const staticReducers = {
	auth,
	core,
	empresa,
	invitations,
	rolesPermisos,
	subEmpresa,
	sucursales,
	cliente,
	permissions,
	usersAdmin,
	// Nuevos slices ERP
	transferencias,
	cotizaciones,
	ventas,
	inventario,
	brands,
	categories,
	products,
	notifications,
	suppliers,
	customerSuppliers,
	// personalizacion, // Comentado temporalmente
	[RtkQueryService.reducerPath]: RtkQueryService.reducer,
};

const rootReducer =
	(asyncReducers?: AsyncReducers) => (state: RootState | undefined, action: AnyAction) => {
		// Quitar Estado si es LOGOUT
		if (action.type === logout.type) {
			state = undefined;
		}
		const combinedReducer = combineReducers({
			...staticReducers,
			...asyncReducers,
		});
		return combinedReducer(state, action);
	};

export default rootReducer;
