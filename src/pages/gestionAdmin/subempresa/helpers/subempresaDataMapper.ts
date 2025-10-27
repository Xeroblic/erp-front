export const buildSubempresaPayload = (values: any, companyId: number, selectedManager: any) => {
    const payload: any = {
        subsidiary_name: values.nombre.trim(),
        subsidiary_manager_name: `${selectedManager.first_name} ${selectedManager.last_name}`.trim(),
        company_id: companyId,
    };

    if (selectedManager.email) {
        payload.subsidiary_manager_email = selectedManager.email;
    }
    if (selectedManager.celular) {
        payload.subsidiary_manager_phone = selectedManager.celular;
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
