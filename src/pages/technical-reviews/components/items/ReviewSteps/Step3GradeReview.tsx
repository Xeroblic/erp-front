/**
 * Step3GradeReview - Paso 3: Gradación Automática y Aprobación
 * Muestra el grado sugerido por el sistema y permite aprobar o modificar
 */
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { useAppDispatch, useAppSelector } from '@/store';
import { approveItem } from '@/store/slices/technicalReviews';

interface Step3GradeReviewProps {
	branchId: number;
	itemId: number;
	suggestedGrade: string;
	confidence?: number;
	breakdown?: Record<string, any>;
	serialNumber: string;
	equipmentType: string;
	onBack: () => void;
	onComplete: () => void;
}

const Step3GradeReview: React.FC<Step3GradeReviewProps> = ({
	branchId,
	itemId,
	suggestedGrade,
	confidence,
	breakdown,
	serialNumber,
	equipmentType,
	onBack,
	onComplete,
}) => {
	const dispatch = useAppDispatch();
	const approving = useAppSelector((s) => s.technicalReviews.approving);

	const [showManualOverride, setShowManualOverride] = useState(false);
	const [manualGrade, setManualGrade] = useState<string | null>(null);
	const [overrideReason, setOverrideReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const gradeOptions: TSelectOption[] = [
		{ value: 'A', label: 'Grado A - Excelente' },
		{ value: 'B', label: 'Grado B - Muy Bueno' },
		{ value: 'C', label: 'Grado C - Bueno' },
		{ value: 'D', label: 'Grado D - Regular' },
	];

	// Colores según grado
	const getGradeColor = (grade: string) => {
		switch (grade) {
			case 'A':
				return 'bg-green-500 text-white';
			case 'B':
				return 'bg-blue-500 text-white';
			case 'C':
				return 'bg-yellow-500 text-white';
			case 'D':
				return 'bg-orange-500 text-white';
			default:
				return 'bg-gray-500 text-white';
		}
	};

	// Aceptar sugerencia automática
	const handleAcceptSuggestion = async () => {
		try {
			await dispatch(
				approveItem({
					branchId,
					itemId,
					data: {
						grade: suggestedGrade,
						override_suggestion: false,
					},
				}),
			).unwrap();

			onComplete();
		} catch (error: any) {
			setError(error || 'Error al aprobar la revisión');
		}
	};

	// Aprobar con grado manual
	const handleManualApprove = async () => {
		if (!manualGrade) {
			setError('Debes seleccionar un grado');
			return;
		}

		if (!overrideReason.trim()) {
			setError('Debes proporcionar una razón para modificar el grado sugerido');
			return;
		}

		try {
			await dispatch(
				approveItem({
					branchId,
					itemId,
					data: {
						grade: manualGrade,
						override_suggestion: true,
						override_reason: overrideReason,
					},
				}),
			).unwrap();

			onComplete();
		} catch (error: any) {
			setError(error || 'Error al aprobar con grado manual');
		}
	};

	return (
		<div className='space-y-6'>
			{/* Error */}
			{error && (
				<Card className='border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
					<CardBody className='p-4'>
						<div className='flex gap-3'>
							<Icon
								icon='HeroExclamationCircle'
								className='h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400'
							/>
							<div>
								<h4 className='font-semibold text-red-900 dark:text-red-100'>
									Error
								</h4>
								<p className='mt-1 text-sm text-red-800 dark:text-red-200'>
									{error}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Calificación Automática */}
			<Card className='border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-950 dark:to-green-900'>
				<CardBody className='p-8 text-center'>
					<Icon
						icon='HeroCheckBadge'
						className='mx-auto h-20 w-20 text-green-600 dark:text-green-400'
					/>
					<h2 className='mt-4 text-3xl font-bold text-green-900 dark:text-green-100'>
						Revisión Completada
					</h2>
					<p className='mt-2 text-green-700 dark:text-green-300'>
						El sistema ha calculado la calificación automática
					</p>

					<div className='mt-6'>
						<div
							className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full ${getGradeColor(
								suggestedGrade,
							)} shadow-lg`}>
							<span className='text-6xl font-bold'>{suggestedGrade}</span>
						</div>
						{confidence !== undefined && (
							<div className='mt-4'>
								<p className='text-sm text-green-700 dark:text-green-300'>
									Confianza: {confidence}%
								</p>
								<div className='mx-auto mt-2 h-2 w-48 overflow-hidden rounded-full bg-green-200 dark:bg-green-800'>
									<div
										className='h-full bg-green-600 dark:bg-green-400'
										style={{ width: `${confidence}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</CardBody>
			</Card>

			{/* Resumen */}
			<Card>
				<CardHeader>
					<h3 className='text-lg font-semibold'>Resumen de la Revisión</h3>
				</CardHeader>
				<CardBody>
					<dl className='space-y-3'>
						<div className='flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700'>
							<dt className='font-medium text-gray-700 dark:text-gray-300'>
								Número de Serie:
							</dt>
							<dd className='font-mono font-semibold'>{serialNumber}</dd>
						</div>
						<div className='flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700'>
							<dt className='font-medium text-gray-700 dark:text-gray-300'>
								Tipo de Equipo:
							</dt>
							<dd className='font-medium capitalize'>{equipmentType}</dd>
						</div>
						<div className='flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700'>
							<dt className='font-medium text-gray-700 dark:text-gray-300'>
								Grado Sugerido:
							</dt>
							<dd>
								<Badge
									variant='solid'
									className={`${getGradeColor(suggestedGrade)} px-3 py-1`}>
									{suggestedGrade}
								</Badge>
							</dd>
						</div>
					</dl>

					{/* Desglose (si existe) */}
					{breakdown && Object.keys(breakdown).length > 0 && (
						<div className='mt-6'>
							<h4 className='mb-3 font-semibold text-gray-900 dark:text-gray-100'>
								Desglose de Puntuación
							</h4>
							<div className='space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
								{Object.entries(breakdown).map(([key, value]) => (
									<div key={key} className='flex justify-between text-sm'>
										<span className='capitalize text-gray-700 dark:text-gray-300'>
											{key.replace(/_/g, ' ')}:
										</span>
										<span className='font-medium text-gray-900 dark:text-gray-100'>
											{typeof value === 'number'
												? value.toFixed(1)
												: String(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Modificación Manual */}
			{!showManualOverride ? (
				<Card className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'>
					<CardBody className='p-4'>
						<div className='flex items-start justify-between'>
							<div className='flex gap-3'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400'
								/>
								<div>
									<h4 className='font-semibold text-blue-900 dark:text-blue-100'>
										¿No estás de acuerdo con la calificación?
									</h4>
									<p className='mt-1 text-sm text-blue-800 dark:text-blue-200'>
										Puedes modificar el grado manualmente proporcionando una
										justificación.
									</p>
								</div>
							</div>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowManualOverride(true)}>
								Modificar
							</Button>
						</div>
					</CardBody>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-semibold'>Modificar Grado Manualmente</h3>
							<Button
								variant='outline'
								size='sm'
								onClick={() => {
									setShowManualOverride(false);
									setManualGrade(null);
									setOverrideReason('');
									setError(null);
								}}>
								Cancelar
							</Button>
						</div>
					</CardHeader>
					<CardBody className='space-y-4'>
						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Nuevo Grado <span className='text-red-500'>*</span>
							</label>
							<SelectReact
								name='manual_grade'
								options={gradeOptions}
								value={
									manualGrade
										? gradeOptions.find((o) => o.value === manualGrade) || null
										: null
								}
								onChange={(option) => {
									const selected = option as TSelectOption | null;
									setManualGrade(selected?.value || null);
									setError(null);
								}}
								placeholder='Seleccionar grado'
							/>
						</div>

						<div>
							<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Razón del Cambio <span className='text-red-500'>*</span>
							</label>
							<Textarea
								name='override_reason'
								value={overrideReason}
								onChange={(e) => {
									setOverrideReason(e.target.value);
									setError(null);
								}}
								rows={3}
								placeholder='Explica por qué el grado sugerido no es correcto...'
							/>
							<p className='mt-1 text-xs text-gray-500'>
								Esta información quedará registrada en el historial
							</p>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Botones de acción */}
			<div className='flex justify-between gap-3'>
				<Button variant='outline' onClick={onBack} isDisable={approving}>
					<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
					Modificar Revisión
				</Button>

				<div className='flex gap-3'>
					{showManualOverride ? (
						<Button
							color='blue'
							onClick={handleManualApprove}
							isDisable={approving || !manualGrade || !overrideReason.trim()}>
							<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
							{approving ? 'Aprobando...' : 'Aprobar con Grado Manual'}
						</Button>
					) : (
						<Button color='blue' onClick={handleAcceptSuggestion} isDisable={approving}>
							<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
							{approving ? 'Aprobando...' : 'Aceptar y Aprobar'}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Step3GradeReview;
