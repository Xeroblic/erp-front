import React from 'react';
import { useDetalleLote } from '@/pages/refactor-technical-review/pages/batches/components/hooks/detallehook';
import DetalleLoteVisual from '@/pages/refactor-technical-review/pages/batches/components/content/detalleLote';
import Spinner from '@/components/ui/Spinner';

const DetalleLote: React.FC = () => {
	const hookProps = useDetalleLote();

	return (

		<>
			{hookProps.loading ? (
				<Spinner nombre="Cargando lote..." />
			) : hookProps.updatingBatch ? (
				<div className="flex flex-col items-center justify-center p-10">
					<p className="text-red-500 font-bold text-lg">Error al cargar el lote</p>
					<p className="text-gray-600">Por favor, intente nuevamente más tarde.</p>
				</div>
			) : hookProps.batch ? (
				<DetalleLoteVisual {...hookProps} />
			) : (
				<div className="flex justify-center items-center p-10 text-gray-500">
					No se encontró información para este lote.
				</div>
			)}
            
		</>

	);
};

export default DetalleLote;
