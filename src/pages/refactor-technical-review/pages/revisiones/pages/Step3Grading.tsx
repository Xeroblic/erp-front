import React, { useState } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

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
	onApprove: () => Promise<void>;
	onRecalculate: () => Promise<void>;
	onModifyReview: () => Promise<void>;
}

const GRADE_CONFIG: Record<
	string,
	{ label: string; color: string; bg: string; description: string }
> = {
	A: {
		label: 'Grado A',
		color: 'text-emerald-600 dark:text-emerald-400',
		bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
		description: 'Excelente condición. Como nuevo.',
	},
	B: {
		label: 'Grado B',
		color: 'text-blue-600 dark:text-blue-400',
		bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
		description: 'Buena condición. Desgaste mínimo.',
	},
	C: {
		label: 'Grado C',
		color: 'text-amber-600 dark:text-amber-400',
		bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
		description: 'Condición aceptable. Desgaste visible.',
	},
	M: {
		label: 'Grado M',
		color: 'text-red-600 dark:text-red-400',
		bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
		description: 'Condición deficiente. Requiere reparación.',
	},
};

const Step3Grading: React.FC<Step3GradingProps> = ({
	suggestedGrade,
	confidence,
	breakdown,
	serialNumber,
	// equipmentType and reviewStatus reserved for future use
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
	const [isModifying, setIsModifying] = useState(false);

	const rawGrade =
		typeof suggestedGrade === 'object' && suggestedGrade !== null
			? ((suggestedGrade as any)?.value ?? (suggestedGrade as any)?.label ?? 'M')
			: suggestedGrade;
	const grade = String(rawGrade ?? 'M').toUpperCase();
	const gradeConfig = GRADE_CONFIG[grade] || GRADE_CONFIG['M'];
	const confidencePercent = Math.round((confidence || 0) * 100);

	const handleApprove = async () => {
		setIsApproving(true);
		try {
			await onApprove();
		} finally {
			setIsApproving(false);
		}
	};

	const handleRecalculate = async () => {
		setIsRecalculating(true);
		try {
			await onRecalculate();
		} finally {
			setIsRecalculating(false);
		}
	};

	const handleModify = async () => {
		setIsModifying(true);
		try {
			await onModifyReview();
		} finally {
			setIsModifying(false);
		}
	};

	return (
		<Card>
			<CardBody className='space-y-6'>
				{/* Step Header */}
				<div className='flex items-start justify-between'>
					<div>
						<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							Paso 3: Calificación
						</h2>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Revisa el grado sugerido y aprueba el equipo
						</p>
					</div>
					{isApproved && (
						<Badge variant='solid' color='emerald' className='gap-1 rounded-full px-3'>
							<Icon icon='HeroCheckBadge' className='h-3 w-3' />
							Aprobado
						</Badge>
					)}
				</div>

				{/* Grade Display */}
				<div className={`rounded-2xl border-2 p-6 ${gradeConfig.bg}`}>
					<div className='flex items-center gap-6'>
						{/* Grade Letter */}
						<div className='flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-zinc-900'>
							<span className={`text-5xl font-black ${gradeConfig.color}`}>
								{grade}
							</span>
						</div>

						{/* Grade Info */}
						<div className='flex-1'>
							<h3 className={`text-xl font-bold ${gradeConfig.color}`}>
								{gradeConfig.label}
							</h3>
							<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
								{gradeConfig.description}
							</p>

							{/* Confidence */}
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

				{/* Serial Info */}
				<div className='flex items-center gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50'>
					<Icon icon='HeroQrCode' className='h-5 w-5 text-zinc-400' />
					<div>
						<p className='text-xs text-zinc-500'>Número de Serie</p>
						<p className='font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100'>
							{serialNumber}
						</p>
					</div>
				</div>

				{/* Breakdown */}
				{breakdown && Object.keys(breakdown).length > 0 && (
					<div className='space-y-2'>
						<h4 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Desglose de calificación
						</h4>
						<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
							{Object.entries(breakdown).map(([key, val]) => (
								<div
									key={key}
									className='rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50'>
									<p className='text-xs capitalize text-zinc-500'>
										{key.replace(/_/g, ' ')}
									</p>
									<p className='mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
										{String(val)}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Footer Actions */}
				<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700'>
					<div className='flex gap-2'>
						{!isApproved && (
							<>
								<Button
									variant='outline'
									onClick={handleModify}
									isLoading={isModifying}
									disabled={isModifying || isApproving}>
									<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
									Modificar
								</Button>
								<Button
									variant='outline'
									color='amber'
									onClick={handleRecalculate}
									isLoading={isRecalculating}
									disabled={isRecalculating || isApproving}>
									<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
									Recalcular
								</Button>
							</>
						)}
						{isApproved && (
							<Button variant='outline' onClick={onComplete}>
								<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
								Volver al Lote
							</Button>
						)}
					</div>

					{!isApproved && (
						<Button
							variant='solid'
							color='emerald'
							onClick={handleApprove}
							isLoading={isApproving || approving}
							disabled={isApproving || approving || isModifying}>
							<Icon icon='HeroCheckBadge' className='mr-2 h-4 w-4' />
							Aprobar Equipo
						</Button>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default Step3Grading;
