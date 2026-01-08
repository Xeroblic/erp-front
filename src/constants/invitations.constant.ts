import { TColors } from '@/types/colors.type';

export const INVITATIONS_API_BASE = '/user/invitations';
export const INVITATIONS_STATS_ENDPOINT = `${INVITATIONS_API_BASE}/stats`;

export const INVITATION_ENDPOINTS = {
	list: INVITATIONS_API_BASE,
	stats: INVITATIONS_STATS_ENDPOINT,
	details: (id: number | string) => `${INVITATIONS_API_BASE}/${id}`,
	resend: (id: number | string) => `${INVITATIONS_API_BASE}/${id}/resend`,
	cancel: (id: number | string) => `${INVITATIONS_API_BASE}/${id}`,
};

// Mapeo de estados: internamente en inglés (backend), visualmente en español (frontend)
export const INVITATION_STATUS_MAP: Record<
	string,
	{ label: string; color: TColors; icon: string; variant?: any }
> = {
	pending: { label: 'Pendiente', color: 'amber', icon: 'HeroClock', variant: 'solid' },
	sent: { label: 'Enviada', color: 'blue', icon: 'HeroPaperAirplane', variant: 'solid' },
	accepted: { label: 'Aceptada', color: 'emerald', icon: 'HeroCheckCircle', variant: 'solid' },
	expired: { label: 'Expirada', color: 'red', icon: 'HeroXCircle', variant: 'solid' },
	cancelled: { label: 'Cancelada', color: 'zinc', icon: 'HeroXMark', variant: 'outline' },
	used: { label: 'Usada', color: 'emerald', icon: 'HeroCheckBadge', variant: 'solid' },
};

// Labels para filtros y estadísticas
export const INVITATION_STATUS_LABELS: Record<string, string> = {
	pending: 'Pendientes',
	sent: 'Enviadas',
	accepted: 'Aceptadas',
	expired: 'Expiradas',
	cancelled: 'Canceladas',
	used: 'Usadas',
};

// Orden de prioridad para mostrar estados
export const INVITATION_STATUS_ORDER: string[] = [
	'pending',
	'sent',
	'accepted',
	'used',
	'expired',
	'cancelled',
];

// Función helper para normalizar estados del backend
export const normalizeInvitationStatus = (status: string): string => {
	return status.toLowerCase();
};
