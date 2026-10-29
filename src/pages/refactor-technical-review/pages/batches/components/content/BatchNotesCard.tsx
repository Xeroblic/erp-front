import React from 'react';
import classNames from 'classnames';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import {
	BATCH_NOTES_MAX_LENGTH,
	useBatchNotes,
} from '@/pages/refactor-technical-review/pages/batches/components/hooks/useBatchNotes';
import type { IBatch } from '@/interface/technicalReviews.interface';

export const EDIT_BATCH_PERMISSION = 'edit-technical-reviews-batches';

interface IBatchNotesCardProps {
	batch: IBatch;
}

const BatchNotesCard: React.FC<IBatchNotesCardProps> = ({ batch }) => {
	const { formik, isEditing, startEditing, cancelEditing, charCount, isOverLimit, subsidiaryId } =
		useBatchNotes(batch);

	const hasNotes = Boolean(batch.notes?.trim());

	return (
		<Card>
			<CardBody className='p-5'>
				<div className='mb-3 flex items-center justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroDocumentText' className='h-5 w-5 text-zinc-500' />
						<h3 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
							Notas
						</h3>
					</div>
					{!isEditing && (
						<ProtectedButton
							permission={EDIT_BATCH_PERMISSION}
							subsidiaryId={subsidiaryId}
							scope='access'
							size='sm'
							variant='outline'
							icon='HeroPencilSquare'
							aria-label={
								hasNotes ? 'Editar notas del lote' : 'Agregar notas al lote'
							}
							onClick={startEditing}>
							{hasNotes ? 'Editar' : 'Agregar'}
						</ProtectedButton>
					)}
				</div>

				{isEditing ? (
					<form onSubmit={formik.handleSubmit} noValidate>
						<Validation
							isValid={!formik.errors.notes}
							isTouched={!!formik.touched.notes || isOverLimit}
							invalidFeedback={formik.errors.notes}>
							<Textarea
								id='batch-notes'
								name='notes'
								rows={4}
								placeholder='Agregar notas…'
								aria-label='Notas del lote'
								aria-describedby='batch-notes-counter'
								aria-invalid={!!formik.errors.notes}
								value={formik.values.notes}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
								autoFocus
							/>
						</Validation>
						<div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
							<span
								id='batch-notes-counter'
								className={classNames('text-xs', {
									'font-semibold text-red-500': isOverLimit,
									'text-zinc-500': !isOverLimit,
								})}>
								{charCount}/{BATCH_NOTES_MAX_LENGTH}
							</span>
							<div className='flex gap-2'>
								<Button
									type='button'
									size='sm'
									variant='outline'
									onClick={cancelEditing}
									isDisable={formik.isSubmitting}>
									Cancelar
								</Button>
								<Button
									type='submit'
									size='sm'
									color='emerald'
									variant='solid'
									isDisable={isOverLimit || formik.isSubmitting}
									isLoading={formik.isSubmitting}>
									Guardar
								</Button>
							</div>
						</div>
					</form>
				) : (
					<p
						className={classNames('text-sm leading-relaxed whitespace-pre-wrap', {
							'text-zinc-600 dark:text-zinc-400': hasNotes,
							'text-zinc-400 italic dark:text-zinc-500': !hasNotes,
						})}>
						{hasNotes ? batch.notes : 'Este lote no tiene notas.'}
					</p>
				)}
			</CardBody>
		</Card>
	);
};

export default BatchNotesCard;
