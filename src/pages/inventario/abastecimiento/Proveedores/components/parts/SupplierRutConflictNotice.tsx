import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import type { IProcurementSupplierRutConflict } from '@/interface/procurement.interface';

/**
 * Banner del 409 `SUPPLIER_RUT_ALREADY_EXISTS`. Muestra el proveedor en
 * conflicto y, sólo si está eliminado, ofrece restaurar — como decisión
 * explícita del usuario, nunca como efecto lateral de guardar el formulario
 * (sección 5 del contrato).
 */

interface ISupplierRutConflictNoticeProps {
	conflict: IProcurementSupplierRutConflict;
	isRestoring: boolean;
	onRestore: () => void;
	onViewSupplier: (id: number) => void;
}

const SupplierRutConflictNotice: React.FC<ISupplierRutConflictNoticeProps> = ({
	conflict,
	isRestoring,
	onRestore,
	onViewSupplier,
}) => (
	<Alert
		color='amber'
		variant='outline'
		icon='HeroExclamationTriangle'
		title='Ese RUT ya está registrado'>
		<div className='space-y-3'>
			<p>
				<strong>{conflict.display_name}</strong> ya usa este RUT
				{conflict.is_active ? '.' : ', pero está desactivado.'}
			</p>
			<div className='flex flex-wrap gap-2'>
				<Button
					size='sm'
					variant='outline'
					icon='HeroEye'
					onClick={() => onViewSupplier(conflict.id)}>
					Ver proveedor
				</Button>
				{!conflict.is_active && (
					<Button
						size='sm'
						variant='solid'
						color='blue'
						icon='HeroArrowPathRoundedSquare'
						isLoading={isRestoring}
						isDisable={isRestoring}
						onClick={onRestore}>
						Restaurar este proveedor
					</Button>
				)}
			</div>
		</div>
	</Alert>
);

export default SupplierRutConflictNotice;
