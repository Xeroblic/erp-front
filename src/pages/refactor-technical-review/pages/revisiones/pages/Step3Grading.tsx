import React, { useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';

interface Step3GradingProps {
	suggestedGrade: string | null;
	confidence: number;
	breakdown: Record<string, any>;
	serialNumber: string;
	equipmentType: string;
	reviewStatus: string;
	isApproved: boolean;
	approving: boolean;
	onBack: () => void;
	onComplete: () => void;
	onApprove: (
		grade: string,
		overrideSuggestion?: boolean,
		overrideReason?: string,
	) => Promise<void>;
	onRecalculate: () => Promise<void>;
	onModifyReview: () => Promise<void>;
}

const GRADE_CONFIG: Record<
	string,
	{ label: string; color: string; bg: string; description: string; badgeColor: string }
> = {
	A: {
		label: 'Grado A',
		color: 'text-emerald-600 dark:text-emerald-400',
		bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
		description: 'Excelente condición. Como nuevo.',
		badgeColor: 'bg-emerald-500 text-white',
	},
	B: {
		label: 'Grado B',
		color: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
		description: 'Buena condición. Desgaste mínimo.',
		badgeColor: 'bg-blue-500 text-white',
	},
	C: {
		label: 'Grado C',
		color: 'text-amber-600 dark:text-amber-400',
		bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
		description: 'Condición aceptable. Desgaste visible.',
		badgeColor: 'bg-amber-500 text-white',
	},
	M: {
		label: 'Grado M',
		color: 'text-red-600 dark:text-red-400',
		bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
		description: 'Condición deficiente. Requiere reparación.',
		badgeColor: 'bg-red-500 text-white',
	},
};

const GRADE_OPTIONS: TSelectOption[] = [
	{ value: 'A', label: 'Grado A — Excelente' },
	{ value: 'B', label: 'Grado B — Muy Bueno' },
	{ value: 'C', label: 'Grado C — Bueno' },
	{ value: 'M', label: 'Grado M — Malo' },
];

const formatBreakdownValue = (value: any): string => {
	if (typeof value === 'number') {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}
	if (typeof value === 'boolean') return value ? 'Sí' : 'No';
	if (typeof value === 'object' && value !== null) {
		return (value as any).label ?? (value as any).value ?? JSON.stringify(value);
	}
	return String(value ?? '-');
};

const Step3Grading: React.FC<Step3GradingProps> = ({
	suggestedGrade,
	confidence,
	breakdown,
	serialNumber,
	equipmentType,
	// reviewStatus reserved for future use
	isApproved,
	approving,
	// onBack reserved for future use
	onComplete,
	onApprove,
	onRecalculate,
	onModifyReview,
}) => {
	const [isApproving, setIsApproving] = useState(false);
	const [isRecalculating, setIsRecalculating] = useState(false);
	const [isReopening, setIsReopening] = useState(false);
	const [showManualOverride, setShowManualOverride] = useState(false);
	const [manualGrade, setManualGrade] = useState<string | null>(null);
	const [overrideReason, setOverrideReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	// Normalize grade value (handles string or object)
	const rawGrade =
		typeof suggestedGrade === 'object' && suggestedGrade !== null
			? ((suggestedGrade as any)?.value ?? (suggestedGrade as any)?.label ?? 'M')
			: suggestedGrade;
	const grade = String(rawGrade ?? 'M').toUpperCase();
	const gradeConfig = GRADE_CONFIG[grade] || GRADE_CONFIG['M'];
	const confidencePercent = Math.round((confidence || 0) * 100);

	// Normalize equipment type display
	const displayEquipmentType =
		typeof equipmentType === 'object' && equipmentType !== null
			? ((equipmentType as any)?.label ??
				(equipmentType as any)?.value ??
				String(equipmentType))
			: String(equipmentType ?? '');

	const handleAcceptSuggestion = async () => {
		setIsApproving(true);
		setError(null);
		try {
			await onApprove(grade, false);
		} catch (e: any) {
			setError(e?.message || 'Error al aprobar la revisión');
		} finally {
			setIsApproving(false);
		}
	};

	const handleManualApprove = async () => {
		if (!manualGrade) {
			setError('Debes seleccionar un grado');
			return;
		}
		if (!overrideReason.trim()) {
			setError('Debes proporcionar una razón para modificar el grado sugerido');
			return;
		}
		setIsApproving(true);
		setError(null);
		try {
			await onApprove(manualGrade, true, overrideReason);
		} catch (e: any) {
			setError(e?.message || 'Error al aprobar con grado manual');
		} finally {
			setIsApproving(false);
		}
	};

	const handleRecalculate = async () => {
		setIsRecalculating(true);
		setError(null);
		try {
			await onRecalculate();
		} catch (e: any) {
			setError(e?.message || 'Error al recalcular el grado');
		} finally {
			setIsRecalculating(false);
		}
	};

	const handleReopen = async () => {
		setIsReopening(true);
		setError(null);
		try {
			await onModifyReview();
		} catch (e: any) {
			setError(e?.message || 'Error al reabrir la revisión');
		} finally {
			setIsReopening(false);
		}
	};

	return (
		<div className='space-y-4'>
			{/* Error banner */}
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

			<Card>
				<CardBody className='space-y-6'>
					{/* Step Header */}
					<div className='flex items-start justify-between'>
						<div>
							<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
								Paso 3: Calificación
							</h2>
							<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
								{isApproved
									? 'Esta revisión ya fue aprobada. Solo lectura.'
									: 'Revisa el grado sugerido y aprueba el equipo'}
							</p>
						</div>
						<div className='flex items-center gap-2'>
							{isApproved && (
								<Badge
									variant='solid'
									color='emerald'
									className='gap-1 rounded-full px-3'>
									<Icon icon='HeroCheckBadge' className='h-3 w-3' />
									Aprobado
								</Badge>
							)}
						</div>
					</div>

					{/* Read-only banner with Reopen button */}
					{isApproved && (
						<div className='flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20'>
							<div className='flex items-center gap-3'>
								<Icon
									icon='HeroEye'
									className='h-5 w-5 flex-shrink-0 text-blue-500'
								/>
								<div>
									<p className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
										Modo Solo Lectura
									</p>
									<p className='text-xs text-blue-600 dark:text-blue-400'>
										Puedes navegar entre los pasos para revisar la información.
									</p>
								</div>
							</div>
							<Button
								variant='solid'
								color='blue'
								onClick={handleReopen}
								isLoading={isReopening}
								disabled={isReopening}
								className='flex-shrink-0'
								title='Reabrir la revisión para modificar datos técnicos'>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
								Reabrir Revisión
							</Button>
						</div>
					)}

					{/* Grade Display */}
					<div className={`rounded-2xl border-2 p-6 ${gradeConfig.bg}`}>
						<div className='flex items-center gap-6'>
							<div className='flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-zinc-900'>
								<span className={`text-5xl font-black ${gradeConfig.color}`}>
									{grade}
								</span>
							</div>
							<div className='flex-1'>
								<h3 className={`text-xl font-bold ${gradeConfig.color}`}>
									{gradeConfig.label}
								</h3>
								<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
									{gradeConfig.description}
								</p>
								{confidence > 0 && (
									<div className='mt-3'>
										<div className='mb-1 flex items-center justify-between'>
											<span className='text-xs text-zinc-500'>
												Confianza del sistema
											</span>
											<span className='text-xs font-semibold text-zinc-700 dark:text-zinc-300'>
												{confidencePercent}%
											</span>
										</div>
										<div className='h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'>
											<div
												className={`h-full rounded-full transition-all duration-700 ${
													confidencePercent >= 80
														? 'bg-emerald-500'
														: confidencePercent >= 50
															? 'bg-amber-500'
															: 'bg-red-500'
												}`}
												style={{ width: `${confidencePercent}%` }}
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Summary */}
					<div className='rounded-xl border border-zinc-200 dark:border-zinc-700'>
						<div className='border-b border-zinc-200 px-4 py-3 dark:border-zinc-700'>
							<h3 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Resumen de la Revisión
							</h3>
						</div>
						<div className='divide-y divide-zinc-100 dark:divide-zinc-800'>
							<div className='flex items-center justify-between px-4 py-3'>
								<span className='text-sm text-zinc-500'>Número de Serie</span>
								<span className='font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100'>
									{serialNumber}
								</span>
							</div>
							<div className='flex items-center justify-between px-4 py-3'>
								<span className='text-sm text-zinc-500'>Tipo de Equipo</span>
								<span className='text-sm font-medium capitalize text-zinc-800 dark:text-zinc-200'>
									{displayEquipmentType}
								</span>
							</div>
							<div className='flex items-center justify-between px-4 py-3'>
								<span className='text-sm text-zinc-500'>Grado</span>
								<span
									className={`rounded-full px-3 py-0.5 text-sm font-bold ${gradeConfig.badgeColor}`}>
									{grade}
								</span>
							</div>
						</div>
					</div>

					{/* Breakdown */}
					{breakdown && Object.keys(breakdown).length > 0 && (
						<div className='space-y-2'>
							<h4 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								Desglose de Puntuación
							</h4>
							<div className='rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50'>
								<div className='space-y-2'>
									{Object.entries(breakdown).map(([key, val]) => (
										<div
											key={key}
											className='flex items-center justify-between text-sm'>
											<span className='capitalize text-zinc-500'>
												{key.replace(/_/g, ' ')}
											</span>
											<span className='font-medium text-zinc-800 dark:text-zinc-200'>
												{formatBreakdownValue(val)}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Recalculate card — only when NOT approved */}
					{!isApproved && (
						<div className='rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
							<div className='flex items-start justify-between gap-4'>
								<div>
									<h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
										¿Modificaste los detalles técnicos?
									</h4>
									<p className='mt-1 text-xs text-blue-700 dark:text-blue-300'>
										Si cambiaste información importante (RAM, procesador,
										condiciones, etc.), puedes recalcular el grado
										automáticamente.
									</p>
								</div>
								<Button
									variant='outline'
									color='blue'
									onClick={handleRecalculate}
									isLoading={isRecalculating}
									disabled={isRecalculating || isApproving}
									className='flex-shrink-0'>
									<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
									{isRecalculating ? 'Recalculando...' : 'Recalcular Grado'}
								</Button>
							</div>
						</div>
					)}

					{/* Manual override panel — only when NOT approved */}
					{!isApproved && !showManualOverride && (
						<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50'>
							<div className='flex items-start justify-between gap-4'>
								<div className='flex gap-3'>
									<Icon
										icon='HeroInformationCircle'
										className='mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-400'
									/>
									<div>
										<h4 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
											¿No estás de acuerdo con la calificación?
										</h4>
										<p className='mt-1 text-xs text-zinc-500'>
											Puedes modificar el grado manualmente proporcionando una
											justificación.
										</p>
									</div>
								</div>
								<Button
									variant='outline'
									onClick={() => setShowManualOverride(true)}
									className='flex-shrink-0'>
									Modificar Grado
								</Button>
							</div>
						</div>
					)}

					{/* Manual override form */}
					{!isApproved && showManualOverride && (
						<Card>
							<CardHeader>
								<div className='flex items-center justify-between'>
									<h3 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
										Modificar Grado Manualmente
									</h3>
									<Button
										variant='outline'
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
									<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
										Nuevo Grado <span className='text-red-500'>*</span>
									</label>
									<SelectReact
										name='manual_grade'
										options={GRADE_OPTIONS}
										value={
											manualGrade
												? GRADE_OPTIONS.find(
														(o) => o.value === manualGrade,
													) || null
												: null
										}
										onChange={(option) => {
											setManualGrade(
												(option as TSelectOption | null)?.value || null,
											);
											setError(null);
										}}
										placeholder='Seleccionar grado'
									/>
								</div>
								<div>
									<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
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
									<p className='mt-1 text-xs text-zinc-500'>
										Esta información quedará registrada en el historial.
									</p>
								</div>
							</CardBody>
						</Card>
					)}

					{/* Footer Actions */}
					<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700'>
						<div className='flex gap-2'>
							<Button
								variant='outline'
								onClick={onComplete}
								disabled={isApproving || isReopening}>
								<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
								Volver al Lote
							</Button>

							{!isApproved && (
								<Button
									variant='outline'
									color='violet'
									onClick={handleReopen}
									isLoading={isReopening}
									disabled={isReopening || isApproving}
									title='Reabrir la revisión para modificar datos técnicos'>
									<Icon icon='HeroPencilSquare' className='mr-2 h-4 w-4' />
									Modificar Revisión
								</Button>
							)}
						</div>

						{!isApproved && (
							<div className='flex gap-2'>
								{showManualOverride ? (
									<Button
										variant='solid'
										color='emerald'
										onClick={handleManualApprove}
										isLoading={isApproving || approving}
										disabled={
											isApproving ||
											approving ||
											!manualGrade ||
											!overrideReason.trim()
										}>
										<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
										Aprobar con Grado Manual
									</Button>
								) : (
									<Button
										variant='solid'
										color='emerald'
										onClick={handleAcceptSuggestion}
										isLoading={isApproving || approving}
										disabled={isApproving || approving || isReopening}>
										<Icon icon='HeroCheckBadge' className='mr-2 h-4 w-4' />
										Aceptar y Aprobar
									</Button>
								)}
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default Step3Grading;
