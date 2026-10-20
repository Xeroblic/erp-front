import { useCallback, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store';
import { updateBatch } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { IBatch } from '@/interface/technicalReviews.interface';

export const BATCH_NOTES_MAX_LENGTH = 1000;

export interface IBatchNotesForm {
	notes: string;
}

export const BatchNotesSchema = Yup.object({
	notes: Yup.string().max(
		BATCH_NOTES_MAX_LENGTH,
		`Las notas no pueden superar los ${BATCH_NOTES_MAX_LENGTH} caracteres`,
	),
});

/** Un campo vacío (o sólo espacios) borra la nota: el backend recibe `null`. */
export const toNotesPayload = (value: string): string | null => {
	const trimmed = value.trim();
	return trimmed === '' ? null : value;
};

const getRejectMessage = (error: unknown): string => {
	if (typeof error === 'string' && error.trim() !== '') return error;
	if (error instanceof Error && error.message) return error.message;
	return 'No se pudieron guardar las notas del lote';
};

export const useBatchNotes = (batch: IBatch | null) => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const [isEditing, setIsEditing] = useState(false);

	const currentNotes = batch?.notes ?? '';

	const formik = useFormik<IBatchNotesForm>({
		initialValues: { notes: currentNotes },
		enableReinitialize: true,
		validationSchema: BatchNotesSchema,
		onSubmit: async (values, helpers) => {
			if (!batch) return;
			const notes = toNotesPayload(values.notes);
			if (notes === (batch.notes ?? null)) {
				setIsEditing(false);
				return;
			}
			try {
				// Ruta canónica por filial; sólo si no hay filial se cae a la de sucursal.
				await dispatch(
					updateBatch({
						...(subsidiaryId ? { subsidiaryId } : { branchId }),
						batchId: batch.id,
						data: { notes },
					}),
				).unwrap();
				setIsEditing(false);
				toast.success('Notas del lote actualizadas');
			} catch (error: unknown) {
				void helpers.setFieldTouched('notes', true, false);
				helpers.setFieldError('notes', getRejectMessage(error));
			}
		},
	});

	const startEditing = useCallback(() => {
		formik.resetForm({ values: { notes: currentNotes } });
		setIsEditing(true);
	}, [formik, currentNotes]);

	const cancelEditing = useCallback(() => {
		formik.resetForm({ values: { notes: currentNotes } });
		setIsEditing(false);
	}, [formik, currentNotes]);

	const charCount = formik.values.notes.length;
	const isOverLimit = charCount > BATCH_NOTES_MAX_LENGTH;

	return useMemo(
		() => ({
			formik,
			isEditing,
			startEditing,
			cancelEditing,
			charCount,
			isOverLimit,
			branchId,
			subsidiaryId,
		}),
		[
			formik,
			isEditing,
			startEditing,
			cancelEditing,
			charCount,
			isOverLimit,
			branchId,
			subsidiaryId,
		],
	);
};
