import React from 'react';
import Select from '@/components/form/Select';
import {
	COVER_CONDITIONS_NOTEBOOK,
	COVER_CONDITIONS_DESKTOP,
	COVER_CONDITIONS_GENERIC,
	HINGE_CONDITIONS,
	TOUCHPAD_CONDITIONS,
	BOTTOM_CONDITIONS,
} from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const AestheticsSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const coverOpts =
		productKind === 'desktop_pc'
			? COVER_CONDITIONS_DESKTOP
			: productKind === 'notebook'
				? COVER_CONDITIONS_NOTEBOOK
				: COVER_CONDITIONS_GENERIC;

	const showHinge = productKind === 'notebook';
	const showTouchpad = productKind === 'notebook';
	const showBottom = productKind === 'notebook';

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Condición de carcasa
					</label>
					<Select
						name='review_cover_condition'
						value={data.cover_condition ?? ''}
						onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
							updateField('cover_condition', e.target.value)
						}>
						<option value=''>Seleccionar</option>
						{coverOpts.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</Select>
				</div>

				{showHinge && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Condición de bisagras
						</label>
						<Select
							name='review_hinge_condition'
							value={data.hinge_condition ?? ''}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								updateField('hinge_condition', e.target.value)
							}>
							<option value=''>Seleccionar</option>
							{HINGE_CONDITIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{showTouchpad && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Condición del touchpad
						</label>
						<Select
							name='review_touchpad_condition'
							value={data.touchpad_condition ?? ''}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								updateField('touchpad_condition', e.target.value)
							}>
							<option value=''>Seleccionar</option>
							{TOUCHPAD_CONDITIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{showBottom && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Condición parte inferior
						</label>
						<Select
							name='review_bottom_condition'
							value={data.bottom_condition ?? ''}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								updateField('bottom_condition', e.target.value)
							}>
							<option value=''>Seleccionar</option>
							{BOTTOM_CONDITIONS.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</Select>
					</div>
				)}
			</div>
		</div>
	);
};

export default AestheticsSection;
