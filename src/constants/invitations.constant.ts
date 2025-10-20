export const INVITATIONS_API_BASE = '/user/invitations';
export const INVITATIONS_STATS_ENDPOINT = `${INVITATIONS_API_BASE}/stats`;

export const INVITATION_ENDPOINTS = {
	list: INVITATIONS_API_BASE,
	stats: INVITATIONS_STATS_ENDPOINT,
	details: (id: number | string) => `${INVITATIONS_API_BASE}/${id}`,
	resend: (id: number | string) => `${INVITATIONS_API_BASE}/${id}/resend`,
	cancel: (id: number | string) => `${INVITATIONS_API_BASE}/${id}`,
};
