import ApiService from '../ApiService';
import {
	ILockerLocation,
	ILockerInternal,
	IServiceOrder,
	ITechWithdrawRequest,
	ITechDropOffRequest,
	ITechResetRequest,
	ITechOrderActionResponse,
	ITechResetResponse,
} from '../../interface/lockers.interface';

// Las acciones del técnico devuelven el PIN nuevo en la raíz (`new_locker_pin`), junto a `data`:
// se leen con `fetchData` porque `fetchNormalized` desempaqueta `data` y lo perdería.
export const lockersInternalService = {
	getLocations: () =>
		ApiService.fetchNormalized<ILockerLocation[]>({
			url: '/lockers/locations',
			method: 'GET',
		}),

	getLockersByLocation: (locationId: number) =>
		ApiService.fetchNormalized<ILockerInternal[]>({
			url: `/lockers/locations/${locationId}/lockers`,
			method: 'GET',
		}),

	getPrivateInfo: (qrToken: string) =>
		ApiService.fetchNormalized<ILockerInternal>({
			url: `/lockers/${qrToken}/private-info`,
			method: 'GET',
		}),

	/** Paginado en el backend (20 por página): devuelve sólo la primera página. */
	getServiceOrders: () =>
		ApiService.fetchNormalized<IServiceOrder[]>({
			url: '/lockers/service-orders',
			method: 'GET',
		}),

	techWithdraw: (data: ITechWithdrawRequest) =>
		ApiService.fetchData<ITechOrderActionResponse, ITechWithdrawRequest>({
			url: '/lockers/tech/withdraw',
			method: 'POST',
			data,
		}).then((res) => res.data),

	techDropOff: (data: ITechDropOffRequest) =>
		ApiService.fetchData<ITechOrderActionResponse, ITechDropOffRequest>({
			url: '/lockers/tech/drop-off',
			method: 'POST',
			data,
		}).then((res) => res.data),

	resetLocker: (data: ITechResetRequest) =>
		ApiService.fetchData<ITechResetResponse, ITechResetRequest>({
			url: '/lockers/tech/reset',
			method: 'POST',
			data,
		}).then((res) => res.data),
};

export default lockersInternalService;
