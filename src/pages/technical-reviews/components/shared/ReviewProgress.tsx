/**
 * ReviewProgress - Barra de progreso visual para el flujo de revisión
 */
import React from 'react';
import Icon from '@/components/icon/Icon';
import type { ReviewStatus } from '@/interface/technicalReviews.interface';

interface ReviewProgressProps {
	currentStatus: ReviewStatus;
	className?: string;
}

const ReviewProgress: React.FC<ReviewProgressProps> = ({ currentStatus, className = '' }) => {
	const steps = [
		{ status: 'pending', label: 'Pendiente', icon: 'HeroClock' },
		{ status: 'in_review', label: 'En Revisión', icon: 'HeroMagnifyingGlass' },
		{ status: 'reviewed', label: 'Revisada', icon: 'HeroDocumentCheck' },
		{ status: 'approved', label: 'Aprobada', icon: 'HeroCheckCircle' },
	];

	const statusOrder = ['pending', 'in_review', 'reviewed', 'approved'];
	const currentIndex = statusOrder.indexOf(currentStatus);

	return (
		<div className={`w-full ${className}`}>
			<div className='flex items-center justify-between'>
				{steps.map((step, index) => {
					const isActive = index <= currentIndex;
					const isCurrent = currentStatus === step.status;

					return (
						<React.Fragment key={step.status}>
							{/* Step */}
							<div className='flex flex-col items-center gap-2'>
								<div
									className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
										isCurrent
											? 'bg-blue-600 text-white'
											: isActive
												? 'bg-green-600 text-white'
												: 'bg-gray-200 text-gray-500 dark:bg-gray-700'
									}`}>
									<Icon icon={step.icon} className='h-6 w-6' />
								</div>
								<span
									className={`text-xs font-medium ${
										isActive
											? 'text-gray-900 dark:text-gray-100'
											: 'text-gray-500 dark:text-gray-400'
									}`}>
									{step.label}
								</span>
							</div>

							{/* Connector */}
							{index < steps.length - 1 && (
								<div
									className={`h-1 flex-1 transition-all ${
										index < currentIndex
											? 'bg-green-600'
											: 'bg-gray-200 dark:bg-gray-700'
									}`}
								/>
							)}
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};

export default ReviewProgress;
