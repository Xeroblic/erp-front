import React, { FC, useEffect, useState } from 'react';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';

interface IInputUnitSelectorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	isValid?: boolean;
}

const UNIT_OPTIONS: TSelectOption[] = [
	{ value: 'KB', label: 'KB' },
	{ value: 'MB', label: 'MB' },
	{ value: 'GB', label: 'GB' },
	{ value: 'TB', label: 'TB' },
	{ value: 'PT', label: 'PT' },
];

export const InputUnitSelector: FC<IInputUnitSelectorProps> = ({
	value,
	onChange,
	placeholder,
	disabled,
	className,
	isValid = true,
}) => {
	const [number, setNumber] = useState('');
	const [unit, setUnit] = useState('GB');

	// Sincronizar estado interno con el valor externo (ej: "16GB")
	useEffect(() => {
		if (value) {
			const numPart = value.match(/[0-9.]+/)?.[0] || '';
			const unitPart = value.replace(/[0-9.]/g, '') || 'GB';
			setNumber(numPart);
			if (UNIT_OPTIONS.some(opt => opt.value === unitPart)) {
				setUnit(unitPart);
			}
		} else {
			setNumber('');
		}
	}, [value]);

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setNumber(val);
		onChange(val ? `${val}${unit}` : '');
	};

	const handleUnitChange = (option: any) => {
		const newUnit = (option as TSelectOption)?.value || 'GB';
		setUnit(newUnit);
		if (number) {
			onChange(`${number}${newUnit}`);
		}
	};

	return (
		<div
			className={`flex items-stretch rounded-lg border transition-all duration-200 bg-white dark:bg-zinc-900 ${
				isValid
					? 'border-zinc-300 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
					: 'border-red-500 ring-2 ring-red-500/20'
			} ${className}`}>

			{/* Input numérico nativo limpio de clases extra */}
			<div className='flex-1 flex'>
				<input
					name='number-input'
					type='number'
					value={number}
					onChange={handleNumberChange}
					placeholder={placeholder}
					disabled={disabled}
					className='w-full bg-transparent px-3 py-2 outline-none border-none ring-0 text-zinc-800 dark:text-white placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
				/>
			</div>

			{/* Separador visual */}
			{/* <div className='w-px bg-zinc-200 dark:bg-zinc-700 my-2'></div> */}

			{/* Selector de Unidad a la derecha */}
			<div className='hover:cursor-pointer shrink-0 min-w-[5.5rem] bg-zinc-300 dark:bg-zinc-800/50 rounded-r-lg rounded-l-lg flex items-center justify-center m-2'>
				<SelectReact
					name='unit-selector'
					options={UNIT_OPTIONS}
					value={UNIT_OPTIONS.find((o) => o.value === unit)}
					onChange={handleUnitChange}
					isDisabled={disabled}
					className='hover:cursor-pointer !border-transparent hover:!border-transparent dark:hover:!border-transparent !bg-transparent [&>div]:!shadow-none [&>div]:!border-transparent !ring-0 focus:!ring-0 w-full'
					dimension='sm'
					menuPosition='fixed'
					menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
				/>
			</div>
		</div>
	);
};

export default InputUnitSelector;
