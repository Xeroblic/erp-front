import { useCallback, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	selectInventoryUpdatingThreshold,
	updateInventoryThresholdThunk,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import { UmbralSchema, type IUmbralFormValues } from '@/pages/inventario/Inventario/types';

export interface IUmbralTarget {
	productId: number;
	productName: string;
	threshold: number | null;
}

/**
 * Edición del umbral crítico (§13) desde Umbrales, con el mismo formulario y
 * servicio que la ficha de Inventario. El umbral es del producto: vale para
 * todas las sucursales, así que al guardar se vuelve a pedir el reporte.
 */
const useUmbralEditor = (onSaved: () => void) => {
	const dispatch = useAppDispatch();
	const saving = useAppSelector(selectInventoryUpdatingThreshold);
	const [target, setTarget] = useState<IUmbralTarget | null>(null);

	const formik = useFormik<IUmbralFormValues>({
		initialValues: {
			threshold:
				target?.threshold === null || target?.threshold === undefined
					? ''
					: String(target.threshold),
		},
		enableReinitialize: true,
		validationSchema: UmbralSchema,
		onSubmit: async (values) => {
			if (!target) return;
			const value = values.threshold.trim();
			try {
				await dispatch(
					updateInventoryThresholdThunk({
						productId: target.productId,
						threshold: value === '' ? null : Number(value),
					}),
				).unwrap();
				toast.success(value === '' ? 'Umbral desactivado.' : 'Umbral guardado.');
				setTarget(null);
				onSaved();
			} catch (rejection: unknown) {
				toast.error(
					typeof rejection === 'string' ? rejection : 'No pudimos guardar el umbral.',
				);
			}
		},
	});

	const open = useCallback((next: IUmbralTarget) => setTarget(next), []);
	const close = useCallback(() => {
		setTarget(null);
		formik.resetForm();
		// `formik` cambia en cada render; sólo se necesita su `resetForm` estable.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formik.resetForm]);

	return { target, formik, saving, open, close };
};

export default useUmbralEditor;
