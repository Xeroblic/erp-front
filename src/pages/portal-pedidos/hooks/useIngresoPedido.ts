import { ChangeEvent, useCallback, useRef } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type { TSelectOption } from '@/components/form/SelectReact';
import { formatRut } from '@/utils/validateRut';
import { IPedidoFormValues, PEDIDO_INITIAL_VALUES, PedidoSchema } from '../types';

// El backend del portal aún no recibe pedidos: el envío se simula.
const SIMULATED_SUBMIT_MS = 1000;

const capitalizeFirst = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const useIngresoPedido = () => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const formik = useFormik<IPedidoFormValues>({
		initialValues: PEDIDO_INITIAL_VALUES,
		validationSchema: PedidoSchema,
		validateOnMount: true,
		onSubmit: async (_values, helpers) => {
			try {
				await new Promise<void>((resolve) => {
					setTimeout(resolve, SIMULATED_SUBMIT_MS);
				});
				toast.success('Pedido ingresado con éxito');
				helpers.resetForm();
				// resetForm deja los errores vacíos: se revalida para que el envío
				// vuelva a quedar deshabilitado con el formulario en blanco.
				void helpers.validateForm(PEDIDO_INITIAL_VALUES);
				if (fileInputRef.current) fileInputRef.current.value = '';
			} catch {
				toast.error('Ocurrió un error al ingresar el pedido');
			}
		},
	});

	const { setFieldValue, setFieldTouched, resetForm, validateForm } = formik;

	const handleRutChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			void setFieldValue('rutCliente', formatRut(event.target.value));
			void setFieldTouched('rutCliente', true, false);
		},
		[setFieldValue, setFieldTouched],
	);

	const handleNombreChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			void setFieldValue('nombreCliente', capitalizeFirst(event.target.value));
			void setFieldTouched('nombreCliente', true, false);
		},
		[setFieldValue, setFieldTouched],
	);

	const handleCanalChange = useCallback(
		(option: unknown) => {
			void setFieldValue('canalCompra', (option as TSelectOption | null)?.value ?? '');
			void setFieldTouched('canalCompra', true, false);
		},
		[setFieldValue, setFieldTouched],
	);

	const handleCotizacionChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			void setFieldValue('cotizacion', event.currentTarget.files);
			void setFieldTouched('link', true, false);
		},
		[setFieldValue, setFieldTouched],
	);

	const handleLinkChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			void setFieldValue('link', event.target.value);
			void setFieldTouched('link', true, false);
		},
		[setFieldValue, setFieldTouched],
	);

	const handleReset = useCallback(() => {
		resetForm();
		void validateForm(PEDIDO_INITIAL_VALUES);
		if (fileInputRef.current) fileInputRef.current.value = '';
	}, [resetForm, validateForm]);

	return {
		formik,
		fileInputRef,
		handleRutChange,
		handleNombreChange,
		handleCanalChange,
		handleCotizacionChange,
		handleLinkChange,
		handleReset,
	};
};

export default useIngresoPedido;
