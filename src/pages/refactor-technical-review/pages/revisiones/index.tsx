import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import StepIndicator from './components/StepIndicator';
import Step1BasicInfo from './pages/Step1BasicInfo';
import Step2FullReview from './pages/Step2FullReview';
import Step3Grading from './pages/Step3Grading';
import { useItemReview } from './components/hooks/useItemReview';

const Revisiones: React.FC = () => {
	const hook = useItemReview();

	const pageTitle = hook.item ? `Revisión #${hook.item.serial_number}` : 'Nueva Revisión';

	return (
		<PageWrapper name='item-review' title={pageTitle} isProtectedRoute={true}>
			<Subheader>
				<SubheaderLeft>
					<Button variant='outline' color='red' onClick={hook.handleBack}>
						<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					</Button>
					<div className='ml-3 flex flex-col justify-center'>
						<h1 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							{pageTitle}
						</h1>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							{hook.batchDisplayLabel}
						</p>
					</div>
					{hook.isApproved && (
						<Badge
							variant='outline'
							color='blue'
							className='ml-4 gap-1 rounded-full border-blue-300 px-3 dark:border-blue-700'>
							<Icon icon='HeroEye' className='h-3 w-3' />
							Solo Lectura
						</Badge>
					)}
				</SubheaderLeft>
			</Subheader>

			<Container className='space-y-4 py-4'>
				{/* Step Indicator */}
				<Card>
					<CardBody>
						<StepIndicator
							currentStepIndex={hook.currentStepIndex}
							onStepClick={hook.handleStepClick}
							isApproved={hook.isApproved}
							hasItem={Boolean(hook.item)}
						/>
					</CardBody>
				</Card>

				{/* Step Content */}
				{hook.currentStep === 'basic' && (
					<Step1BasicInfo
						serialNumber={hook.serialNumber}
						onSerialChange={hook.setSerialNumber}
						productId={hook.productId}
						onProductChange={hook.setProductId}
						productOptions={hook.productOptions}
						productsLoading={hook.productsLoading}
						equipmentType={hook.equipmentType}
						onEquipmentTypeChange={hook.setEquipmentType}
						canContinue={hook.canContinue}
						loading={hook.loading || hook.startingReview}
						onBack={hook.handleBack}
						onSubmit={hook.handleStep1Submit}
						readOnly={hook.isApproved}
					/>
				)}

				{hook.currentStep === 'review' && hook.item && (
					<Step2FullReview
						equipmentType={
							typeof hook.equipmentType === 'string'
								? hook.equipmentType
								: String(hook.equipmentType)
						}
						serialNumber={hook.serialNumber || hook.item?.serial_number || ''}
						onBack={() => hook.handleStepClick('basic')}
						onComplete={hook.handleStep2Complete}
						loading={hook.completingReview}
						readOnly={hook.isApproved}
					/>
				)}

				{hook.currentStep === 'grading' && hook.item && (
					<Step3Grading
						suggestedGrade={
							hook.item.approved_at
								? hook.item.grade
								: hook.item.suggested_grade || hook.automaticGrade || 'M'
						}
						confidence={hook.item.scoring_confidence || 0}
						breakdown={hook.item.breakdown || {}}
						serialNumber={hook.serialNumber || hook.item?.serial_number || ''}
						equipmentType={String(hook.equipmentType)}
						reviewStatus={hook.normalizedReviewStatus}
						isApproved={hook.isApproved}
						approving={hook.approving}
						onBack={() => hook.handleStepClick('review')}
						onComplete={hook.handleBack}
						onApprove={hook.handleStep3Submit}
						onRecalculate={hook.handleRecalculateGrade}
						onModifyReview={hook.handleModifyReview}
					/>
				)}
			</Container>
		</PageWrapper>
	);
};

export default Revisiones;
