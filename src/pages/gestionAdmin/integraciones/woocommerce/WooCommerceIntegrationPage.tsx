// Página principal de integración WooCommerce
import React from 'react';

import WooCommerceConfigForm from './components/WooCommerceConfigForm';
import WooCommerceStatusCard from './components/WooCommerceStatusCard';
import WooCommerceLogPanel from './components/WooCommerceLogPanel';
import WooCommerceIntegrationsTable from './components/WooCommerceIntegrationsTable';
import WooStockSync from '@/pages/integraciones/WooComerceSync/WooStockSync';

const WooCommerceIntegrationPage: React.FC = () => (
	<div className='space-y-6'>
		<WooCommerceStatusCard />
		<WooCommerceConfigForm />
		<WooCommerceIntegrationsTable />
		<WooCommerceLogPanel />
		<WooStockSync />
	</div>
);

export default WooCommerceIntegrationPage;
