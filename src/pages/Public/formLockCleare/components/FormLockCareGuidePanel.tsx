import React from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { customerChecklist, flowCards, quickBadges } from './FormLockCare.data';

interface FormLockCareGuidePanelProps {
	showSteps: boolean;
	showChecklist: boolean;
	onToggleSteps: () => void;
	onToggleChecklist: () => void;
}

const FormLockCareGuidePanel: React.FC<FormLockCareGuidePanelProps> = ({
	showSteps,
	showChecklist,
	onToggleSteps,
	onToggleChecklist,
}) => {
	return (
		<div className='space-y-4 self-start lg:sticky lg:top-6'>
			<div className='flex gap-2 lg:hidden'>
				<Button
					type='button'
					variant={showSteps ? 'solid' : 'outline'}
					color='emerald'
					icon='HeroListBullet'
					className='flex-1 justify-center rounded-xl py-2 text-xs font-semibold'
					onClick={onToggleSteps}>
					Pasos
				</Button>
				<Button
					type='button'
					variant={showChecklist ? 'solid' : 'outline'}
					color='emerald'
					icon='HeroClipboardDocumentCheck'
					className='flex-1 justify-center rounded-xl py-2 text-xs font-semibold'
					onClick={onToggleChecklist}>
					Checklist
				</Button>
			</div>

			<Card className='relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 shadow-[0_10px_40px_rgba(16,185,129,0.08)]'>
				<div className={showSteps ? 'block lg:block' : 'hidden lg:block'}>
					<div className='pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-300/30 blur-3xl' />
					<div className='pointer-events-none absolute -bottom-12 right-0 h-32 w-32 rounded-full bg-teal-300/25 blur-3xl' />

					<div className='relative flex flex-col gap-6'>
						<div className='space-y-5'>
							<div className='flex flex-wrap gap-2'>
								{quickBadges.map((badge) => (
									<span
										key={badge}
										className='inline-flex items-center rounded-full border border-emerald-900/10 bg-white px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm'>
										{badge}
									</span>
								))}
							</div>

							<div className='space-y-2'>
								<h2 className='text-2xl font-semibold tracking-tight text-zinc-800'>
									Paso a paso para ti
								</h2>
								<p className='text-sm leading-6 text-zinc-600'>
									Sigue estos pasos para ingresar tu equipo de forma correcta.
								</p>
							</div>

							<div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-1'>
								{flowCards.map((item, index) => (
									<div
										key={item.title}
										className='flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm'>
										<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700'>
											<Icon icon={item.icon} className='h-5 w-5' />
										</div>
										<div className='min-w-0'>
											<p className='text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700'>
												Paso {index + 1}
											</p>
											<p className='font-semibold text-zinc-800'>
												{item.title}
											</p>
											<p className='mt-1 text-sm leading-5 text-zinc-500'>
												{item.text}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</Card>

			<Card
				className={
					showChecklist
						? 'rounded-3xl border border-emerald-900/10 bg-white/85 p-5 shadow-sm lg:block'
						: 'hidden rounded-3xl border border-emerald-900/10 bg-white/85 p-5 shadow-sm lg:block'
				}>
				<div className='flex items-center gap-2'>
					<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700'>
						<Icon icon='HeroCheckBadge' className='h-4 w-4' />
					</div>
					<p className='text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700'>
						Antes de enviar
					</p>
				</div>
				<ul className='mt-3 space-y-2'>
					{customerChecklist.map((item) => (
						<li
							key={item}
							className='flex items-start gap-2 text-sm leading-6 text-zinc-600'>
							<Icon
								icon='HeroCheckCircle'
								className='mt-1 h-4 w-4 shrink-0 text-emerald-600'
							/>
							<span>{item}</span>
						</li>
					))}
				</ul>
			</Card>
		</div>
	);
};

export default React.memo(FormLockCareGuidePanel);
