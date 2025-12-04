export const buildSubempresaPayload = (values: any, companyId: number, selectedManager: any) => {
	const managerFullName =
		`${selectedManager.first_name ?? ''} ${selectedManager.last_name ?? ''}`.trim();

	const payload: any = {
		subsidiary_name: values.nombre.trim(),
		company_id: companyId,
	};

	const managerId = Number(values.managerId ?? selectedManager.id ?? selectedManager.user_id);
	if (managerId && !Number.isNaN(managerId)) {
		payload.manager_id = managerId;
		payload.subsidiary_manager_id = managerId;
	}

	if (managerFullName) {
		payload.subsidiary_manager_name = managerFullName;
	}

	if (selectedManager.email) {
		payload.subsidiary_manager_email = selectedManager.email;
	}
	const managerPhone =
		selectedManager.celular || selectedManager.phone || selectedManager.phone_number;
	if (managerPhone) {
		payload.subsidiary_manager_phone = managerPhone;
	}
	if (values.rut?.trim()) {
		payload.subsidiary_rut = values.rut.trim();
	}
	if (values.telefono?.trim()) {
		payload.subsidiary_phone = values.telefono.trim();
	}
	if (values.email?.trim()) {
		payload.subsidiary_email = values.email.trim();
	}
	if (values.direccion?.trim()) {
		payload.subsidiary_address = values.direccion.trim();
	}
	if (values.comuna) {
		payload.commune_id = Number(values.comuna);
	}

	return payload;
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
