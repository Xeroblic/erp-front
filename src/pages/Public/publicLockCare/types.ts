import { TicketFormValues } from '@/pages/Public/formLockCleare/components/FormLockCare.types';

/**
 * Mapea los valores del formulario MVP (TicketFormValues) al payload
 * que espera el endpoint POST /lockers/check-in.
 */
export const mapFormToCheckInPayload = (values: TicketFormValues, qrToken: string) => {
	// Determinar marca, modelo y serial según tipo de servicio
	const isRepair = values.serviceType === 'reparacion';
	const brand = isRepair ? values.repairBrand : values.upgradeBrand;
	const model = isRepair ? values.repairModel : values.upgradeModel;
	const serial = isRepair ? values.repairSerialNumber : values.upgradeSerialNumber;

	return {
		qr_token: qrToken,
		customer_name: values.name,
		customer_email: values.email,
		customer_phone: values.phone,
		device_description: values.message,
		is_invoice: values.requiresInvoice === 'si',
		invoice_rut: values.requiresInvoice === 'si' ? values.invoiceRut : undefined,
		invoice_company_name:
			values.requiresInvoice === 'si' ? values.invoiceBusinessName : undefined,
		invoice_company_address:
			values.requiresInvoice === 'si' ? values.invoiceAddress : undefined,
		serial_number: serial || undefined,
		service_type: values.serviceType || undefined,
		upgrade_type: values.upgradeType || undefined,
		device_brand: brand,
		device_model: model,
	};
};
