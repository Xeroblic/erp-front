// Página principal de integración WooCommerce
import React from 'react';

import WooCommerceConfigForm from './components/WooCommerceConfigForm';
import WooCommerceStatusCard from './components/WooCommerceStatusCard';
import WooCommerceLogPanel from './components/WooCommerceLogPanel';
import WooCommerceIntegrationsTable from './components/WooCommerceIntegrationsTable';

const WooCommerceIntegrationPage: React.FC = () => (
	<div className='space-y-6'>
		<WooCommerceStatusCard />
		<WooCommerceConfigForm />
		<WooCommerceIntegrationsTable />
		<WooCommerceLogPanel />
	</div>
);

export default WooCommerceIntegrationPage;
