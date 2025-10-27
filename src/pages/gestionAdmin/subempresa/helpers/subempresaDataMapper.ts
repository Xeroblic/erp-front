export const buildSubempresaPayload = (values: any, companyId: number) => {
    return {
        subsidiary_name: values.nombre,
        subsidiary_rut: values.rut || undefined,
        subsidiary_phone: values.telefono || undefined,
        subsidiary_email: values.email || undefined,
        subsidiary_address: values.direccion || undefined,
        commune_id: values.comuna ? Number(values.comuna) : undefined,
        company_id: companyId,
    };
};
