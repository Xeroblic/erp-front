import ApiService from '../ApiService';
import {
	ILockerPublicInfo,
	ICheckInRequest,
	ICheckInResponse,
	ICheckOutRequest,
	ICheckOutResponse,
} from '../../interface/lockers.interface';

export const lockersPublicService = {
	/**
	 * Obtener disponibilidad e información pública al escanear un casillero
	 */
	getLockerInfo: (token: string) =>
		ApiService.fetchNormalized<ILockerPublicInfo>({
			url: `/lockers/${token}/info`,
			method: 'GET',
		}),

	/**
	 * Cliente registra el ingreso de su equipo (Check-In)
	 */
	checkInLocker: (data: ICheckInRequest) =>
		ApiService.fetchData<ICheckInResponse, ICheckInRequest>({
			url: '/lockers/check-in',
			method: 'POST',
			data,
		}).then((res) => res.data),

	/**
	 * Cliente retira su equipo usando su palabra clave (Check-Out)
	 */
	checkOutLocker: (data: ICheckOutRequest) =>
		ApiService.fetchData<ICheckOutResponse, ICheckOutRequest>({
			url: '/lockers/check-out',
			method: 'POST',
			data,
		}).then((res) => res.data),
};

export default lockersPublicService;
