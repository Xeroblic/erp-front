import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SystemParameter } from '@/interface';

interface SystemParameterDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	parameter: SystemParameter | null;
}

const SystemParameterDetailsModal: React.FC<SystemParameterDetailsModalProps> = ({
	isOpen,
	onClose,
	parameter,
}) => {
	if (!parameter) return null;

	const formatValue = (param: SystemParameter) => {
		const { value, data_type } = param;

		switch (data_type) {
			case 'boolean':
				return value === 'true' ? 'Verdadero' : 'Falso';
			case 'json':
				try {
					return JSON.stringify(JSON.parse(value), null, 2);
				} catch {
					return value;
				}
			case 'date':
				try {
					return new Date(value).toLocaleString('es-CL');
				} catch {
					return value;
				}
			default:
				return value;
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			general: 'blue',
			system: 'red',
			email: 'green',
			security: 'yellow',
			integration: 'purple',
			ui: 'pink',
			business: 'indigo',
		} as const;
		return colors[category as keyof typeof colors] || 'gray';
	};

	const getDataTypeColor = (dataType: string) => {
		const colors = {
			string: 'green',
			number: 'blue',
			boolean: 'purple',
			json: 'orange',
			date: 'pink',
		} as const;
		return colors[dataType as keyof typeof colors] || 'gray';
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='lg'>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30'>
						<span className='font-mono text-sm text-blue-600 dark:text-blue-400'>
							{parameter.data_type.charAt(0).toUpperCase()}
						</span>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
							Detalles del Parámetro
						</h3>
						<p className='text-sm text-zinc-500 dark:text-zinc-400'>{parameter.key}</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody className='space-y-6'>
				{/* Información básica */}
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
					<div className='space-y-4'>
						<div>
							<label className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
								Clave
							</label>
							<div className='rounded-lg bg-zinc-100 p-2 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'>
								{parameter.key}
							</div>
						</div>

						<div>
							<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
								Categoría
							</label>
							<Badge
								className='capitalize'>
								{parameter.category}
							</Badge>
						</div>

						<div>
							<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
								Tipo de Dato
							</label>
							<Badge
								variant='outline'
								className='font-mono capitalize'>
								{parameter.data_type}
							</Badge>
						</div>
					</div>

					<div className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									Editable
								</label>
								<Badge >
									{parameter.is_editable ? 'Sí' : 'No'}
								</Badge>
							</div>
							<div>
								<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									Visible
								</label>
								<Badge >
									{parameter.is_visible ? 'Sí' : 'No'}
								</Badge>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
								Última Actualización
							</label>
							<div className='text-sm text-zinc-600 dark:text-zinc-400'>
								{new Date(parameter.updated_at).toLocaleString('es-CL')}
								{parameter.updated_by && (
									<div className='mt-1 text-xs text-zinc-500 dark:text-zinc-500'>
										Por: {parameter.updated_by}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Descripción */}
				<div>
					<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Descripción
					</label>
					<div className='rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
						{parameter.description}
					</div>
				</div>

				{/* Valor actual */}
				<div>
					<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Valor Actual
					</label>
					<div className='rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800'>
						<pre className='whitespace-pre-wrap font-mono text-sm text-zinc-900 dark:text-zinc-100'>
							{formatValue(parameter)}
						</pre>
					</div>
				</div>

				{/* Valor por defecto */}
				{parameter.default_value && (
					<div>
						<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Valor por Defecto
						</label>
						<div className='rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50'>
							<pre className='whitespace-pre-wrap font-mono text-sm text-zinc-600 dark:text-zinc-400'>
								{parameter.default_value}
							</pre>
						</div>
					</div>
				)}

				{/* Reglas de validación */}
				{parameter.validation_rules && (
					<div>
						<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Reglas de Validación
						</label>
						<div className='rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20'>
							<code className='text-sm text-amber-800 dark:text-amber-200'>
								{parameter.validation_rules}
							</code>
						</div>
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<Button variant='outline' onClick={onClose}>
					Cerrar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default SystemParameterDetailsModal;
