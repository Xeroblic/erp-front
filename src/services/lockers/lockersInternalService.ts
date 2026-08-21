import ApiService from '../ApiService';
import {
	ILockerLocation,
	ILockerInternal,
	IServiceOrder,
	ILockerActionResponse,
	ITechWithdrawRequest,
	ITechDropOffRequest,
	ITechResetRequest,
	ISetReadyForPickupRequest,
} from '../../interface/lockers.interface';

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

	getServiceOrders: () =>
		ApiService.fetchNormalized<IServiceOrder[]>({
			url: '/lockers/service-orders',
			method: 'GET',
		}),

	techWithdraw: (data: ITechWithdrawRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/withdraw',
			method: 'POST',
			data,
		}),

	techDropOff: (data: ITechDropOffRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/drop-off',
			method: 'POST',
			data,
		}),

	setReadyForPickup: (data: ISetReadyForPickupRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/set-ready-for-pickup',
			method: 'PATCH',
			data,
		}),

	resetLocker: (data: ITechResetRequest) =>
		ApiService.fetchNormalized<ILockerActionResponse>({
			url: '/lockers/tech/reset',
			method: 'POST',
			data,
		}),
};

export default lockersInternalService;
