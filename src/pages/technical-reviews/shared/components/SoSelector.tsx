import React, { useState, useEffect } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import Input from '@/components/form/Input'; // Import Input component
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import {
	MarcaSistema,
	getMarcas,
	getFamiliasPorMarca,
	getVersionesPorFamilia,
	getEdicionesPorVersion,
} from '../constants/So';

interface SoSelectorProps {
	value?: string;
	onChange: (osText: string) => void;
	disabled?: boolean;
}

export const SoSelector: React.FC<SoSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	const [selectedBrand, setSelectedBrand] = useState<MarcaSistema | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
	const [customEditionText, setCustomEditionText] = useState<string>(''); // State for custom edition

	// 1. Opciones de Marca
	const marcasData = getMarcas();
	const brandOptions: TSelectOption[] = marcasData.map((marca) => ({
		value: marca.nombre,
		label: marca.nombre,
	}));

	// 2. Opciones de Familia
	const familiasData = selectedBrand
		? getFamiliasPorMarca(selectedBrand)
		: [];
	const familyOptions: TSelectOption[] = familiasData.map((familia) => ({
		value: familia.id,
		label: familia.descripcion ? `${familia.nombre} - ${familia.descripcion}` : familia.nombre,
	}));

	const shouldShowFamilySelect = familiasData.length > 1;

	useEffect(() => {
		if (selectedBrand && familiasData.length === 1 && !selectedFamilyId) {
			setSelectedFamilyId(familiasData[0].id);
		}
	}, [selectedBrand, familiasData, selectedFamilyId]);

	// 3. Opciones de Versión
	const versionesData =
		selectedBrand && selectedFamilyId
			? getVersionesPorFamilia(selectedBrand, selectedFamilyId)
			: [];
	const versionOptions: TSelectOption[] = versionesData.map((ver) => ({
		value: ver.id,
		label: ver.año ? `${ver.nombre} (${ver.año})` : ver.nombre,
	}));

	// 4. Opciones de Edición
	const edicionesData =
		selectedBrand && selectedFamilyId && selectedVersionId
			? getEdicionesPorVersion(selectedBrand, selectedFamilyId, selectedVersionId)
			: [];
	
	const editionOptions: TSelectOption[] = edicionesData.map((ed) => ({
		value: ed.id,
		label: ed.nombre,
	}));

	// Add "Other" option
	if (edicionesData.length > 0) {
		editionOptions.push({ value: 'custom_edition', label: 'Otro (Especificar)' });
	}

	const shouldShowEditionSelect = edicionesData.length > 1 || editionOptions.length > 1; // Show if we added "Other" or multiples

	// Effect to clear custom text if not "custom_edition"
	useEffect(() => {
		if (selectedEditionId !== 'custom_edition') {
			setCustomEditionText('');
		}
	}, [selectedEditionId]);


	// Construir texto final del SO
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedVersionId) {
			return;
		}

		const familia = familiasData.find((f) => f.id === selectedFamilyId);
		const version = versionesData.find((v) => v.id === selectedVersionId);

		if (!familia || !version) return;

		// Logic to construct string
		const constructString = (editionName: string) => {
			let osText = `${version.nombre} ${editionName}`;
			if (editionName === 'Standard' || editionName === 'Base') {
				osText = version.nombre;
			}
			return osText;
		};


		// Case 1: Custom Edition Selected
		if (selectedEditionId === 'custom_edition') {
			if (customEditionText.trim()) {
				// Prevent loop or excessive updates? No, value prop controls parent.
				// onChange controls parent state.
				// We need to pass "Windows 11 MyCustomEdition"
				// Or just "Windows 11" + custom text.
				const osText = `${version.nombre} ${customEditionText}`;
				onChange(osText);
			} else {
				// Maybe incomplete string? or just Version?
				// Better to keep incomplete until typed? 
				// Let's pass version only meanwhile? Or nothing?
				// Let's pass version only so it's not empty, but user understands they need to type.
				// Actually if they clear it, maybe we should emit just version.
				onChange(version.nombre);
			}
			return;
		}

		// Case 2: Only 1 edition (and it's not "Other" implicitly unless we forced it)
		// But wait, if we added "Other" to options, length might be > 1 now (1 + Other).
		// Original logic: if (edicionesData.length === 1) auto-select.
		// If we always add "Other", generic auto-select logic might need tweak.
		// Let's say: if user hasn't manually selected yet, we default to the first real one?
		// OR we force selection.
		// Given we auto-pushed 'custom_edition', length is at least 1 (if data has 0 editions? data usually has >=1).
		
        // If there's only 1 "real" edition, let's select it by default BUT allow changing to "Other".
        // Use Effect for default selection only if nothing selected?
        if (!selectedEditionId && edicionesData.length === 1) {
             const defaultEd = edicionesData[0];
             // We can't set state directly here without causing loops if we are not careful.
             // But we can just call onChange.
             // Ideally we setSelectedEditionId to this default.
             setSelectedEditionId(defaultEd.id);
             return;
        }

		// Case 3: Specific Edition Selected
		if (selectedEditionId) {
			const edicion = edicionesData.find((e) => e.id === selectedEditionId);
			if (edicion) {
				onChange(constructString(edicion.nombre));
			}
		} else if (edicionesData.length === 0) {
			onChange(version.nombre);
		}

	}, [selectedBrand, selectedFamilyId, selectedVersionId, selectedEditionId, customEditionText, edicionesData, familiasData, versionesData]);


	const handleBrandChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedBrand((option?.value as MarcaSistema) || null);
		setSelectedFamilyId(null);
		setSelectedVersionId(null);
		setSelectedEditionId(null);
	};

	const handleFamilyChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedFamilyId(option?.value || null);
		setSelectedVersionId(null);
		setSelectedEditionId(null);
	};

	const handleVersionChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedVersionId(option?.value || null);
		setSelectedEditionId(null);
	};

	const handleEditionChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedEditionId(option?.value || null);
	};

	return (
		<div className='space-y-3'>
			{/* 1. Marca */}
			<div>
				<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
					1. Sistema (Marca)
				</label>
				<SelectReact
					name='so-brand'
					options={brandOptions}
					value={brandOptions.find((o) => o.value === selectedBrand) || null}
					onChange={handleBrandChange}
					placeholder='Microsoft, Apple, Linux...'
					isDisabled={disabled}
				/>
			</div>

			{selectedBrand && shouldShowFamilySelect && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						2. Familia
					</label>
					<SelectReact
						name='so-family'
						options={familyOptions}
						value={familyOptions.find((o) => o.value === selectedFamilyId) || null}
						onChange={handleFamilyChange}
						placeholder='Ej: Windows, macOS'
						isDisabled={disabled}
					/>
				</div>
			)}

			{selectedFamilyId && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						3. Versión
					</label>
					<SelectReact
						name='so-version'
						options={versionOptions}
						value={versionOptions.find((o) => o.value === selectedVersionId) || null}
						onChange={handleVersionChange}
						placeholder='Ej: Windows 11, Sonoma'
						isDisabled={disabled}
					/>
				</div>
			)}

			{selectedVersionId && shouldShowEditionSelect && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						4. Edición
					</label>
					<div className='flex flex-col gap-2'>
						<SelectReact
							name='so-edition'
							options={editionOptions}
							value={editionOptions.find((o) => o.value === selectedEditionId) || null}
							onChange={handleEditionChange}
							placeholder='Ej: Home, Pro, Enterprise'
							isDisabled={disabled}
						/>
						
						{selectedEditionId === 'custom_edition' && (
							<Input
                                name='so-custom-edition' 
								type="text"
								value={customEditionText}
								onChange={(e) => setCustomEditionText(e.target.value)}
								placeholder="Escribe la edición..."
								className="mt-1"
                                disabled={disabled}
							/>
						)}
					</div>
				</div>
			)}

			{value && (
				<div className='rounded-md bg-blue-50 p-2 dark:bg-blue-900/20'>
					<p className='text-xs font-medium text-blue-800 dark:text-blue-300'>
						Sistema Operativo seleccionado:
					</p>
					<p className='font-semibold text-blue-900 dark:text-blue-200'>{value}</p>
				</div>
			)}
		</div>
	);
};
