import React, { useState, useEffect } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
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
		label: familia.nombre,
	}));

	const generacionesData =
		selectedBrand && selectedFamilyId
			? getGeneracionesPorFamilia(deviceType, selectedBrand, selectedFamilyId)
			: [];
	const generationOptions: TSelectOption[] = generacionesData.map((gen) => ({
		value: gen.id,
		label: gen.nombre,
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
		label: modelo.nombre,
	}));

	const shouldShowModelSelect = modelosData.length > 1;

	// --- Auto-construct Value Logic ---
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedGenerationId) {
			return;
		}

		// Helper to construct the full string
		const constructProcessorString = (modelName: string) => {
			const familyObj = familiasData.find((f) => f.id === selectedFamilyId);
			const genObj = generacionesData.find((g) => g.id === selectedGenerationId);

			const familyName = familyObj?.nombre || '';
			const genName = genObj?.nombre || '';

			return `${selectedBrand} ${familyName} ${genName} ${modelName}`.trim();
		};

		if (modelosData.length === 1) {
			// Auto-select if only one model in generation
			const modelo = modelosData[0];
			const fullString = constructProcessorString(modelo.nombre);
			// Avoid infinite loop if value is already correct
			if (value !== fullString) {
				onChange(fullString);
			}
		} else if (selectedModelId) {
			// Select specific model
			const modelo = modelosData.find((m) => m.id === selectedModelId);
			if (modelo) {
				const fullString = constructProcessorString(modelo.nombre);
				if (value !== fullString) {
					onChange(fullString);
				}
			}
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedGenerationId,
		selectedModelId,
		modelosData,
		familiasData,
		generacionesData,
		onChange,
		value,
	]);

	// --- Manual Mode State ---
	const [isManualMode, setIsManualMode] = useState(false);

	// --- Handlers ---
	const handleBrandChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;
		setSelectedBrand((option?.value as MarcaProcesador) || null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
		setIsManualMode(false);
	};

	const handleFamilyChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;
		setSelectedFamilyId(option?.value || null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleGenerationChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;
		setSelectedGenerationId(option?.value || null);
		setSelectedModelId(null);
	};

	const handleModelChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;
		setSelectedModelId(option?.value || null);
	};

	// --- Brand Color Logic ---
	const getBrandColor = (text: string) => {
		const lower = text.toLowerCase();
		if (lower.includes('intel')) return 'blue';
		if (lower.includes('amd') || lower.includes('ryzen')) return 'orange';
		return 'gray'; // Default
	};

	const brandColor = getBrandColor(value || '');

	// Dynamic classes based on brand
	const colorClasses = {
		blue: {
			border: 'border-blue-200 dark:border-blue-800',
			bg: 'bg-blue-50 dark:bg-blue-900/10',
			text: 'text-blue-700 dark:text-blue-300',
			badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
			button: 'bg-blue-600 hover:bg-blue-700 text-white',
			ring: 'ring-blue-500',
		},
		orange: {
			border: 'border-orange-200 dark:border-orange-800',
			bg: 'bg-orange-50 dark:bg-orange-900/10',
			text: 'text-orange-700 dark:text-orange-300',
			badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
			button: 'bg-orange-600 hover:bg-orange-700 text-white',
			ring: 'ring-orange-500',
		},
		gray: {
			border: 'border-zinc-200 dark:border-zinc-700',
			bg: 'bg-zinc-50 dark:bg-zinc-800/50',
			text: 'text-zinc-700 dark:text-zinc-300',
			badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
			button: 'bg-zinc-600 hover:bg-zinc-700 text-white',
			ring: 'ring-zinc-500',
		},
	}[brandColor];

	// Determine if current value comes from Quick Select (simple matching)
	const isQuickSelected = (optValue: string) => value === optValue;

	const handleQuickSelect = (val: string) => {
		onChange(val);
		setIsManualMode(false);
		// Reset dropdowns nicely
		setSelectedBrand(null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	return (
		<div
			className={`flex flex-col gap-6 rounded-xl border p-4 transition-all duration-300 ${colorClasses.border} ${colorClasses.bg}`}>
			{/* 1. Result Preview Banner */}
			<div
				className={`flex items-center justify-between rounded-lg border p-4 shadow-sm ${colorClasses.border} bg-white dark:bg-zinc-900`}>
				<div>
					<span className='mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400'>
						Procesador Seleccionado
					</span>
					<div className={`text-lg font-bold ${colorClasses.text}`}>
						{value || 'Seleccione un procesador...'}
					</div>
				</div>
				{value && (
					<div
						className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${colorClasses.badge}`}>
						{brandColor === 'gray' ? 'Genérico' : brandColor.toUpperCase()}
					</div>
				)}
			</div>

			{/* 2. Quick Select Buttons */}
			<div>
				<div className='mb-3 flex items-center justify-between'>
					<label className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
						Selección Rápida
					</label>

					{/* Toggle Manual Mode Button */}
					<button
						type='button'
						onClick={() => {
							setIsManualMode(!isManualMode);
							// Reset dropdowns if switching to manual to avoid confusion? No, keep context.
						}}
						className={`text-xs font-medium underline transition-colors ${
							isManualMode
								? 'text-red-500 hover:text-red-400'
								: 'text-zinc-500 hover:text-zinc-400'
						}`}>
						{isManualMode ? 'Cancelar ingreso manual' : '¿No está en la lista?'}
					</button>
				</div>

				{!isManualMode && (
					<div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6'>
						{QUICK_OPTIONS.map((opt) => (
							<SelectionCard
								key={opt.value}
								label={opt.label}
								value={opt.value}
								isSelected={isQuickSelected(opt.value)}
								onClick={() => !readOnly && handleQuickSelect(opt.value)}
								variant='compact'
								color={
									isQuickSelected(opt.value)
										? brandColor === 'orange'
											? 'orange'
											: 'blue'
										: 'gray'
								}
								className='text-xs'
							/>
						))}
					</div>
				)}
			</div>

			{/* 3. Advanced Selection Area */}
			<div
				className={`transition-all duration-300 ${isManualMode ? 'opacity-100' : 'opacity-100'}`}>
				{isManualMode ? (
					<div className='animate-in fade-in slide-in-from-top-2 duration-300'>
						<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Ingreso Manual
						</label>
						<Input
							name='processor-manual'
							value={value || ''}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onChange(e.target.value)
							}
							placeholder='Ej: Intel Core 2 Duo E8400...'
							disabled={readOnly}
							className={`w-full focus:ring-2 ${colorClasses.ring}`}
							autoFocus
						/>
						<p className='mt-2 text-xs text-zinc-500'>
							Escriba marca, familia y modelo (ej: <code>Check Point 15600</code> o{' '}
							<code>Intel Xeon E5-2600</code>).
						</p>
					</div>
				) : (
					<div className='relative'>
						{/* Divider with Text */}
						<div className='relative mb-6 flex items-center'>
							<div className='flex-grow border-t border-zinc-200 dark:border-zinc-700'></div>
							<span className='mx-4 flex-shrink-0 text-xs font-semibold text-zinc-400'>
								O Configuración Detallada
							</span>
							<div className='flex-grow border-t border-zinc-200 dark:border-zinc-700'></div>
						</div>

						{/* Dropdowns Grid */}
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							{/* 1. Marca */}
							<div>
								<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
									1. Marca
								</label>
								<SelectReact
									name='processor-brand'
									options={brandOptions}
									value={
										brandOptions.find((o) => o.value === selectedBrand) || null
									}
									onChange={handleBrandChange}
									placeholder='Seleccionar...'
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
									value={
										familyOptions.find((o) => o.value === selectedFamilyId) ||
										null
									}
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
										generationOptions.find(
											(o) => o.value === selectedGenerationId,
										) || null
									}
									onChange={handleGenerationChange}
									placeholder='Generación...'
									isDisabled={readOnly || !selectedFamilyId}
								/>
							</div>

							{/* 4. Modelo */}
							{shouldShowModelSelect && (
								<div>
									<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
										4. Modelo
									</label>
									<SelectReact
										name='processor-model'
										options={modelOptions}
										value={
											modelOptions.find((o) => o.value === selectedModelId) ||
											null
										}
										onChange={handleModelChange}
										placeholder='Modelo Exacto...'
										isDisabled={readOnly || !selectedGenerationId}
									/>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
