export interface TicketFormValues {
	// Datos del cliente
	name: string;
	email: string;
	phone: string;
	termsAccepted: boolean;

	// Facturación
	requiresInvoice: string;
	invoiceRut: string;
	invoiceBusinessName: string;
	invoiceAddress: string;

	// Tipo de servicio
	serviceType: 'reparacion' | 'upgrade' | '';

	// Datos del servicio - Reparación
	repairBrand: string;
	repairModel: string;
	repairSerialNumber: string;
	repairIncludesCharger: string;

	// Datos del servicio - Upgrade
	upgradeType: string; // 'ram' | 'ssd' | 'ambas'
	upgradeBrand: string;
	upgradeModel: string;
	upgradeSerialNumber: string;

	// Descripción general
	notes: string;
	message: string;
	attachments: File[];
}

export interface FloatingOrnament {
	id: string;
	assetPath: string;
	left: number;
	top: number;
	rotateDeg: number;
	size: number;
	opacity: number;
	animationClassName: string;
	animationDelay: number;
}
