import React, { useEffect, useRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '@/store';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import gsap from 'gsap';

import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { selectComunasSearchOptions } from '@/store/selectors/directionsSelector'; // Ajusta la ruta si es necesario
import { IComuna } from '@/interface/core.interface';

export interface IComunaOptionData {
	comuna_id: string | number;
	province_id: string | number | null;
	region_id: string | number | null;
}

interface SelectComuneProps {
	name?: string;
	label?: string;
	placeholder?: string;
	populateSiblings?: {
		provincia?: string;
		region?: string;
	};
	isRequired?: boolean;
	value?: string | number | null;
	onChange?: (value: string | null, data?: IComunaOptionData) => void;
	error?: string | boolean;
	disabled?: boolean;
}

export const SelectComune: React.FC<SelectComuneProps> = ({
	name = 'comuna_id',
	label = 'Dirección (Comuna)',
	placeholder = 'Escriba una comuna (Ej. Puente Alto)...',
	populateSiblings,
	isRequired = false,
	value: manualValue,
	onChange: manualOnChange,
	error: manualError,
	disabled: manualDisabled = false,
}) => {
	// Si no está dentro de FormProvider, useFormContext() retorna null pero NO debemos hacer throw error manualmente.
	const methods = useFormContext();
	const dispatch = useAppDispatch();
	const containerRef = useRef<HTMLDivElement>(null);

	const { listaRegiones, listaProvincias, listaComunas, loading } = useSelector(
		(state: RootState) => state.core,
	);
	const options = useSelector(selectComunasSearchOptions);

	// 🚀 MEJORA 1: Quitamos el "if (.length === 0)".
	// Ahora CADA VEZ que abras el modal (se monta el componente), despachará por los datos actualizados.
	useEffect(() => {
		dispatch(listaRegionesThunk());
		dispatch(listaProvinciasThunk());
		dispatch(listaComunasThunk());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (containerRef.current) {
			gsap.fromTo(
				containerRef.current,
				{ opacity: 0, y: 15 },
				{ opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
			);
		}
	}, []);

	const dynamicPlaceholder = loading ? 'Cargando direcciones de Chile...' : placeholder;

	const renderSelect = (
		currentValue: string | number | null | undefined,
		handleCurrentChange: (val: string | null, data?: IComunaOptionData) => void,
		currentError?: string | boolean,
	) => {
		let selectedOption = null;
		if (currentValue) {
			selectedOption =
				options.find((opt: TSelectOption) => String(opt.value) === String(currentValue)) ||
				null;

			if (!selectedOption) {
				const comunaName = listaComunas.find(
					(c: IComuna) => String(c.codigo) === String(currentValue),
				)?.nombre;
				selectedOption = {
					value: currentValue,
					label:
						comunaName || (loading ? 'Cargando dirección...' : 'Comuna seleccionada'),
				};
			}
		}

		return (
			<div className='group relative w-full'>
				<SelectReact
					name={name}
					options={options as TSelectOption[]}
					value={selectedOption as TSelectOption}
					placeholder={dynamicPlaceholder}
					isClearable
					isLoading={loading}
					isDisabled={loading || manualDisabled}
					className={`transition-all duration-300 ${currentError ? 'rounded-lg border-red-500 ring-1 ring-red-500' : ''} `}
					onChange={(selected: unknown) => {
						const sel = selected as TSelectOption & { data?: IComunaOptionData };
						handleCurrentChange(sel?.value || null, sel?.data);
					}}
				/>

				{currentError && typeof currentError === 'string' && (
					<span className='mt-1 flex animate-pulse items-center gap-1 text-xs font-semibold text-red-500'>
						<Icon icon='HeroExclamationCircle' className='h-3 w-3' />
						{currentError}
					</span>
				)}
			</div>
		);
	};

	return (
		<div ref={containerRef} className='w-full'>
			<div className='mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
				<Icon icon='HeroMapPin' className='h-4 w-4 text-blue-500' />
				{label} {isRequired && <span className='text-red-500'>*</span>}
			</div>
			<FieldWrap>
				{methods && methods.control ? (
					<Controller
						name={name}
						control={methods.control}
						render={({ field: { onChange, value }, fieldState: { error } }) => {
							const internalOnChange = (
								val: string | null,
								data?: IComunaOptionData,
							) => {
								onChange(val);
								if (populateSiblings && data) {
									if (populateSiblings.provincia)
										methods.setValue(
											populateSiblings.provincia,
											data.province_id,
											{ shouldDirty: true, shouldValidate: true },
										);
									if (populateSiblings.region)
										methods.setValue(populateSiblings.region, data.region_id, {
											shouldDirty: true,
											shouldValidate: true,
										});
								} else if (populateSiblings && !data) {
									if (populateSiblings.provincia)
										methods.setValue(populateSiblings.provincia, null);
									if (populateSiblings.region)
										methods.setValue(populateSiblings.region, null);
								}
							};
							return renderSelect(value, internalOnChange, error?.message);
						}}
					/>
				) : (
					renderSelect(
						manualValue as string | number | null | undefined,
						(val: string | null, data?: IComunaOptionData) => {
							if (manualOnChange) {
								manualOnChange(val, data);
							}
						},
						manualError,
					)
				)}
			</FieldWrap>
		</div>
	);
};
