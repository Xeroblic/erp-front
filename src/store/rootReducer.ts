import { combineReducers, CombinedState, AnyAction, Reducer } from 'redux'
import RtkQueryService from '@/services/RtkQueryService'
import auth, { AuthState, LOGOUT } from './slices/auth/authSlice'   
import core, { CoreState } from './slices/core/coreSlice'
import invitacion, { InvitacionState } from './slices/invitacion/invitacionSlice'
// import empresa, { EmpresaState } from './slices/empresa/empresaSlice'
import calendario, { CalendarioState } from './slices/calendario/calendarioSlice'
import item, { ItemState } from './slices/item/itemSlice'
// import bodega, { BodegaState } from './slices/bodega/bodegaSlice'
import cliente, { ClienteState } from './slices/clientes/clienteSlice'
import foro, { ForoState } from './slices/foros/foroSlice'

export type RootState = CombinedState<{
    auth: AuthState
    core: CoreState
    invitacion: InvitacionState
    // empresa: EmpresaState
    // calendario: CalendarioState
    item: ItemState
    // bodega: BodegaState
    cliente: ClienteState
    foro: ForoState
    /* eslint-disable @typescript-eslint/no-explicit-any */
    [RtkQueryService.reducerPath]: any
}>

export interface AsyncReducers {
    [key: string]: Reducer<any, AnyAction>
}

const staticReducers = {
    auth,
    core,

    cliente,
    foro,
    [RtkQueryService.reducerPath]: RtkQueryService.reducer,
}

const rootReducer =
    (asyncReducers?: AsyncReducers) =>
    (state: RootState | undefined, action: AnyAction) => {
        // Quitar Estado si es LOGOUT
        if (action.type === LOGOUT.type) {
            state = undefined;
        }
        const combinedReducer = combineReducers({
            ...staticReducers,
            ...asyncReducers,
        })
        return combinedReducer(state, action)
    }

export default rootReducer
