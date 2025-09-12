// Página para importar pedidos
import React from 'react';
import WooCommerceOrdersImportPanel from './components/WooCommerceOrdersImportPanel';
import WooCommerceLogPanel from './components/WooCommerceLogPanel';

const WooCommerceOrdersImportPage: React.FC = () => (
	<div className='space-y-6'>
		<WooCommerceOrdersImportPanel />
		<WooCommerceLogPanel />
	</div>
);

export default WooCommerceOrdersImportPage;
