import { type ClipboardEvent, useCallback, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import {
	createProcurementSupplierThunk,
	updateProcurementSupplierThunk,
} from '@/store/slices/procurement/procurementSuppliersSlice';
import { formatRut } from '@/utils/validateRut';
import type {
	IProcurementSupplier,
	IProcurementSupplierPayload,
	IProcurementSupplierRutConflict,
} from '@/interface/procurement.interface';
import { applyProcurementFieldErrors } from '@/utils/procurementErrors.util';
import { normalizePhone, pastePhone, supplierFormSchema } from '../types';
import type { ISupplierFormValues } from '../types';
import useSupplierRestore from './useSupplierRestore';

/**
 * Un solo hook para alta y edición: el contrato usa el mismo cuerpo en `POST`
 * y en `PATCH`; sólo cambia el thunk.
 */

const FORM_FIELD_BY_API_FIELD: Record<string, keyof ISupplierFormValues> = {
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

const EMPTY_VALUES: ISupplierFormValues = {
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

const toFormValues = (supplier: IProcurementSupplier | null): ISupplierFormValues =>
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

const toPayload = (values: ISupplierFormValues): IProcurementSupplierPayload => ({
	rut: formatRut(values.rut),
	company_name: values.company_name.trim() || null,
	contact_name: values.contact_name.trim() || null,
	business_activity: values.business_activity.trim() || null,
	billing_address: values.billing_address.trim() || null,
	billing_commune_id: values.billing_commune_id,
	shipping_address: values.shipping_address.trim() || null,
	shipping_commune_id: values.shipping_commune_id,
	phone: normalizePhone(values.phone) || null,
	email: values.email.trim() || null,
});

interface IUseSupplierFormArgs {
	subsidiaryId: number | null;
	/** `null`/`undefined`: alta. Con proveedor: edición de ese registro. */
	supplier?: IProcurementSupplier | null;
	onSuccess?: (supplier: IProcurementSupplier) => void;
}

const useSupplierForm = ({ subsidiaryId, supplier = null, onSuccess }: IUseSupplierFormArgs) => {
	const dispatch = useAppDispatch();
	const isEdit = supplier !== null;
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: isEdit
			? 'No se pudo actualizar el proveedor.'
			: 'No se pudo crear el proveedor.',
	});
	/**
	 * Estado propio, no derivado de `idempotentWrite.error`: `renewKey()` limpia
	 * ese error y apagaría el banner de conflicto que el usuario aún no resolvió.
	 */
	const [conflict, setConflict] = useState<IProcurementSupplierRutConflict | null>(null);
	const { restore, isRestoring } = useSupplierRestore({
		subsidiaryId,
		onSuccess: (restored) => {
			setConflict(null);
			onSuccess?.(restored);
		},
	});

	const formik = useFormik<ISupplierFormValues>({
		initialValues: toFormValues(supplier),
		enableReinitialize: true,
		validationSchema: supplierFormSchema,
		onSubmit: async (values, { resetForm }) => {
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

			if (result) {
				// En alta `initialValues` es siempre el mismo `EMPTY_VALUES`, así que
				// `enableReinitialize` no dispara: sin resetear, el próximo «Nuevo
				// proveedor» abriría con lo recién enviado.
				if (!isEdit) resetForm({ values: EMPTY_VALUES });
				onSuccess?.(result);
			}
		},
	});

	/**
	 * El 409 de RUT duplicado no se toastea: lo resuelve el banner de conflicto,
	 * que no desaparece solo mientras la decisión de restaurar sigue pendiente.
	 * Salvo `retry_same_key`, la clave se renueva: reusarla con el payload
	 * corregido devolvería `409 IDEMPOTENCY_KEY_REUSED`.
	 */
	useEffect(() => {
		const resolved = idempotentWrite.error;
		if (!resolved) return;

		if (resolved.code === 'SUPPLIER_RUT_ALREADY_EXISTS' && resolved.existingSupplier) {
			setConflict(resolved.existingSupplier);
		} else {
			applyProcurementFieldErrors(
				resolved.fieldErrors,
				(apiField) => FORM_FIELD_BY_API_FIELD[apiField],
				formik.setFieldError,
			);
			toast.error(resolved.message);
		}

		if (resolved.action !== 'retry_same_key') idempotentWrite.renewKey();
		// Sólo reacciona a un error nuevo; `formik` e `idempotentWrite` cambian
		// de identidad en cada render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idempotentWrite.error]);

	/** El banner de conflicto deja de aplicar en cuanto el RUT cambia. */
	const handleRutChange = useCallback(
		(value: string) => {
			setConflict(null);
			formik.setFieldValue('rut', formatRut(value)).catch(() => undefined);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	/** Se normaliza al teclear: con `maxLength`, los separadores truncarían el número. */
	const handlePhoneChange = useCallback(
		(value: string) => {
			formik.setFieldValue('phone', normalizePhone(value)).catch(() => undefined);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	/**
	 * El navegador aplica `maxLength` al texto pegado antes de `onChange`: pegar
	 * `+56 9 1234 5678` dejaría `+56 9 1234 5`. Se toma el pegado a mano.
	 */
	const handlePhonePaste = useCallback(
		(event: ClipboardEvent<HTMLInputElement>) => {
			event.preventDefault();
			const input = event.currentTarget;
			const end = input.selectionEnd ?? input.value.length;
			const start = input.selectionStart ?? end;
			const next = pastePhone(input.value, event.clipboardData.getData('text'), start, end);
			formik.setFieldValue('phone', next).catch(() => undefined);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	/** El contrato exige que restaurar sea una acción explícita, nunca parte del submit. */
	const restoreConflicting = useCallback(async () => {
		if (!conflict) return;
		await restore(conflict.id);
	}, [conflict, restore]);

	const reset = useCallback(() => {
		formik.resetForm();
		setConflict(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		formik,
		isEdit,
		isSubmitting: idempotentWrite.isSubmitting,
		conflict,
		isRestoring,
		restoreConflicting,
		handleRutChange,
		handlePhoneChange,
		handlePhonePaste,
		reset,
	};
};

export default useSupplierForm;
