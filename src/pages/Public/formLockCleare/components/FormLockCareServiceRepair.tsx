import React from 'react';
import { FormikProps } from 'formik';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import { chargerOptions, lockCareTheme } from './FormLockCare.data';
import { TicketFormValues } from './FormLockCare.types';

interface FormLockCareServiceRepairProps {
	formik: FormikProps<TicketFormValues>;
}

const baseFieldClassName =
	'rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:!border-emerald-500';

const FormLockCareServiceRepair: React.FC<FormLockCareServiceRepairProps> = ({ formik }) => {
	const selectedChargerOption =
		chargerOptions.find((option) => option.value === formik.values.repairIncludesCharger) ??
		null;

	return (
		<>
			<div>
				<Label htmlFor='repairBrand'>Marca del equipo*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.repairBrand}
					invalidFeedback={formik.errors.repairBrand}>
					<Input {...lockCareTheme}
						id='repairBrand'
						name='repairBrand'
						placeholder='Ej. Apple, Samsung, Lenovo'
						className={baseFieldClassName}
						value={formik.values.repairBrand}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>

			<div>
				<Label htmlFor='repairModel'>Modelo del equipo*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.repairModel}
					invalidFeedback={formik.errors.repairModel}>
					<Input {...lockCareTheme}
						id='repairModel'
						name='repairModel'
						placeholder='Ej. MacBook Pro 14, Galaxy S23'
						className={baseFieldClassName}
						value={formik.values.repairModel}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>

			<div className='mt-1'>
				<Label htmlFor='repairSerialNumber'>Número de serie (opcional)</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.repairSerialNumber}
					invalidFeedback={formik.errors.repairSerialNumber}>
					<Input {...lockCareTheme}
						id='repairSerialNumber'
						name='repairSerialNumber'
						placeholder='Número de serie'
						className={baseFieldClassName}
						value={formik.values.repairSerialNumber}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>

			<div>
				<Label htmlFor='repairIncludesCharger'>¿Incluye cargador?*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.repairIncludesCharger}
					invalidFeedback={formik.errors.repairIncludesCharger}>
					<SelectReact {...lockCareTheme}
						id='repairIncludesCharger'
						name='repairIncludesCharger'
						options={chargerOptions}
						placeholder='Selecciona una opción*'
						value={selectedChargerOption}
						onBlur={formik.handleBlur}
						onChange={(option) => {
							const selected = option as TSelectOption | null;
							const value = selected?.value ?? '';
							formik.setFieldValue('repairIncludesCharger', value);
						}}
						className='rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800'
					/>
				</Validation>
			</div>
		</>
	);
};

export default React.memo(FormLockCareServiceRepair);
