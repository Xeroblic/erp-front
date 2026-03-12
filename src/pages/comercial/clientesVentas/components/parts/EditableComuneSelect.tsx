import React, { useId, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FormikProps } from 'formik';
import { RootState } from '@/store';
import Label from '@/components/form/Label';
import { SelectComune, IComunaOptionData } from '@/components/utils/selects/SelectComune';

interface EditableComuneSelectProps<FormValues extends Record<string, any>> {
	formik: FormikProps<FormValues>;
	name: keyof FormValues & string;
	label: string;
	isEditable: boolean;
	placeholder?: string;
	onSelectData?: (data: IComunaOptionData) => void;
}

/**
 * Componente que integra SelectComune con Formik para ClientesVentas.
 * Guarda el TEXTO de la comuna en el formulario, no el código.
 */
const EditableComuneSelect = <FormValues extends Record<string, any>>({
	formik,
	name,
	label,
	isEditable,
	placeholder = 'Buscar comuna...',
	onSelectData,
}: EditableComuneSelectProps<FormValues>) => {
	const value = (formik.values as Record<string, any>)[name] || '';
	const touched = (formik.touched as Record<string, any>)[name];
	const error = (formik.errors as Record<string, any>)[name];
	const inputId = useId();

	const { listaComunas } = useSelector((state: RootState) => state.core);

	// Mapear el nombre guardado en Formik al código de comuna para SelectComune
	const selectedComunaCode = useMemo(() => {
		if (!value) return null;
		const found = listaComunas.find(
			(c) => c.nombre.toUpperCase() === String(value).toUpperCase(),
		);
		return found ? found.codigo : null;
	}, [value, listaComunas]);

	if (!isEditable) {
		return (
			<div className='space-y-1'>
				<Label htmlFor={inputId}>{label}</Label>
				<p id={inputId} className='text-base text-zinc-800 dark:text-zinc-200'>
					{value ? String(value) : '—'}
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-1'>
			<Label htmlFor={inputId}>{label}</Label>
			<SelectComune
				name={name}
				label='' // Ocultamos el label interno de SelectComune para usar el nuestro
				placeholder={placeholder}
				value={selectedComunaCode}
				error={touched ? (error as string) : undefined}
				onChange={(code, data) => {
					if (code && data) {
						// Al seleccionar, buscamos el nombre y lo guardamos en Formik
						const comuna = listaComunas.find((c) => String(c.codigo) === String(code));
						formik.setFieldValue(name, comuna ? comuna.nombre : '');
						
						// Si se requiere guardar más datos (provincia, región), se hace vía callback
						if (onSelectData) {
							onSelectData(data);
						}
					} else {
						formik.setFieldValue(name, '');
					}
				}}
			/>
		</div>
	);
};

export default EditableComuneSelect;
