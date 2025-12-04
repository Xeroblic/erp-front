import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { useAppDispatch } from '@/store';
import type { WarrantyEntity, WarrantyFormMode, WarrantyFormValues } from '../types';
import { toWarrantyFormValues } from '../utils/warranty.utils';
import type { WarrantyCreateDTO, WarrantyStatus } from '@/interface/warranties.interface';
import { toast } from '@/utils/toast.utils';
import { createWarranty, updateWarranty } from '@/store/slices/garantias/thunks';

type UseWarrantyFormProps = {
	subsidiaryId?: number | null;
	mode: WarrantyFormMode;
	warranty?: WarrantyEntity | null;
	onSuccess?: () => void;
};

const validationSchema = Yup.object().shape({
	serial_number: Yup.string().nullable(),
	product_id: Yup.number()
		.nullable()
		.when('serial_number', {
			is: (serial?: string | null) => !serial || serial.trim().length === 0,
			then: (schema) => schema.required('El producto es obligatorio'),
		}),
	start_date: Yup.string()
		.nullable()
		.when('serial_number', {
			is: (serial?: string | null) => !serial || serial.trim().length === 0,
			then: (schema) => schema.required('La fecha de inicio es obligatoria'),
		}),
	end_date: Yup.string()
		.nullable()
		.when('serial_number', {
			is: (serial?: string | null) => !serial || serial.trim().length === 0,
			then: (schema) => schema.required('La fecha de término es obligatoria'),
		})
		.when('start_date', {
			is: (start?: string | null) => Boolean(start),
			then: (schema) =>
				schema.test(
					'is-after-start',
					'La fecha de término debe ser posterior o igual a la de inicio',
					(value, context) => {
						if (!value || !context.parent.start_date) return true;
						return dayjs(value).diff(dayjs(context.parent.start_date), 'day') >= 0;
					},
				),
		}),
	status: Yup.mixed<WarrantyStatus | ''>()
		.oneOf(['Activa', 'Expirada', 'Usada', 'Anulada', ''], 'Estado inválido')
		.nullable(),
});

export const useWarrantyForm = ({
	subsidiaryId,
	mode,
	warranty,
	onSuccess,
}: UseWarrantyFormProps) => {
	const dispatch = useAppDispatch();
	const initialValues = toWarrantyFormValues(warranty);

	const formik = useFormik<WarrantyFormValues>({
		initialValues,
		enableReinitialize: true,
		validationSchema,
		onSubmit: async (values, helpers) => {
			if (!subsidiaryId) {
				toast.error('Selecciona una empresa o sucursal');
				return;
			}
			const payload: WarrantyCreateDTO = {};
			const serialTrimmed = values.serial_number?.trim();
			if (serialTrimmed) {
				payload.serial_number = serialTrimmed;
			} else {
				payload.product_id = values.product_id ?? undefined;
				payload.start_date = values.start_date || undefined;
				payload.end_date = values.end_date || undefined;
				payload.sale_id = values.sale_id ?? undefined;
				payload.customer_id = values.customer_id ?? undefined;
				payload.status = values.status || undefined;
				payload.notes = values.notes?.trim() || undefined;
			}
			try {
				if (mode === 'edit' && warranty?.id) {
					await dispatch(
						updateWarranty({
							subsidiaryId,
							warrantyId: warranty.id,
							payload,
						}),
					).unwrap();
					toast.success('Garantía actualizada correctamente');
				} else {
					await dispatch(
						createWarranty({
							subsidiaryId,
							payload,
						}),
					).unwrap();
					toast.success('Garantía creada correctamente');
					helpers.resetForm();
				}
				onSuccess?.();
			} catch (error: unknown) {
				const apiError = error as { response?: { data?: { message?: string } } };
				const message =
					apiError.response?.data?.message ||
					(mode === 'edit'
						? 'No se pudo actualizar la garantía'
						: 'No se pudo crear la garantía');
				toast.error(message);
			} finally {
				helpers.setSubmitting(false);
			}
		},
	});

	return {
		formik,
		isSubmitting: formik.isSubmitting,
		handleSubmit: formik.handleSubmit,
	};
};
