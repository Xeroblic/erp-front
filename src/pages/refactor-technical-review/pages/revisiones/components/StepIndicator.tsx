import React from 'react';
import Icon from '@/components/icon/Icon';
import type { ReviewStep } from './hooks/useItemReview';
import { REVIEW_STEPS } from './hooks/useItemReview';

interface StepIndicatorProps {
	currentStepIndex: number;
	onStepClick: (stepId: ReviewStep) => void;
	isApproved: boolean;
	hasItem: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
	currentStepIndex,
	onStepClick,
	isApproved,
	hasItem,
}) => {
	return (
		<div className='flex items-center justify-between'>
			{REVIEW_STEPS.map((step, index) => {
				const isCompleted = index < currentStepIndex;
				const isActive = index === currentStepIndex;
				const canNavigate = !isApproved && (hasItem || step.id === 'basic');

				return (
					<React.Fragment key={step.id}>
						<div
							onClick={() => canNavigate && onStepClick(step.id)}
							className={`flex items-center gap-3 transition-all ${
								isActive || isCompleted
									? 'text-blue-600 dark:text-blue-400'
									: 'text-gray-400 dark:text-gray-600'
							} ${canNavigate ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}>
							{/* Circle */}
							<div
								className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
									isCompleted
										? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
										: isActive
											? 'border-2 border-blue-600 bg-white text-blue-600 shadow-lg shadow-blue-500/20 dark:bg-zinc-900'
											: 'border-2 border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'
								}`}>
								{isCompleted ? (
									<Icon icon='HeroCheck' className='h-5 w-5' />
								) : (
									<Icon icon={step.icon as any} className='h-5 w-5' />
								)}
							</div>

							{/* Labels */}
							<div className='hidden md:block'>
								<p
									className={`text-sm font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-blue-500 dark:text-blue-500' : 'text-zinc-500 dark:text-zinc-500'}`}>
									{step.label}
								</p>
								<p className='text-xs text-zinc-400'>Paso {step.step}</p>
							</div>
						</div>

						{/* Connector line */}
						{index < REVIEW_STEPS.length - 1 && (
							<div
								className={`mx-3 h-0.5 flex-1 rounded-full transition-all duration-500 ${
									index < currentStepIndex
										? 'bg-blue-600'
										: 'bg-zinc-200 dark:bg-zinc-700'
								}`}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

export default StepIndicator;
