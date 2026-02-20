/**
 * ValidationSummary - Resumen de validaciones y campos faltantes
 */
import React from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';

interface ValidationError {
	field: string;
	message: string;
}

interface ValidationSummaryProps {
	errors: ValidationError[];
	requiredFields?: string[];
	currentValues?: Record<string, any>;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
	errors,
	requiredFields = [],
	currentValues = {},
}) => {
	// Calcular campos requeridos faltantes
	const missingFields = requiredFields.filter((field) => {
		const value = currentValues[field];
		return !value || (typeof value === 'string' && !value.trim());
	});

	const hasIssues = errors.length > 0 || missingFields.length > 0;

	if (!hasIssues) {
		return (
			<Card>
				<CardBody className='p-4'>
					<div className='flex items-center gap-2 text-green-600'>
						<Icon icon='HeroCheckCircle' className='h-5 w-5' />
						<span className='text-sm font-medium'>
							Todos los campos obligatorios completados
						</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='HeroExclamationTriangle' className='h-5 w-5 text-yellow-600' />
					<h3 className='text-base font-semibold'>Validación de Campos</h3>
				</div>
			</CardHeader>
			<CardBody className='space-y-4'>
				{/* Campos faltantes */}
				{missingFields.length > 0 && (
					<div>
						<h4 className='mb-2 text-sm font-medium text-red-600 dark:text-red-400'>
							Campos Obligatorios Faltantes ({missingFields.length})
						</h4>
						<ul className='space-y-1'>
							{missingFields.map((field) => (
								<li
									key={field}
									className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
									<Icon icon='HeroXCircle' className='h-4 w-4 text-red-500' />
									<span className='font-mono'>{field}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Errores de validación */}
				{errors.length > 0 && (
					<div>
						<h4 className='mb-2 text-sm font-medium text-red-600 dark:text-red-400'>
							Errores de Validación ({errors.length})
						</h4>
						<ul className='space-y-1'>
							{errors.map((error, idx) => (
								<li
									key={idx}
									className='flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300'>
									<Icon
										icon='HeroExclamationCircle'
										className='mt-0.5 h-4 w-4 text-red-500'
									/>
									<div>
										<span className='font-mono font-semibold'>
											{error.field}:
										</span>{' '}
										{error.message}
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default ValidationSummary;
