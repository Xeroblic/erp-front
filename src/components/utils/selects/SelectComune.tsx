import React, { useEffect, useRef } from 'react';
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
	isRequired?: boolean;
	value?: string | number | null;
	onChange?: (value: string | null, data?: IComunaOptionData) => void;
	error?: string | boolean;
	disabled?: boolean;
	/**
	 * Oculta el rótulo propio (ícono + texto). Para usarlo junto a otro campo con el
	 * `Label` estándar (mismo `<div className='space-y-1'>` que envuelve un `Input`),
	 * en vez de dos rótulos distintos y desalineados entre sí.
	 */
	hideLabel?: boolean;
	/** `id` del control, para asociarlo a un `Label` externo (`htmlFor`) cuando `hideLabel` es `true`. */
	inputId?: string;
}

export const SelectComune: React.FC<SelectComuneProps> = ({
	name = 'comuna_id',
	label = 'Dirección (Comuna)',
	placeholder = 'Escriba una comuna (Ej. Puente Alto)...',
	isRequired = false,
	value: manualValue,
	onChange: manualOnChange,
	error: manualError,
	disabled: manualDisabled = false,
	hideLabel = false,
	inputId,
}) => {
	const dispatch = useAppDispatch();
	const containerRef = useRef<HTMLDivElement>(null);

	const { listaComunas, loading } = useSelector((state: RootState) => state.core);
	const options = useSelector(selectComunasSearchOptions);

	// Cada montaje (cada vez que se abre el modal) vuelve a pedir las listas actualizadas.
	useEffect(() => {
		void dispatch(listaRegionesThunk());
		void dispatch(listaProvinciasThunk());
		void dispatch(listaComunasThunk());
	}, [dispatch]);

	useEffect(() => {
		if (!containerRef.current) return undefined;
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
			return undefined;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				containerRef.current,
				{ opacity: 0, y: 12 },
				{ opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' },
			);
		}, containerRef);

		return () => {
			ctx.revert();
		};
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
					inputId={inputId}
					options={options}
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
			{!hideLabel && (
				<div className='mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
					<Icon icon='HeroMapPin' className='h-4 w-4 text-blue-500' />
					{label} {isRequired && <span className='text-red-500'>*</span>}
				</div>
			)}
			<FieldWrap>
				{renderSelect(manualValue, manualOnChange ?? (() => undefined), manualError)}
			</FieldWrap>
		</div>
	);
};
