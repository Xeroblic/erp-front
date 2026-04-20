import React, { useState, useEffect } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import { SelectionCard } from '@/pages/refactor-technical-review/components/ui/SelectionCard';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchBrands, createBrand } from '@/store/slices/brands/brandsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import toast from '@/utils/toast.utils';
import Button from '@/components/ui/Button';
import {
	PROCESADORES_DATA,
	TipoDispositivo,
	MarcaProcesador,
	getMarcasPorDispositivo,
	getFamiliasPorMarcaYDispositivo,
	getGeneracionesPorFamilia,
	getModelosPorGeneracion,
	Generacion,
	ModeloProcesador,
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

// --- Helper Functions ---
const cleanLabel = (text: string) => {
	// Remove content in parentheses, e.g., "12ª Gen (Alder Lake)" -> "12ª Gen"
	return text.replace(/\s*\(.*?\)\s*/g, '').trim();
};

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

	// --- Granular Manual Mode States ---
	const [isFamilyManual, setIsFamilyManual] = useState(false);
	const [isGenerationManual, setIsGenerationManual] = useState(false);
	const [isModelManual, setIsModelManual] = useState(false);

	// Custom inputs for manual mode
	const [customFamily, setCustomFamily] = useState('');
	const [customGeneration, setCustomGeneration] = useState('');
	const [customModel, setCustomModel] = useState('');

	// Redux State & Brand Management
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const { items: globalBrands } = useAppSelector((state) => state.brands);
	const [isCreatingBrand, setIsCreatingBrand] = useState(false);

	useEffect(() => {
		if (branchId && globalBrands.length === 0) {
			dispatch(fetchBrands({ branchId, search: '' }));
		}
	}, [branchId, globalBrands.length, dispatch]);


	// --- Initialization Effect: Parse value to set internal state ---
	useEffect(() => {
		// Only run if we have a value but no internal state selected (avoid overwriting user interaction)
		if (!value || selectedBrand) return;

		const valueLower = value.toLowerCase();
		const marcas = getMarcasPorDispositivo(deviceType);

		// 1. Find Brand (Intel / AMD)
		const foundBrandData = marcas.find((m) => valueLower.includes(m.nombre.toLowerCase()));
		if (!foundBrandData) return;

		// 2. Find Family
		const families = getFamiliasPorMarcaYDispositivo(deviceType, foundBrandData.nombre);
		// Sort by length desc to match "Core i7" before "Core i" if overlapping
		const sortedFamilies = [...families].sort((a, b) => b.nombre.length - a.nombre.length);

		let foundFamilyData: any = null;
		let foundGenData: any = null;
		let foundModelData: any = null;

		for (const fam of sortedFamilies) {
			const cleanFam = cleanLabel(fam.nombre).toLowerCase();
			if (valueLower.includes(cleanFam)) {
				foundFamilyData = fam;

				// 3. Find Generation
				const gens = getGeneracionesPorFamilia(deviceType, foundBrandData.nombre, fam.id);
				for (const gen of gens) {
					const cleanGen = cleanLabel(gen.nombre).toLowerCase();
					// Make generation matching stricter? Or just includes
					if (valueLower.includes(cleanGen)) {
						foundGenData = gen;

						// 4. Find Model
						const models = getModelosPorGeneracion(
							deviceType,
							foundBrandData.nombre,
							fam.id,
							gen.id,
						);
						for (const model of models) {
							const cleanModel = cleanLabel(model.nombre).toLowerCase();
							// Models usually at end, simple check
							if (valueLower.includes(cleanModel)) {
								foundModelData = model;
								break;
							}
						}
						if (foundModelData) break;
					}
				}
				if (foundGenData) break;
			}
		}

		// Apply found state without triggering change events
		// We use batch updates or just sequential setters
		if (foundBrandData) setSelectedBrand(foundBrandData.nombre);
		if (foundFamilyData) setSelectedFamilyId(foundFamilyData.id);
		if (foundGenData) setSelectedGenerationId(foundGenData.id);
		if (foundModelData) setSelectedModelId(foundModelData.id);
	}, [value, deviceType, selectedBrand]); // Dependency on selectedBrand ensures it runs only on initial mount or full reset

	// Reset dropdowns when device type changes
	useEffect(() => {
		setSelectedBrand(null);
		resetDownstreamFromBrand();
	}, [deviceType]);

	const resetDownstreamFromBrand = () => {
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);

		setIsFamilyManual(false);
		setIsGenerationManual(false);
		setIsModelManual(false);

		setCustomFamily('');
		setCustomGeneration('');
		setCustomModel('');
	};

	// --- Handlers ---
	const handleBrandChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		setSelectedBrand((option?.value as MarcaProcesador) || null);
		resetDownstreamFromBrand();
	};

	const handleCreateBrand = async (inputValue: string) => {
		if (!inputValue.trim() || !branchId) {
			if (!inputValue.trim()) toast.error('Ingrese un nombre para la marca');
			return;
		}

		try {
			setIsCreatingBrand(true);
			const result = await dispatch(
				createBrand({ branchId, data: { name: inputValue.trim(), is_active: true } })
			).unwrap();

			toast.success('Marca creada exitosamente');
			
			setSelectedBrand(result.name as MarcaProcesador);
			resetDownstreamFromBrand();
		} catch (error: any) {
			toast.error(error || 'Error al crear la marca');
		} finally {
			setIsCreatingBrand(false);
		}
	};

	const handleFamilyChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		if (option?.value === 'MANUAL_ENTRY') {
			setIsFamilyManual(true);
			setCustomFamily('');
			setSelectedFamilyId(null);
			// Reset downstream
			setSelectedGenerationId(null);
			setSelectedModelId(null);
			return;
		}

		setSelectedFamilyId(option?.value || null);
		setIsFamilyManual(false);
		setCustomFamily('');
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleGenerationChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		if (option?.value === 'MANUAL_ENTRY') {
			setIsGenerationManual(true);
			setCustomGeneration('');
			setSelectedGenerationId(null);
			setSelectedModelId(null);
			return;
		}

		setSelectedGenerationId(option?.value || null);
		setIsGenerationManual(false);
		setCustomGeneration('');
		setSelectedModelId(null);
	};

	const handleModelChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		if (option?.value === 'MANUAL_ENTRY') {
			setIsModelManual(true);
			setCustomModel('');
			setSelectedModelId(null);
			return;
		}

		setSelectedModelId(option?.value || null);
		setIsModelManual(false);
		setCustomModel('');
	};

	const getAllGenerationsForBrand = (brand: MarcaProcesador): Generacion[] => {
		const families = getFamiliasPorMarcaYDispositivo(deviceType, brand);
		const allGens = families.flatMap((f) => f.generaciones);
		const uniqueGens = new Map<string, Generacion>();
		allGens.forEach((g) => uniqueGens.set(g.id, g));
		return Array.from(uniqueGens.values());
	};

	// --- Derived Data for Dropdowns ---
	const marcasData = getMarcasPorDispositivo(deviceType);

	// Manual Entry Option
	const manualOption: TSelectOption = {
		value: 'MANUAL_ENTRY',
		label: 'Ingresar manualmente / Otro...',
	};

	// Merge local known brands with global API brands
	const mergedBrandNames = Array.from(
		new Set([
			...marcasData.map((m) => m.nombre),
			...globalBrands.map((b) => b.name)
		])
	).sort();

	const brandOptions: TSelectOption[] = mergedBrandNames.map((nombre) => ({
		value: nombre,
		label: nombre,
	}));

	const familiasData = selectedBrand
		? getFamiliasPorMarcaYDispositivo(deviceType, selectedBrand)
		: [];
	const familyOptions: TSelectOption[] = [
		manualOption,
		...familiasData.map((familia) => ({
			value: familia.id,
			label: cleanLabel(familia.nombre),
		})),
	];

	// Generations logic
	let generacionesToShow: { id: string; nombre: string; modelos: ModeloProcesador[] }[] = [];
	if (selectedBrand) {
		if (!isFamilyManual && selectedFamilyId) {
			generacionesToShow = getGeneracionesPorFamilia(
				deviceType,
				selectedBrand,
				selectedFamilyId,
			);
		} else if (isFamilyManual || !selectedFamilyId) {
			// Show all generations for the brand if family is manual
			generacionesToShow = getAllGenerationsForBrand(selectedBrand);
		}
	}
	const generationOptions: TSelectOption[] = [
		manualOption,
		...generacionesToShow.map((gen) => ({
			value: gen.id,
			label: cleanLabel(gen.nombre),
		})),
	];

	// Models logic
	let modelosToShow: { id: string; nombre: string }[] = [];
	if (selectedBrand) {
		// If we have specific gen selected (regardless of family state), show its models
		if (selectedGenerationId) {
			// We need to find the generation object. It might be in the filtered list or global list
			const genObj = generacionesToShow.find((g) => g.id === selectedGenerationId);
			if (genObj) {
				modelosToShow = genObj.modelos;
			}
		}
	}
	const modelOptions: TSelectOption[] = [
		manualOption,
		...modelosToShow.map((modelo) => ({
			value: modelo.id,
			label: cleanLabel(modelo.nombre),
		})),
	];

	const shouldShowModelSelect = true;

	// --- Auto-construct Value Logic ---
	useEffect(() => {
		if (!selectedBrand) return;

		// We construct string from all pieces
		const brandStr = selectedBrand || '';

		const familyStr = isFamilyManual
			? customFamily
			: familiasData.find((f) => f.id === selectedFamilyId)?.nombre || '';

		const genStr = isGenerationManual
			? customGeneration
			: generacionesToShow.find((g) => g.id === selectedGenerationId)?.nombre || '';

		const modelStr = isModelManual
			? customModel
			: modelosToShow.find((m) => m.id === selectedModelId)?.nombre || '';

		// Filter out empty strings
		const parts = [brandStr, familyStr, genStr, modelStr].filter(
			(p) => p && p.trim().length > 0,
		);
		const fullString = parts.join(' ');

		// Avoid infinite updates
		if (value !== fullString && fullString.trim().length > 0) {
			onChange(fullString);
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedGenerationId,
		selectedModelId,
		isFamilyManual,
		isGenerationManual,
		isModelManual,
		customFamily,
		customGeneration,
		customModel,
		familiasData,
		generacionesToShow,
		modelosToShow,
		onChange,
		value,
	]);

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
		// Reset dropdowns nicely first to prevent useEffect from overwriting
		setSelectedBrand(null);
		resetDownstreamFromBrand();

		// Force update value
		onChange(val);
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
				</div>

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
			</div>

			{/* 3. Advanced Selection Area */}
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
							value={brandOptions.find((o) => o.value === selectedBrand) || null}
							onChange={handleBrandChange}
							placeholder='Seleccionar o crear...'
							isDisabled={readOnly || isCreatingBrand}
							isCreatable={true}
							onCreateOption={handleCreateBrand}
							isLoading={isCreatingBrand}
						/>
					</div>

					{/* 2. Familia */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							2. Familia
						</label>
						{!isFamilyManual ? (
							<SelectReact
								name='processor-family'
								options={familyOptions}
								value={
									familyOptions.find((o) => o.value === selectedFamilyId) || null
								}
								onChange={handleFamilyChange}
								placeholder='Serie...'
								isDisabled={readOnly || !selectedBrand}
							/>
						) : (
							<div className='relative'>
								<Input
									name='custom-family'
									value={customFamily}
									onChange={(e) => setCustomFamily(e.target.value)}
									placeholder='Escriba familia...'
									className='w-full pr-8'
									autoFocus
								/>
								<button
									type='button'
									onClick={() => {
										setIsFamilyManual(false);
										setCustomFamily('');
										setSelectedFamilyId(null);
									}}
									className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500'
									title='Volver a lista'>
									✕
								</button>
							</div>
						)}
					</div>

					{/* 3. Generación */}
					<div>
						<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
							3. Generación
						</label>
						{!isGenerationManual ? (
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
								isDisabled={
									readOnly ||
									(!selectedFamilyId && !isFamilyManual && !selectedBrand)
								}
							/>
						) : (
							<div className='relative'>
								<Input
									name='custom-generation'
									value={customGeneration}
									onChange={(e) => setCustomGeneration(e.target.value)}
									placeholder='Escriba generación...'
									className='w-full pr-8'
									autoFocus
								/>
								<button
									type='button'
									onClick={() => {
										setIsGenerationManual(false);
										setCustomGeneration('');
										setSelectedGenerationId(null);
									}}
									className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500'
									title='Volver a lista'>
									✕
								</button>
							</div>
						)}
					</div>

					{/* 4. Modelo */}
					{shouldShowModelSelect && (
						<div>
							<label className='mb-1.5 block text-xs font-medium text-zinc-500'>
								4. Modelo
							</label>
							{!isModelManual ? (
								<SelectReact
									name='processor-model'
									options={modelOptions}
									value={
										modelOptions.find((o) => o.value === selectedModelId) ||
										null
									}
									onChange={handleModelChange}
									placeholder='Modelo Exacto...'
									isDisabled={
										readOnly || (!selectedGenerationId && !isGenerationManual)
									}
								/>
							) : (
								<div className='relative'>
									<Input
										name='custom-model'
										value={customModel}
										onChange={(e) => setCustomModel(e.target.value)}
										placeholder='Escriba modelo...'
										className='w-full pr-8'
										autoFocus
									/>
									<button
										type='button'
										onClick={() => {
											setIsModelManual(false);
											setCustomModel('');
											setSelectedModelId(null);
										}}
										className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500'
										title='Volver a lista'>
										✕
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
