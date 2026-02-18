import React, { useState, useEffect } from 'react';
import type { SingleValue } from 'react-select';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import { SelectionCard } from '@/pages/refactor-technical-review/components/ui/SelectionCard';
import {
	MarcaSistema,
	getMarcas,
	getFamiliasPorMarca,
	getVersionesPorFamilia,
	getEdicionesPorVersion,
} from '@/pages/refactor-technical-review/components/constants/So';
import { OPERATING_SYSTEM_OPTIONS } from '@/pages/refactor-technical-review/components/constants/notebook/notebook.options';

interface SoSelectorProps {
	value?: string;
	onChange: (osText: string) => void;
	readOnly?: boolean;
}

export const SoSelector: React.FC<SoSelectorProps> = ({ value, onChange, readOnly = false }) => {
	// Dropdown States
	const [selectedBrand, setSelectedBrand] = useState<MarcaSistema | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
	const [customEditionText, setCustomEditionText] = useState<string>('');

	// 1. Marcas
	const marcasData = getMarcas();
	const brandOptions: TSelectOption[] = marcasData.map((marca) => ({
		value: marca.nombre,
		label: marca.nombre, // 'Microsoft', 'Apple', etc.
	}));

	// 2. Familias
	const familiasData = selectedBrand ? getFamiliasPorMarca(selectedBrand) : [];
	const familyOptions: TSelectOption[] = familiasData.map((familia) => ({
		value: familia.id,
		label: familia.descripcion ? `${familia.nombre} - ${familia.descripcion}` : familia.nombre,
	}));
	const shouldShowFamilySelect = familiasData.length > 1;

	// Auto-select family if only one (e.g. ChromeOS -> ChromeOS)
	useEffect(() => {
		if (selectedBrand && familiasData.length === 1 && !selectedFamilyId) {
			setSelectedFamilyId(familiasData[0].id);
		}
	}, [selectedBrand, familiasData, selectedFamilyId]);

	// 3. Versiones
	const versionesData =
		selectedBrand && selectedFamilyId
			? getVersionesPorFamilia(selectedBrand, selectedFamilyId)
			: [];
	const versionOptions: TSelectOption[] = versionesData.map((ver) => ({
		value: ver.id,
		label: ver.año ? `${ver.nombre} (${ver.año})` : ver.nombre,
	}));

	// 4. Ediciones
	const edicionesData =
		selectedBrand && selectedFamilyId && selectedVersionId
			? getEdicionesPorVersion(selectedBrand, selectedFamilyId, selectedVersionId)
			: [];

	const editionOptions: TSelectOption[] = edicionesData.map((ed) => ({
		value: ed.id,
		label: ed.nombre,
	}));

	// Add "Custom / Other" Option
	if (edicionesData.length > 0) {
		editionOptions.push({ value: 'custom_edition', label: 'Otra (Especificar)' });
	}

	const shouldShowEditionSelect = edicionesData.length > 1 || editionOptions.length > 1;

	// Clear custom text if switching away
	useEffect(() => {
		if (selectedEditionId !== 'custom_edition') {
			setCustomEditionText('');
		}
	}, [selectedEditionId]);

	// --- Construction Logic ---
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedVersionId) {
			return;
		}

		const version = versionesData.find((v) => v.id === selectedVersionId);
		if (!version) return;

		// Helper to invoke onChange with constructed string
		const setOS = (editionName: string) => {
			let text = `${version.nombre} ${editionName}`;
			if (['Standard', 'Base'].includes(editionName)) {
				text = version.nombre;
			}
			onChange(text);
		};

		if (selectedEditionId === 'custom_edition') {
			// Only update if text is present to avoid clearing user data aggressively?
			// Actually, standard behavior: update string as user types or selects
			// If empty, fallback to just version name so field isn't empty?
			if (customEditionText.trim()) {
				setOS(customEditionText);
			} else {
				onChange(version.nombre);
			}
		} else if (selectedEditionId) {
			const ed = edicionesData.find((e) => e.id === selectedEditionId);
			if (ed) {
				setOS(ed.nombre);
			}
		} else if (edicionesData.length === 1 && !shouldShowEditionSelect) {
			// Implicit single edition
			setOS(edicionesData[0].nombre);
		} else if (!selectedEditionId && edicionesData.length === 0) {
			// No editions defined (e.g. some generic Linux)
			onChange(version.nombre);
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedVersionId,
		selectedEditionId,
		customEditionText,
		edicionesData,
		versionesData,
		onChange,
		shouldShowEditionSelect,
	]);

	// --- Handlers ---
	const handleBrandChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedBrand((newValue?.value as MarcaSistema) || null);
		setSelectedFamilyId(null);
		setSelectedVersionId(null);
		setSelectedEditionId(null);
	};

	const handleFamilyChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedFamilyId(newValue?.value || null);
		setSelectedVersionId(null);
		setSelectedEditionId(null);
	};

	const handleVersionChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedVersionId(newValue?.value || null);
		setSelectedEditionId(null);
	};

	const handleEditionChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedEditionId(newValue?.value || null);
	};

	const isQuickSelected = (optValue: string) => value === optValue;

	return (
		<div className='flex flex-col gap-6'>
			{/* Quick Select Buttons */}
			<div>
				<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
					Selección Rápida
				</label>
				<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
					{OPERATING_SYSTEM_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={isQuickSelected(opt.value)}
							onClick={() => !readOnly && onChange(opt.value)}
							variant='compact'
							className='text-xs'
						/>
					))}
				</div>
			</div>

			{/* Divider */}
			<div className='relative flex items-center py-2'>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-700'></div>
				<span className='mx-4 flex-shrink-0 text-xs font-semibold text-zinc-400'>
					O Selección Avanzada
				</span>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-700'></div>
			</div>

			{/* Advanced Select Dropdowns */}
			<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					{/* 1. Marca */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							1. Sistema
						</label>
						<SelectReact
							name='so-brand'
							options={brandOptions}
							value={brandOptions.find((o) => o.value === selectedBrand) || null}
							onChange={handleBrandChange}
							placeholder='Microsoft / Apple...'
							isDisabled={readOnly}
						/>
					</div>

					{/* 2. Familia (Condicional) */}
					{shouldShowFamilySelect && (
						<div>
							<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
								2. Familia
							</label>
							<SelectReact
								name='so-family'
								options={familyOptions}
								value={
									familyOptions.find((o) => o.value === selectedFamilyId) || null
								}
								onChange={handleFamilyChange}
								placeholder='Familia...'
								isDisabled={readOnly || !selectedBrand}
							/>
						</div>
					)}

					{/* 3. Versión */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							{shouldShowFamilySelect ? '3. Versión' : '2. Versión'}
						</label>
						<SelectReact
							name='so-version'
							options={versionOptions}
							value={
								versionOptions.find((o) => o.value === selectedVersionId) || null
							}
							onChange={handleVersionChange}
							placeholder='Versión...'
							isDisabled={readOnly || !selectedBrand} // Relaxed dependency if family auto-selected? Well, strict for now.
						/>
					</div>

					{/* 4. Edición */}
					{shouldShowEditionSelect && (
						<div className='sm:col-span-full'>
							<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
								{shouldShowFamilySelect ? '4. Edición' : '3. Edición'}
							</label>
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
								<SelectReact
									name='so-edition'
									options={editionOptions}
									value={
										editionOptions.find((o) => o.value === selectedEditionId) ||
										null
									}
									onChange={handleEditionChange}
									placeholder='Edición...'
									isDisabled={readOnly || !selectedVersionId}
								/>
								{selectedEditionId === 'custom_edition' && (
									<Input
										name='so-custom-edition'
										value={customEditionText}
										onChange={(e) => setCustomEditionText(e.target.value)}
										placeholder='Especifique...'
										disabled={readOnly}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
