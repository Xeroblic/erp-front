import React, { useState, useEffect } from 'react';
import type { SingleValue } from 'react-select';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { SelectionCard } from '@/pages/refactor-technical-review/components/ui/SelectionCard';
import {
	PROCESADORES_DATA,
	TipoDispositivo,
	MarcaProcesador,
	getMarcasPorDispositivo,
	getFamiliasPorMarcaYDispositivo,
	getGeneracionesPorFamilia,
	getModelosPorGeneracion,
} from '@/pages/refactor-technical-review/components/constants/Procesadores';

interface ProcessorSelectorProps {
	deviceType: TipoDispositivo;
	value?: string;
	onChange: (processorText: string) => void;
	readOnly?: boolean;
}

// Opciones rápidas comunes para Notebooks (se podrían mover a constants si crecen)
const QUICK_OPTIONS = [
	{ label: 'Intel Core i3', value: 'Intel Core i3' },
	{ label: 'Intel Core i5', value: 'Intel Core i5' },
	{ label: 'Intel Core i7', value: 'Intel Core i7' },
	{ label: 'AMD Ryzen 3', value: 'AMD Ryzen 3' },
	{ label: 'AMD Ryzen 5', value: 'AMD Ryzen 5' },
	{ label: 'AMD Ryzen 7', value: 'AMD Ryzen 7' },
];

export const ProcessorSelector: React.FC<ProcessorSelectorProps> = ({
	deviceType,
	value,
	onChange,
	readOnly = false,
}) => {
	// Dropdown States
	const [selectedBrand, setSelectedBrand] = useState<MarcaProcesador | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
	const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

	// Reset dropdowns when device type changes
	useEffect(() => {
		setSelectedBrand(null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	}, [deviceType]);

	// --- Derived Data for Dropdowns ---
	const marcasData = getMarcasPorDispositivo(deviceType);
	const brandOptions: TSelectOption[] = marcasData.map((marca) => ({
		value: marca.nombre,
		label: marca.nombre,
	}));

	const familiasData = selectedBrand
		? getFamiliasPorMarcaYDispositivo(deviceType, selectedBrand)
		: [];
	const familyOptions: TSelectOption[] = familiasData.map((familia) => ({
		value: familia.id,
		label: familia.descripcion ? `${familia.nombre} - ${familia.descripcion}` : familia.nombre,
	}));

	const generacionesData =
		selectedBrand && selectedFamilyId
			? getGeneracionesPorFamilia(deviceType, selectedBrand, selectedFamilyId)
			: [];
	const generationOptions: TSelectOption[] = generacionesData.map((gen) => ({
		value: gen.id,
		label: gen.año ? `${gen.nombre} (${gen.año})` : gen.nombre,
	}));

	const modelosData =
		selectedBrand && selectedFamilyId && selectedGenerationId
			? getModelosPorGeneracion(
					deviceType,
					selectedBrand,
					selectedFamilyId,
					selectedGenerationId,
				)
			: [];
	const modelOptions: TSelectOption[] = modelosData.map((modelo) => ({
		value: modelo.id,
		label: modelo.descripcion ? `${modelo.nombre} - ${modelo.descripcion}` : modelo.nombre,
	}));

	const shouldShowModelSelect = modelosData.length > 1;

	// --- Auto-construct Value Logic ---
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedGenerationId) {
			return;
		}

		if (modelosData.length === 1) {
			// Auto-select if only one model in generation
			const modelo = modelosData[0];
			onChange(`${modelo.nombre}`);
		} else if (selectedModelId) {
			// Select specific model
			const modelo = modelosData.find((m) => m.id === selectedModelId);
			if (modelo) {
				onChange(`${modelo.nombre}`);
			}
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedGenerationId,
		selectedModelId,
		modelosData,
		onChange,
	]);

	// --- Handlers ---
	const handleBrandChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedBrand((newValue?.value as MarcaProcesador) || null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleFamilyChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedFamilyId(newValue?.value || null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleGenerationChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedGenerationId(newValue?.value || null);
		setSelectedModelId(null);
	};

	const handleModelChange = (newValue: SingleValue<TSelectOption>) => {
		setSelectedModelId(newValue?.value || null);
	};

	// Determine if current value comes from Quick Select (simple matching)
	const isQuickSelected = (optValue: string) => value === optValue;

	return (
		<div className='flex flex-col gap-6'>
			{/* Quick Select Buttons */}
			<div>
				<label className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
					Selección Rápida
				</label>
				<div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6'>
					{QUICK_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={isQuickSelected(opt.value)}
							onClick={() => !readOnly && onChange(opt.value)}
							variant='compact' // Use minimal variant
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
							1. Marca
						</label>
						<SelectReact
							name='processor-brand'
							options={brandOptions}
							value={brandOptions.find((o) => o.value === selectedBrand) || null}
							onChange={handleBrandChange}
							placeholder='Intel / AMD'
							isDisabled={readOnly}
						/>
					</div>

					{/* 2. Familia */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							2. Familia
						</label>
						<SelectReact
							name='processor-family'
							options={familyOptions}
							value={familyOptions.find((o) => o.value === selectedFamilyId) || null}
							onChange={handleFamilyChange}
							placeholder='Serie...'
							isDisabled={readOnly || !selectedBrand}
						/>
					</div>

					{/* 3. Generación */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							3. Generación
						</label>
						<SelectReact
							name='processor-generation'
							options={generationOptions}
							value={
								generationOptions.find((o) => o.value === selectedGenerationId) ||
								null
							}
							onChange={handleGenerationChange}
							placeholder='Generación...'
							isDisabled={readOnly || !selectedFamilyId}
						/>
					</div>

					{/* 4. Modelo (Condicional) */}
					{shouldShowModelSelect && (
						<div>
							<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
								4. Modelo
							</label>
							<SelectReact
								name='processor-model'
								options={modelOptions}
								value={
									modelOptions.find((o) => o.value === selectedModelId) || null
								}
								onChange={handleModelChange}
								placeholder='Modelo Exacto...'
								isDisabled={readOnly || !selectedGenerationId}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
