import { TIcons } from '@/types/icons.type';

export type NotificationStatus = 'sent' | 'read' | 'pending';
export type NotificationChannel = 'system' | 'email';
export type NotificationType =
	| 'stock_critical'
	| 'sale_issued'
	| 'cash_close'
	| 'technical_review_done';

export interface INotificationMock {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	channel: NotificationChannel;
	status: NotificationStatus;
	createdAt: string; // ISO date
	icon: TIcons;
	color: 'emerald' | 'amber' | 'violet' | 'rose' | 'zinc';
}

const notificationsDb: INotificationMock[] = [
	{
		id: 'n1',
		title: 'Stock crítico',
		message: 'SKU-001 cayó por debajo del umbral en Sucursal Centro.',
		type: 'stock_critical',
		channel: 'system',
		status: 'sent',
		createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m
		icon: 'HeroCubeTransparent',
		color: 'rose',
	},
	{
		id: 'n2',
		title: 'Venta emitida',
		message: 'Factura F-2045 por $120 emitida por Caja 1.',
		type: 'sale_issued',
		channel: 'system',
		status: 'sent',
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h
		icon: 'HeroReceiptPercent',
		color: 'emerald',
	},
	{
		id: 'n3',
		title: 'Cierre de caja',
		message: 'Caja 2 cerrada con diferencia de $-3.50.',
		type: 'cash_close',
		channel: 'email',
		status: 'pending',
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h
		icon: 'HeroBanknotes',
		color: 'amber',
	},
	{
		id: 'n4',
		title: 'Revisión técnica finalizada',
		message: 'Equipo RT-554 listo para retiro.',
		type: 'technical_review_done',
		channel: 'system',
		status: 'read',
		createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d
		icon: 'HeroWrenchScrewdriver',
		color: 'violet',
	},
];

export default notificationsDb;
