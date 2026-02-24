import React, { useEffect } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppSelector } from '@/store';
import {
	selectEffectiveSubsidiaryId,
	selectBranchesBySubsidiary,
} from '@/store/selectors/subsidiarySelectors';
import type { ReportFiltersState } from '../types';

interface ReportFiltersInventoryProps {
	initial?: ReportFiltersState;
	onApply: (filters: ReportFiltersState) => void;
	onReset?: () => void;
}

const InventoryFiltersSchema = Yup.object().shape({
	branch: Yup.string(),
	parameter: Yup.string(),
});

const ReportFiltersInventory: React.FC<ReportFiltersInventoryProps> = ({
	initial,
	onApply,
	onReset,
}) => {
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const branches = useAppSelector((state) =>
		selectBranchesBySubsidiary(state, effectiveSubsidiaryId),
	);

	const formik = useFormik<ReportFiltersState>({
		initialValues: {
			subsidiary:
				initial?.subsidiary || (effectiveSubsidiaryId ? String(effectiveSubsidiaryId) : ''),
			branch: initial?.branch || '',
			parameter: initial?.parameter || '',
		},
		validationSchema: InventoryFiltersSchema,
		enableReinitialize: true,
		onSubmit: (values) => {
			onApply(values);
		},
	});

	// Resetear branch cuando cambia la subsidiaria
	useEffect(() => {
		if (formik.values.subsidiary && effectiveSubsidiaryId) {
			const selectedSubsidiaryId = Number(formik.values.subsidiary);
			if (selectedSubsidiaryId !== effectiveSubsidiaryId) {
				formik.setFieldValue('branch', '');
				formik.setFieldValue('subsidiary', String(effectiveSubsidiaryId));
			}
		}
	}, [effectiveSubsidiaryId, formik.values.subsidiary, formik.setFieldValue]);

	const handleReset = () => {
		formik.resetForm({
			values: { subsidiary: String(effectiveSubsidiaryId || ''), branch: '', parameter: '' },
		});
		onReset?.();
	};

	return (
		<Card className='border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/60 dark:from-emerald-900/10 dark:to-transparent'>
			<CardBody>
				<form
					onSubmit={formik.handleSubmit}
					className='flex flex-col items-end gap-4 md:flex-row'>
					<div className='w-full md:w-1/2'>
						<label className='text-xs text-zinc-500'>Término de búsqueda</label>
						<Input
							name='parameter'
							placeholder='Buscar por SKU o Producto...'
							value={formik.values.parameter || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							className='w-full'
						/>
					</div>

					<div className='w-full md:w-1/3'>
						<label className='text-xs text-zinc-500'>Bodega / Sucursal</label>
						<Select
							name='branch'
							value={formik.values.branch || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							className='w-full'>
							<option value=''>Todas las bodegas</option>
							{branches?.map((branch: any) => (
								<option key={branch.id} value={branch.id}>
									{branch.name}
								</option>
							))}
						</Select>
					</div>

					<div className='flex items-center gap-3'>
						<Button
							type='submit'
							color='emerald'
							variant='solid'
							icon='HeroFunnel'
							isDisable={!formik.isValid || formik.isSubmitting}>
							Aplicar
						</Button>
						<Button
							type='button'
							variant='outline'
							color='emerald'
							rightIcon='HeroArrowPath'
							onClick={handleReset}>
							Limpiar
						</Button>
					</div>
				</form>
			</CardBody>
		</Card>
	);
};

export default ReportFiltersInventory;
