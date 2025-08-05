import { combineReducers, CombinedState, AnyAction, Reducer } from 'redux';
import RtkQueryService from '@/services/RtkQueryService'

import auth, { AuthState, logout } from './slices/auth/authSlice';
import core, { CoreState } from './slices/core/coreSlice';
import invitacion, { InvitacionState } from './slices/invitacion/invitacionSlice';
import empresa, { EmpresaState } from './slices/empresa/empresaSlice';
import calendario, { CalendarioState } from './slices/calendario/calendarioSlice';
import item, { ItemState } from './slices/item/itemSlice';
// import bodega, { BodegaState } from './slices/bodega/bodegaSlice'
import cliente, { ClienteState } from './slices/clientes/clienteSlice';
import rolesPermisos, { RolesPermisosState } from './slices/rolesPermisos/rolesPermisosSlice';
import subEmpresa, { SubempresaState } from './slices/subempresa/subEmpresaSlice';
import permissions from './slices/permissions/permissionsSlice';
import usersAdmin from './slices/usersAdmin/usersAdminSlice';
import feature from './slices/featuresSlice/featuresSlice';

export interface RootState {
    auth: AuthState;
    core: CoreState;
    invitacion: InvitacionState;
    empresa: EmpresaState;
    rolesPermisos: RolesPermisosState;
    subEmpresa: SubempresaState;
    permissions: ReturnType<typeof permissions>;
    usersAdmin: ReturnType<typeof usersAdmin>;
    feature: ReturnType<typeof feature>;
    // calendario?: CalendarioState;
    // item?: ItemState;
    // bodega?: BodegaState;
    cliente: ClienteState;
    [RtkQueryService.reducerPath]: any
}

export interface AsyncReducers {
    [key: string]: Reducer<any, AnyAction>;
}

// Reducers estáticos
const staticReducers = {
    auth,
    core,
    empresa,
    invitacion,
    rolesPermisos,
    subEmpresa,
    cliente,
    permissions,
    usersAdmin,
    feature,
    [RtkQueryService.reducerPath]: RtkQueryService.reducer,
};

const rootReducer =
    (asyncReducers?: AsyncReducers) =>
        (state: RootState | undefined, action: AnyAction) => {
            // Quitar Estado si es LOGOUT
            if (action.type === logout.type) {
                state = undefined;
            }
            const combinedReducer = combineReducers({
                ...staticReducers,
                ...asyncReducers,
            })
            return combinedReducer(state, action)
        }

export default rootReducer
