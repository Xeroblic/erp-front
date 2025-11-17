/**
 * Rutas de Modo A - Revisiones por Lotes
 */
import { lazy } from 'react';
import { Route } from 'react-router-dom';

const BatchListPage = lazy(() => import('./pages/BatchListPage'));
const BatchDetailPage = lazy(() => import('./pages/BatchDetailPage'));
const BatchItemReviewPage = lazy(() => import('./pages/BatchItemReviewPage'));
const BatchCreatePage = lazy(() => import('./pages/BatchCreatePage'));

/**
 * Rutas del Modo A (Lotes)
 * Base path: /technical-reviews/batches
 */
export const ModoARoutes = () => {
	return (
		<>
			<Route path='batches' element={<BatchListPage />} />
			<Route path='batches/create' element={<BatchCreatePage />} />
			<Route path='batches/:batchId' element={<BatchDetailPage />} />
			<Route path='batches/:batchId/:itemId' element={<BatchItemReviewPage />} />
		</>
	);
};

export default ModoARoutes;
