import React from 'react';
import Select from '@/components/form/Select';
import { useUserBranches } from '../hooks/userBranch';

interface UserBranchSelectorProps {
	userId: number;
	value?: number | string | null;
	onChange: (branchId: number | null) => void;
	name?: string;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	className?: string;
	showError?: boolean;
}

/**
 * Componente selector de branches basado en el acceso del usuario
 * 
 * Solo muestra las branches a las que el usuario tiene acceso
 * 
 * @param userId - ID del usuario para obtener sus branches
 * @param value - Valor seleccionado (branch_id)
 * @param onChange - Callback cuando cambia la selección, recibe el branch_id o null
 * @param name - Nombre del campo (para formularios)
 * @param label - Etiqueta del campo
 * @param placeholder - Texto placeholder
 * @param disabled - Si el select está deshabilitado
 * @param required - Si el campo es requerido
 * @param className - Clases CSS adicionales
 * @param showError - Si debe mostrar el error
 * 
 * @example
 * ```tsx
 * <UserBranchSelector
 *   userId={currentUser.id}
 *   value={selectedBranchId}
 *   onChange={(branchId) => setSelectedBranchId(branchId)}
 *   label="Seleccionar Sucursal"
 *   required
 * />
 * ```
 */
const UserBranchSelector: React.FC<UserBranchSelectorProps> = ({
	userId,
	value,
	onChange,
	name = 'branch_id',
	label = 'Sucursal',
	placeholder = 'Selecciona una sucursal',
	disabled = false,
	required = false,
	className,
	showError = true,
}) => {
	const { branches, loading, error } = useUserBranches(userId);

	const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedValue = e.target.value;
		if (selectedValue === '' || selectedValue === 'null') {
			onChange(null);
		} else {
			onChange(Number(selectedValue));
		}
	};

	// Si hay error y debe mostrarlo
	if (error && showError) {
		return (
			<div className={className}>
				{label && (
					<label className='mb-2 block text-sm font-medium text-gray-900 dark:text-white'>
						{label}
						{required && <span className='ml-1 text-red-500'>*</span>}
					</label>
				)}
				<div className='rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
					<p className='font-medium'>Error al cargar sucursales</p>
					<p className='mt-1 text-xs'>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			{label && (
				<label
					htmlFor={name}
					className='mb-2 block text-sm font-medium text-gray-900 dark:text-white'>
					{label}
					{required && <span className='ml-1 text-red-500'>*</span>}
				</label>
			)}
			<Select
				id={name}
				name={name}
				value={value ?? ''}
				onChange={handleChange}
				disabled={disabled || loading}
				required={required}>
				<option value=''>{loading ? 'Cargando...' : placeholder}</option>
				{branches.map((branch) => (
					<option key={branch.id} value={branch.id}>
						{branch.name}
					</option>
				))}
			</Select>
			{loading && (
				<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
					Cargando sucursales disponibles...
				</p>
			)}
			{!loading && branches.length === 0 && (
				<p className='mt-1 text-xs text-yellow-600 dark:text-yellow-400'>
					Este usuario no tiene acceso a ninguna sucursal
				</p>
			)}
		</div>
	);
};

export default UserBranchSelector;
