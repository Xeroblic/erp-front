/**
 * Módulo IngresoStock (Assembler)
 * @Dev_Implementador
 * Este archivo NO debe llevar lógica. Solo une el Hook y la Vista.
 */
import React from 'react';
import IngresoStockView from './IngresoStockView';
import { useIngresoStock } from './hooks/useIngresoStock';

const IngresoStockPage: React.FC = () => {
	// Toda la lógica y estados residen aquí
	const logic = useIngresoStock();

	// Pasamos la lógica pre-masticada a la vista estática
	return <IngresoStockView logic={logic} />;
};

export default IngresoStockPage;
