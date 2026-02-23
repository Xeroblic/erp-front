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
import ReviewSummaryAside from './components/ReviewSummaryAside';
// import { translateValue } from './components/utils/reviewTranslations';

const Revisiones: React.FC = () => {
	const hook = useItemReview();

	const pageTitle = hook.item ? `Revisión #${hook.item.serial_number}` : 'Nueva Revisión';
	// const [showFloatingSN, setShowFloatingSN] = useState(false);
	// useEffect(() => {
	// 	const handleScroll = (e: Event) => {
	// 		const target = e.target as any;
	// 		const scrollTop = target === document ? window.scrollY : target.scrollTop;

	// 		if (scrollTop !== undefined && scrollTop > 50) {
	// 			setShowFloatingSN(true);
	// 		} else if (scrollTop !== undefined && scrollTop <= 50) {
	// 			setShowFloatingSN(false);
	// 		}
	// 	};

	// 	window.addEventListener('scroll', handleScroll, true);
	// 	return () => window.removeEventListener('scroll', handleScroll, true);
	// }, []);
	return (
		<PageWrapper name='item-review' title={pageTitle} isProtectedRoute={true}>
			{/* <div
				className={`fixed left-[50%] top-0 z-[9] flex h-48 w-[400px] -translate-x-96 transform items-center justify-center rounded-b-full bg-zinc-900/60 shadow-2xl transition-all duration-500 ease-in-out dark:bg-zinc-800 md:left-[60%] md:h-40 md:w-[600px] ${
					showFloatingSN ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
				}`}>
				<div className='flex flex-col place-items-center justify-center pt-28 text-white md:pt-24'>
					<span className='mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300'>
						N° Serie
					</span>
					<span className='text-lg font-bold tracking-wider'>
						{translateValue(hook.serialNumber || hook.item?.serial_number) || '-'}
					</span>
				</div>
			</div> */}
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
						initialData={hook.item}
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
			<ReviewSummaryAside
				item={hook.item}
				serialNumber={hook.serialNumber}
				equipmentType={hook.equipmentType}
				normalizedReviewStatus={hook.normalizedReviewStatus}
				automaticGrade={hook.automaticGrade}
			/>
		</PageWrapper>
	);
};

export default Revisiones;
