import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';

interface DeferredPaymentSerialsInputProps {
	id: string;
	value: string[];
	disabled: boolean;
	onChange: (serials: string[]) => void;
}

const DeferredPaymentSerialsInput: React.FC<DeferredPaymentSerialsInputProps> = ({
	id,
	value,
	disabled,
	onChange,
}) => {
	const [draft, setDraft] = useState('');

	const addSerial = () => {
		const serial = draft.trim();
		if (!serial || value.includes(serial)) return;
		onChange([...value, serial]);
		setDraft('');
	};

	const addPastedSerials = (pastedValue: string) => {
		const addedSerials: string[] = [];
		const duplicateSerials: string[] = [];
		const knownSerials = new Set(value.map((serial) => serial.trim()));

		pastedValue
			.split(/[\s,]+/)
			.map((serial) => serial.trim())
			.filter(Boolean)
			.forEach((serial) => {
				if (knownSerials.has(serial)) {
					duplicateSerials.push(serial);
					return;
				}
				knownSerials.add(serial);
				addedSerials.push(serial);
			});

		if (addedSerials.length > 0) onChange([...value, ...addedSerials]);
		if (duplicateSerials.length > 0) {
			toast.warn(
				duplicateSerials.length === 1
					? 'Se omitió 1 serial duplicado.'
					: `Se omitieron ${duplicateSerials.length} seriales duplicados.`,
			);
		}
	};

	return (
		<div>
			<Label htmlFor={id}>Seriales (opcional)</Label>
			<div className='flex gap-2'>
				<Input
					id={id}
					name={`${id}.draft`}
					value={draft}
					placeholder='Escribe un serial y presiona Enter'
					disabled={disabled}
					onChange={(event) => setDraft(event.target.value)}
					onPaste={(event) => {
						if (disabled) return;
						event.preventDefault();
						setDraft('');
						addPastedSerials(event.clipboardData.getData('text'));
					}}
					onKeyDown={(event) => {
						if (event.key !== 'Enter' && event.key !== ',') return;
						event.preventDefault();
						addSerial();
					}}
				/>
				<Button
					type='button'
					variant='outline'
					icon='HeroPlus'
					isDisable={disabled || !draft.trim()}
					onClick={addSerial}>
					Agregar
				</Button>
			</div>
			{value.length > 0 && (
				<div className='mt-2 flex flex-wrap gap-2' aria-label='Seriales agregados'>
					{value.map((serial) => (
						<span
							key={serial}
							className='inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white py-1 pl-3 pr-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'>
							{serial}
							<Button
								type='button'
								size='xs'
								variant='ghost'
								icon='HeroXMark'
								aria-label={`Quitar serial ${serial}`}
								isDisable={disabled}
								onClick={() =>
									onChange(value.filter((current) => current !== serial))
								}
							/>
						</span>
					))}
				</div>
			)}
		</div>
	);
};

export default DeferredPaymentSerialsInput;
