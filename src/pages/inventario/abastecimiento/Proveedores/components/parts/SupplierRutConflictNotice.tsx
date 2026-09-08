import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import type { IProcurementSupplierRutConflict } from '@/interface/procurement.interface';

/**
 * Banner del 409 `SUPPLIER_RUT_ALREADY_EXISTS`. Muestra el proveedor en
 * conflicto y, sólo si está eliminado, ofrece restaurar — como decisión
 * explícita del usuario, nunca como efecto lateral de guardar el formulario
 * (sección 5 del contrato).
 *
 * `allowed_actions` no llega acá — el conflicto no trae la ficha completa
 * del proveedor en conflicto, sólo `{id, display_name, is_active}` — así que
 * el botón de restaurar pasa igual por `ProtectedButton` con el permiso de
 * la sección 15: `allowed_actions` no sustituye la autorización, y acá
 * directamente no está disponible para consultarla.
 */

interface ISupplierRutConflictNoticeProps {
	conflict: IProcurementSupplierRutConflict;
	isRestoring: boolean;
	onRestore: () => void;
	onViewSupplier: (id: number) => void;
	branchId?: number | null;
	subsidiaryId?: number | null;
}

const SupplierRutConflictNotice: React.FC<ISupplierRutConflictNoticeProps> = ({
	conflict,
	isRestoring,
	onRestore,
	onViewSupplier,
	branchId = null,
	subsidiaryId = null,
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
					<ProtectedButton
						permission='restore-procurement-supplier'
						branchId={branchId}
						subsidiaryId={subsidiaryId}
						scope='access'
						fallbackMode='disabled'
						disabledTooltip='No tienes autorización para restaurar proveedores'
						size='sm'
						variant='solid'
						color='blue'
						icon='HeroArrowPathRoundedSquare'
						isLoading={isRestoring}
						isDisable={isRestoring}
						onClick={onRestore}>
						Restaurar este proveedor
					</ProtectedButton>
				)}
			</div>
		</div>
	</Alert>
);

export default SupplierRutConflictNotice;
