import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

/** Error de carga con reintento, como el de Inventario. */
export const ReportLoadError: React.FC<{ error: string; onRetry: () => void }> = ({
	error,
	onRetry,
}) => (
	<Alert
		color='red'
		variant='outline'
		icon='HeroExclamationTriangle'
		title='No pudimos cargar el reporte'>
		<div className='flex flex-wrap items-center justify-between gap-3'>
			<span>{error}</span>
			<Button size='sm' variant='outline' onClick={onRetry}>
				Reintentar
			</Button>
		</div>
	</Alert>
);

/**
 * Aviso obligatorio mientras una pestaña lee el mock del contrato (bandera
 * `VITE_INVENTORY_STOCK_USE_MOCKS`), igual que el de Inventario.
 */
export const SimulatedDataNotice: React.FC = () => (
	<Alert color='amber' title='Datos simulados'>
		Este reporte todavía no existe en el backend. Se calcula con los mismos datos de
		demostración que Inventario: las cantidades no representan el inventario real.
	</Alert>
);
