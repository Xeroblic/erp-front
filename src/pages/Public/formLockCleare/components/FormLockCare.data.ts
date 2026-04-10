import { TSelectOption } from '@/components/form/SelectReact';

export const lockCareTheme = {
	color: 'emerald' as const,
	colorIntensity: '500' as const,
};

export const invoiceOptions: TSelectOption[] = [
    { value: 'no', label: 'No, no necesito factura' },
    { value: 'si', label: 'Si, necesito factura' },
];

export const serviceTypeOptions: TSelectOption[] = [
    { value: 'reparacion', label: 'Reparación' },
    { value: 'upgrade', label: 'Upgrade' },
];

export const chargerOptions: TSelectOption[] = [
    { value: 'si', label: 'Si, incluye cargador' },
    { value: 'no', label: 'No, no incluye cargador' },
];

export const upgradeTypeOptions: TSelectOption[] = [
    { value: 'ram', label: 'Upgrade de RAM' },
    { value: 'ssd', label: 'Upgrade de SSD' },
    { value: 'ambas', label: 'Upgrade de RAM y SSD' },
];

export const quickBadges = ['Guia para cliente', 'Rapido', 'Sin pasos tecnicos'] as const;

export const flowCards = [
    {
        icon: 'HeroQrCode',
        title: 'Escanea el QR del casillero',
        text: 'Abre este formulario desde el codigo QR del locker para comenzar.',
    },
    {
        icon: 'HeroTicket',
        title: 'Completa tus datos y el problema',
        text: 'Ingresa contacto, detalle del servicio y adjunta fotos si lo necesitas.',
    },
    {
        icon: 'HeroLockClosed',
        title: 'Envia y espera confirmacion',
        text: 'Al enviar, registramos tu solicitud y seguimos con el proceso de atencion.',
    },
] as const;

export const customerChecklist = [
    'Ten a mano el número de serie del equipo.',
    'Si necesitas factura, prepara RUT, giro y direccion.',
    'Escribe el problema con el mayor detalle posible.',
] as const;
