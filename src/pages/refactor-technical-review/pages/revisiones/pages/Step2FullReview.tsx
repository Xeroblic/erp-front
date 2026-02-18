import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface Step2FullReviewProps {
	equipmentType: string;
	serialNumber: string;
	onBack: () => void;
	onComplete: () => Promise<void>;
	loading?: boolean;
}

const EQUIPMENT_LABEL_MAP: Record<string, string> = {
	notebook: 'Notebook',
	desktop: 'Desktop',
	aio: 'All-in-One',
	docking: 'Docking Station',
	monitor: 'Monitor',
};

const Step2FullReview: React.FC<Step2FullReviewProps> = ({
	equipmentType,
	serialNumber,
	onBack,
	onComplete,
	loading = false,
}) => {
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleComplete = async () => {
		setIsSubmitting(true);
		try {
			await onComplete();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card>
			<CardBody className='space-y-6'>
				{/* Step Header */}
				<div className='flex items-start justify-between'>
					<div>
						<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							Paso 2: Revisión Completa
						</h2>
						<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
							Completa los detalles técnicos del equipo
						</p>
					</div>
					<Badge variant='outline' color='amber' className='gap-1 rounded-full px-3'>
						<Icon icon='HeroWrenchScrewdriver' className='h-3 w-3' />
						{EQUIPMENT_LABEL_MAP[equipmentType] || equipmentType}
					</Badge>
				</div>

				{/* Placeholder Content */}
				<div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-700 dark:bg-zinc-900/50'>
					<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
						<Icon icon='HeroWrenchScrewdriver' className='h-8 w-8' />
					</div>
					<h3 className='mt-4 text-base font-semibold text-zinc-700 dark:text-zinc-300'>
						Formulario en construcción
					</h3>
					<p className='mt-2 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400'>
						El formulario de revisión técnica para{' '}
						<span className='font-semibold text-zinc-700 dark:text-zinc-300'>
							{EQUIPMENT_LABEL_MAP[equipmentType] || equipmentType}
						</span>{' '}
						estará disponible próximamente.
					</p>
					<div className='mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20'>
						<Icon icon='HeroInformationCircle' className='h-4 w-4 text-blue-500' />
						<span className='text-xs text-blue-600 dark:text-blue-400'>
							Serie: <span className='font-mono font-bold'>{serialNumber}</span>
						</span>
					</div>
				</div>

				{/* Footer Actions */}
				<div className='flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700'>
					<Button variant='outline' onClick={onBack} disabled={isSubmitting}>
						<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
						Atrás
					</Button>

					<Button
						variant='solid'
						color='blue'
						onClick={handleComplete}
						isLoading={isSubmitting || loading}
						disabled={isSubmitting || loading}>
						Finalizar Revisión
						<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export default Step2FullReview;
