import React from 'react';
import IngresoStockView from './IngresoStockView';
import { useIngresoStock } from './hooks/useIngresoStock';

const IngresoStockPage: React.FC = () => {
	const logic = useIngresoStock();
	return <IngresoStockView logic={logic} />;
};

export default IngresoStockPage;
