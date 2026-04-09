import React from 'react';
import { FormikProps } from 'formik';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Validation from '@/components/form/Validation';
import { upgradeTypeOptions } from './FormLockCare.data';
import { TicketFormValues } from './FormLockCare.types';

interface FormLockCareServiceUpgradeProps {
	formik: FormikProps<TicketFormValues>;
}

const baseFieldClassName =
	'rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:!border-emerald-500';

const FormLockCareServiceUpgrade: React.FC<FormLockCareServiceUpgradeProps> = ({ formik }) => {
	const selectedUpgradeType =
		upgradeTypeOptions.find((option) => option.value === formik.values.upgradeType) ?? null;

	return (
		<>
			<div className='md:col-span-2'>
				<Label htmlFor='upgradeType'>Tipo de upgrade*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.upgradeType}
					invalidFeedback={formik.errors.upgradeType}>
					<SelectReact
						id='upgradeType'
						name='upgradeType'
						options={upgradeTypeOptions}
						placeholder='Selecciona el tipo de upgrade*'
						value={selectedUpgradeType}
						onBlur={formik.handleBlur}
						onChange={(option) => {
							const selected = option as TSelectOption | null;
							const value = selected?.value ?? '';
							formik.setFieldValue('upgradeType', value);
						}}
						className='rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800'
					/>
				</Validation>
			</div>

			<div>
				<Label htmlFor='upgradeBrand'>Marca del equipo*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.upgradeBrand}
					invalidFeedback={formik.errors.upgradeBrand}>
					<Input
						id='upgradeBrand'
						name='upgradeBrand'
						placeholder='Ej. Apple, Dell, HP'
						className={baseFieldClassName}
						value={formik.values.upgradeBrand}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>

			<div>
				<Label htmlFor='upgradeModel'>Modelo del equipo*</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.upgradeModel}
					invalidFeedback={formik.errors.upgradeModel}>
					<Input
						id='upgradeModel'
						name='upgradeModel'
						placeholder='Ej. MacBook Air M2, Inspiron 15'
						className={baseFieldClassName}
						value={formik.values.upgradeModel}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>

			<div className='mt-1 md:col-span-2'>
				<Label htmlFor='upgradeSerialNumber'>Número de serie (opcional)</Label>
				<Validation
					isValid={formik.isValid}
					isTouched={formik.touched.upgradeSerialNumber}
					invalidFeedback={formik.errors.upgradeSerialNumber}>
					<Input
						id='upgradeSerialNumber'
						name='upgradeSerialNumber'
						placeholder='Número de serie'
						className={baseFieldClassName}
						value={formik.values.upgradeSerialNumber}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
					/>
				</Validation>
			</div>
		</>
	);
};

export default React.memo(FormLockCareServiceUpgrade);
