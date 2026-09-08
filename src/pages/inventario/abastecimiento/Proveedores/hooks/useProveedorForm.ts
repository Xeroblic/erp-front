import { useCallback, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createProcurementSupplierThunk,
	restoreProcurementSupplierThunk,
	updateProcurementSupplierThunk,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import { formatRut } from '@/utils/validateRut';
import type {
	IProcurementSupplier,
	IProcurementSupplierPayload,
} from '@/interface/procurement.interface';
import { proveedorFormSchema } from '../types';
import type { IProveedorFormValues } from '../types';

/**
 * Formik + `useIdempotentWrite` del alta y edición de proveedor. Un solo
 * hook para las dos, porque el contrato usa el mismo cuerpo en `POST` y en
 * los campos editables de `PATCH` (sección 5) — la única diferencia es qué
 * thunk se llama.
 *
 * Compartido entre el listado (`Proveedores`) y la ficha
 * (`ProveedoresDetalle`): ambos abren el mismo modal para editar.
 */

const FORM_FIELD_BY_API_FIELD: Record<string, keyof IProveedorFormValues> = {
	rut: 'rut',
	company_name: 'company_name',
	contact_name: 'contact_name',
	business_activity: 'business_activity',
	billing_address: 'billing_address',
	billing_commune_id: 'billing_commune_id',
	shipping_address: 'shipping_address',
	shipping_commune_id: 'shipping_commune_id',
	phone: 'phone',
	email: 'email',
};

const EMPTY_VALUES: IProveedorFormValues = {
	rut: '',
	company_name: '',
	contact_name: '',
	business_activity: '',
	billing_address: '',
	billing_commune_id: null,
	shipping_address: '',
	shipping_commune_id: null,
	phone: '',
	email: '',
};

const toFormValues = (supplier: IProcurementSupplier | null): IProveedorFormValues =>
	supplier === null
		? EMPTY_VALUES
		: {
				rut: supplier.rut,
				company_name: supplier.company_name ?? '',
				contact_name: supplier.contact_name ?? '',
				business_activity: supplier.business_activity ?? '',
				billing_address: supplier.billing_address ?? '',
				billing_commune_id: supplier.billing_commune_id,
				shipping_address: supplier.shipping_address ?? '',
				shipping_commune_id: supplier.shipping_commune_id,
				phone: supplier.phone ?? '',
				email: supplier.email ?? '',
			};

const toPayload = (values: IProveedorFormValues): IProcurementSupplierPayload => ({
	rut: formatRut(values.rut),
	company_name: values.company_name.trim() || null,
	contact_name: values.contact_name.trim() || null,
	business_activity: values.business_activity.trim() || null,
	billing_address: values.billing_address.trim() || null,
	billing_commune_id: values.billing_commune_id,
	shipping_address: values.shipping_address.trim() || null,
	shipping_commune_id: values.shipping_commune_id,
	phone: values.phone.trim() || null,
	email: values.email.trim() || null,
});

interface IUseProveedorFormArgs {
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con proveedor: edición de ese registro. */
	supplier?: IProcurementSupplier | null;
	onSuccess?: (supplier: IProcurementSupplier) => void;
}

const useProveedorForm = ({ subsidiaryId, supplier = null, onSuccess }: IUseProveedorFormArgs) => {
	const dispatch = useAppDispatch();
	const isEdit = supplier !== null;
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: isEdit
			? 'No se pudo actualizar el proveedor.'
			: 'No se pudo crear el proveedor.',
	});
	const [isRestoring, setIsRestoring] = useState(false);

	const formik = useFormik<IProveedorFormValues>({
		initialValues: toFormValues(supplier),
		enableReinitialize: true,
		validationSchema: proveedorFormSchema,
		onSubmit: async (values) => {
			const payload = toPayload(values);
			const result = await idempotentWrite.submit((headers) =>
				isEdit && supplier
					? dispatch(
							updateProcurementSupplierThunk({
								subsidiaryId,
								id: supplier.id,
								payload,
								headers: { idempotencyKey: headers['Idempotency-Key'] },
							}),
						).unwrap()
					: dispatch(
							createProcurementSupplierThunk({
								subsidiaryId,
								payload,
								headers: { idempotencyKey: headers['Idempotency-Key'] },
							}),
						).unwrap(),
			);

			if (result) onSuccess?.(result);
		},
	});

	/**
	 * Un 422 con `fieldErrors` se pinta sobre cada input y además se toastea. El
	 * 409 de RUT duplicado **no** se toastea: lo resuelve el banner de
	 * conflicto de la propia modal (`conflict`, abajo), no una notificación que
	 * desaparece sola mientras la decisión de restaurar sigue pendiente.
	 */
	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved || resolved.code === 'SUPPLIER_RUT_ALREADY_EXISTS') return;

		Object.entries(resolved.fieldErrors ?? {}).forEach(([apiField, messages]) => {
			const formField = FORM_FIELD_BY_API_FIELD[apiField];
			if (formField && messages[0]) formik.setFieldError(formField, messages[0]);
		});
		toast.error(resolved.message);
		// Sólo reacciona a un error nuevo: `formik` cambia de identidad en cada
		// render y no es lo que este efecto observa.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.error]);

	const conflict =
		idempotentWrite.error?.code === 'SUPPLIER_RUT_ALREADY_EXISTS'
			? idempotentWrite.error.existingSupplier
			: null;

	/**
	 * El conflicto se limpia al tocar el RUT: seguir mostrando el proveedor en
	 * conflicto de un RUT que el usuario ya cambió confundiría más de lo que
	 * ayuda.
	 */
	const handleRutChange = useCallback(
		(value: string) => {
			if (idempotentWrite.error) idempotentWrite.clearError();
			formik.setFieldValue('rut', formatRut(value)).catch(() => undefined);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[idempotentWrite.error, idempotentWrite.clearError],
	);

	/**
	 * Restaurar desde el conflicto es una decisión explícita del usuario, nunca
	 * un efecto lateral de guardar: acción propia, separada del submit, con su
	 * propio estado de carga. El contrato es explícito en que nunca se
	 * restaura solo.
	 */
	const restoreConflicting = useCallback(async () => {
		if (!conflict) return;
		setIsRestoring(true);
		try {
			const restored = await dispatch(
				restoreProcurementSupplierThunk({ subsidiaryId, id: conflict.id }),
			).unwrap();
			toast.success(`${restored.display_name} fue restaurado.`);
			idempotentWrite.clearError();
			onSuccess?.(restored);
		} catch {
			toast.error('No se pudo restaurar el proveedor.');
		} finally {
			setIsRestoring(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conflict, dispatch, subsidiaryId]);

	const reset = useCallback(() => {
		formik.resetForm();
		idempotentWrite.clearError();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.clearError]);

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting,
		conflict,
		isRestoring,
		restoreConflicting,
		handleRutChange,
		reset,
	};
};

export default useProveedorForm;
