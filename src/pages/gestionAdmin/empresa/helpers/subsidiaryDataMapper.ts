import { IUser } from '@/interface/users.interface';

export const COMPANY_ID = 1;

interface SubsidiaryFormValues {
	name: string;
	managerId: string | number;
	rut: string;
	address: string;
	phone: string;
	email: string;
	website: string;
	comuna: string;
}

export const buildSubsidiaryPayload = (values: SubsidiaryFormValues, selectedManager: any): any => {
	const subsidiaryData: any = {
		subsidiary_name: values.name.trim(),
		subsidiary_manager_name:
			`${selectedManager.first_name} ${selectedManager.last_name}`.trim(),
		company_id: COMPANY_ID,
	};

	if (selectedManager.email) {
		subsidiaryData.subsidiary_manager_email = selectedManager.email;
	}
	if (selectedManager.celular) {
		subsidiaryData.subsidiary_manager_phone = selectedManager.celular;
	}
	if (values.rut?.trim()) {
		subsidiaryData.subsidiary_rut = values.rut.trim();
	}
	if (values.address?.trim()) {
		subsidiaryData.subsidiary_address = values.address.trim();
	}
	if (values.phone?.trim()) {
		subsidiaryData.subsidiary_phone = values.phone.trim();
	}
	if (values.email?.trim()) {
		subsidiaryData.subsidiary_email = values.email.trim();
	}
	if (values.website?.trim()) {
		subsidiaryData.subsidiary_website = values.website.trim();
	}
	if (values.comuna) {
		subsidiaryData.commune_id = Number(values.comuna);
	}

	return subsidiaryData;
};

export const filterAdminUsers = (users: any[]): any[] => {
	return users.filter((user) => {
		if (user.is_super_admin) return true;

		const hasAdminRole = user.contextual_roles?.some(
			(role: any) => role.role.includes('admin') || role.role.includes('manager'),
		);

		const hasGlobalAdminRole = user.global_roles?.some(
			(role: any) => role.includes('admin') || role.includes('manager'),
		);

		return hasAdminRole || hasGlobalAdminRole;
	});
};
