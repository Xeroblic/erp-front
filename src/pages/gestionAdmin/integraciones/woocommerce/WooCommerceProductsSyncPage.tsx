// Página para sincronizar productos/stock
import React from 'react';
import WooCommerceSyncPanel from './components/WooCommerceSyncPanel';
import WooCommerceLogPanel from './components/WooCommerceLogPanel';

const WooCommerceProductsSyncPage: React.FC = () => (
	<div className='space-y-6'>
		<WooCommerceSyncPanel />
		<WooCommerceLogPanel />
	</div>
);

export default WooCommerceProductsSyncPage;
