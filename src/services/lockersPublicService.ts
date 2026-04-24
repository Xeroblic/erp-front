import ApiService from './ApiService';

export interface ILockerPublicInfo {
	is_available: boolean;
	message?: string;
	// Posibles campos extras que retorne el backend
}

export interface ICheckInRequest {
	qr_token: string;
	customer_name: string;
	customer_email: string;
	customer_phone?: string;
	device_description: string;
	is_invoice: boolean;
	invoice_rut?: string;
	invoice_company_name?: string;
	invoice_company_address?: string;
	serial_number?: string;
	service_type?: string;
	upgrade_type?: string | null;
	device_brand?: string;
	device_model?: string;
}

export interface ICheckInResponse {
	success: boolean;
	message?: string;
	locker_pin: string;
	data?: {
		locker?: {
			number: string;
		};
	};
}

export interface ICheckOutRequest {
	withdrawal_keyword: string;
}

export interface ICheckOutResponse {
	success: boolean;
	message?: string;
	locker_number?: string;
	current_pin?: string;
}

export const lockersPublicService = {
	getLockerInfo: (token: string) =>
		ApiService.fetchNormalized<ILockerPublicInfo>({
			url: `/lockers/${token}/info`,
			method: 'GET',
		}),

	checkInLocker: (data: ICheckInRequest) =>
		ApiService.fetchData<ICheckInResponse, ICheckInRequest>({
			url: `/lockers/check-in`,
			method: 'POST',
			data,
		}).then((res) => res.data),

	checkOutLocker: (data: ICheckOutRequest) =>
		ApiService.fetchNormalized<ICheckOutResponse>({
			url: `/lockers/check-out`,
			method: 'POST',
			data,
		}),
};
