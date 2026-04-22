import React from 'react';
import { usePublicLockCareCheckout } from './hooks/usePublicLockCareCheckout';
import { PublicLockCareCheckoutView } from './PublicLockCareCheckoutView';

export default function PublicLockCareCheckout() {
	const props = usePublicLockCareCheckout();

	return <PublicLockCareCheckoutView {...props} />;
}
