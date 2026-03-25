/**
 * Formulario de datos del movimiento
 * Responsabilidad única: capturar datos del movimiento (Single Responsibility)
 */
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import type { IMovementType } from '../types';

interface MovementFormProps {
	/**
	 * Tipo de movimiento: 'ingreso' o 'egreso'
	 */
	movementType: IMovementType;
	onMovementTypeChange: (type: IMovementType) => void;

	/**
	 * ID de sucursal seleccionada
	 */
	branchId: string;
	onBranchIdChange: (branchId: string) => void;
	branchOptions: TSelectOption[];
	isBranchesLoading?: boolean;

	/**
	 * ID de subsidiaria detectada desde workspace
	 */
	selectedSubsidiaryId: number;

	/**
	 * Razón del ajuste
	 */
	reason: string;
	onReasonChange: (reason: string) => void;

	/**
	 * Notas opcionales
	 */
	notes: string;
	onNotesChange: (notes: string) => void;

	/**
	 * Indica si hay items en workspace
	 */
	hasItems: boolean;

	/**
	 * Indica si el form está enviando
	 */
	isSubmitting: boolean;

	/**
	 * Callback cuando se hace click en "Limpiar"
	 */
	onClear: () => void;

	/**
	 * Callback cuando se hace click en "Procesar ajuste"
	 */
	onSubmit: () => void;
}

/**
 * Componente puro: solo renderiza, el estado está en el contenedor (IngresoStock)
 */
export const MovementForm = ({
	movementType,
	onMovementTypeChange,
	branchId,
	onBranchIdChange,
	branchOptions,
	isBranchesLoading = false,
	selectedSubsidiaryId,
	reason,
	onReasonChange,
	notes,
	onNotesChange,
	hasItems,
	isSubmitting,
	onClear,
	onSubmit,
}: MovementFormProps) => {
	return (
		<div className='space-y-4'>
			{/* Tipo de movimiento + Subsidiaria */}
			<div className='flex flex-wrap items-center gap-3'>
				<Button
					color={movementType === 'ingreso' ? 'emerald' : 'zinc'}
					variant={movementType === 'ingreso' ? 'solid' : 'outline'}
					onClick={() => onMovementTypeChange('ingreso')}>
					Ingreso (+)
				</Button>
				<Button
					color={movementType === 'egreso' ? 'red' : 'zinc'}
					variant={movementType === 'egreso' ? 'solid' : 'outline'}
					onClick={() => onMovementTypeChange('egreso')}>
					Egreso (-)
				</Button>
				<Badge variant='outline' className='ml-auto'>
					Subsidiaria: {selectedSubsidiaryId || '-'}
				</Badge>
			</div>

			{/* Sucursal visible */}
			<SelectReact
				name='branch_id'
				placeholder='Selecciona una sucursal'
				isLoading={isBranchesLoading}
				isDisabled={isSubmitting || isBranchesLoading || !branchOptions.length}
				isMulti={false}
				isClearable={false}
				options={branchOptions}
				value={branchOptions.find((opt) => opt.value === branchId) ?? null}
				onChange={(option) => {
					if (Array.isArray(option)) {
						onBranchIdChange('');
						return;
					}
					if (option && 'value' in option) {
						onBranchIdChange(option.value);
						return;
					}
					onBranchIdChange('');
				}}
			/>

			{/* Razón */}
			<Input
				name='reason'
				placeholder='Razón del ajuste (ej: Ingreso por Factura #8821)'
				value={reason}
				onChange={(e) => onReasonChange(e.target.value)}
				disabled={isSubmitting}
			/>

			{/* Notas */}
			<Textarea
				name='notes'
				placeholder='Notas (opcional)'
				value={notes}
				onChange={(e) => onNotesChange(e.target.value)}
				rows={4}
				disabled={isSubmitting}
			/>

			{/* Botones de acción */}
			<div className='flex flex-wrap justify-end gap-2'>
				<Button
					color='zinc'
					variant='outline'
					isDisable={!hasItems || isSubmitting}
					onClick={onClear}>
					Limpiar
				</Button>
				<Button color='amber' isDisable={!hasItems || isSubmitting} onClick={onSubmit}>
					{isSubmitting ? 'Enviando...' : 'Procesar ajuste'}
				</Button>
			</div>
		</div>
	);
};
