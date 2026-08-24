import React, { useState, useEffect, useMemo } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import { LuMonitor, LuTerminal, LuBox, LuCpu } from 'react-icons/lu';
import { SiApple } from 'react-icons/si';

import Icon from '@/components/icon/Icon';
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

// --- Opción de entrada manual reutilizable ---
const MANUAL_OPTION: TSelectOption = {
	value: 'MANUAL_ENTRY',
	label: 'Ingresar manualmente / Otro...',
};

export const SoSelector: React.FC<SoSelectorProps> = ({ value, onChange, readOnly = false }) => {
	// --- Estados de selección ---
	const [selectedBrand, setSelectedBrand] = useState<MarcaSistema | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);

	// --- Estados de modo manual granular ---
	const [isVersionManual, setIsVersionManual] = useState(false);
	const [isEditionManual, setIsEditionManual] = useState(false);
	const [customVersion, setCustomVersion] = useState('');
	const [customEdition, setCustomEdition] = useState('');

	// --- Colores Dinámicos según la Marca ---
	const brandStyles = useMemo(() => {
		switch (selectedBrand) {
			case 'Microsoft':
				return 'border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10 text-blue-600';
			case 'Apple':
				return 'border-zinc-500/50 bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-600';
			case 'Linux':
				return 'border-orange-500/50 bg-orange-50/30 dark:bg-orange-900/10 text-orange-600';
			case 'Google':
				return 'border-red-500/50 bg-red-50/30 dark:bg-red-900/10 text-red-600';
			default:
				return 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20';
		}
	}, [selectedBrand]);

	const getBrandIcon = () => {
		switch (selectedBrand) {
			case 'Microsoft':
				return <LuMonitor className='h-5 w-5 text-blue-500' />;
			case 'Apple':
				return <SiApple className='h-5 w-5 text-zinc-700 dark:text-zinc-300' />;
			case 'Linux':
				return <LuTerminal className='h-5 w-5 text-orange-500' />;
			case 'Google':
				return <LuCpu className='h-5 w-5 text-red-500' />;
			default:
				return <LuBox className='h-5 w-5 text-zinc-400' />;
		}
	};

	// --- Datos derivados para los dropdowns ---
	const marcasData = getMarcas();
	const brandOptions: TSelectOption[] = marcasData.map((m) => ({
		value: m.nombre,
		label: m.nombre,
	}));

	const familiasData = selectedBrand ? getFamiliasPorMarca(selectedBrand) : [];
	const shouldShowFamilySelect = familiasData.length > 1;

	// Auto-seleccionar familia si solo hay una
	useEffect(() => {
		if (selectedBrand && familiasData.length === 1 && !selectedFamilyId) {
			setSelectedFamilyId(familiasData[0].id);
		}
	}, [selectedBrand, familiasData, selectedFamilyId]);

	const versionesData =
		selectedBrand && selectedFamilyId
			? getVersionesPorFamilia(selectedBrand, selectedFamilyId)
			: [];
	const versionOptions: TSelectOption[] = [
		MANUAL_OPTION,
		...versionesData.map((v) => ({
			value: v.id,
			label: v.año ? `${v.nombre} (${v.año})` : v.nombre,
		})),
	];

	const edicionesData =
		selectedBrand && selectedFamilyId && selectedVersionId
			? getEdicionesPorVersion(selectedBrand, selectedFamilyId, selectedVersionId)
			: [];
	const editionOptions: TSelectOption[] = [
		MANUAL_OPTION,
		...edicionesData.map((ed) => ({
			value: ed.id,
			label: ed.nombre,
		})),
	];

	const shouldShowEditionSelect =
		!isVersionManual && (edicionesData.length > 1 || editionOptions.length > 1);

	// --- Reset helpers ---
	const resetDownstreamFromBrand = () => {
		setSelectedFamilyId(null);
		setSelectedVersionId(null);
		setSelectedEditionId(null);
		setIsVersionManual(false);
		setIsEditionManual(false);
		setCustomVersion('');
		setCustomEdition('');
	};

	const resetDownstreamFromVersion = () => {
		setSelectedEditionId(null);
		setIsEditionManual(false);
		setCustomEdition('');
	};

	// --- Handlers ---
	const handleBrandChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;
		setSelectedBrand((option?.value as MarcaSistema) || null);
		resetDownstreamFromBrand();
	};

	const handleVersionChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		if (option?.value === 'MANUAL_ENTRY') {
			setIsVersionManual(true);
			setCustomVersion('');
			setSelectedVersionId(null);
			resetDownstreamFromVersion();
			return;
		}

		setSelectedVersionId(option?.value || null);
		setIsVersionManual(false);
		setCustomVersion('');
		resetDownstreamFromVersion();
	};

	const handleEditionChange = (
		newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		const option = newValue as TSelectOption | null;

		if (option?.value === 'MANUAL_ENTRY') {
			setIsEditionManual(true);
			setCustomEdition('');
			setSelectedEditionId(null);
			return;
		}

		setSelectedEditionId(option?.value || null);
		setIsEditionManual(false);
		setCustomEdition('');
	};

	// --- Lógica de construcción del valor final ---
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId) return;

		// Obtener nombre de la familia (ej: "Windows", "macOS", "Linux")
		const familiaData = familiasData.find((f) => f.id === selectedFamilyId);
		const familyName = familiaData?.nombre || '';

		// Obtener la parte de versión
		const versionStr = isVersionManual
			? customVersion.trim()
			: versionesData.find((v) => v.id === selectedVersionId)?.nombre || '';

		if (!versionStr) return;

		// Determinar si la versión ya contiene el nombre de la familia
		const versionAlreadyIncludesFamily = familyName
			? versionStr.toLowerCase().includes(familyName.toLowerCase())
			: true;

		// Obtener la parte de edición
		let editionStr = '';
		if (isVersionManual) {
			// En modo versión manual, permitir edición manual también
			editionStr = customEdition.trim();
		} else if (isEditionManual) {
			editionStr = customEdition.trim();
		} else if (selectedEditionId) {
			const ed = edicionesData.find((e) => e.id === selectedEditionId);
			if (ed && !['Standard', 'Base'].includes(ed.nombre)) {
				editionStr = ed.nombre;
			}
		} else if (edicionesData.length === 1 && !shouldShowEditionSelect) {
			const singleEd = edicionesData[0];
			if (!['Standard', 'Base'].includes(singleEd.nombre)) {
				editionStr = singleEd.nombre;
			}
		}

		// Determinar si la versión ya contiene el nombre de la marca
		const versionAlreadyIncludesBrand = selectedBrand
			? versionStr.toLowerCase().includes(selectedBrand.toLowerCase())
			: true;

		// Construir texto final: incluir marca + familia si la versión no las contiene
		const parts = [
			!versionAlreadyIncludesBrand ? selectedBrand : '',
			!versionAlreadyIncludesFamily ? familyName : '',
			versionStr,
			editionStr,
		].filter((p) => p && p.length > 0);
		const fullString = parts.join(' ');

		if (value !== fullString && fullString.trim().length > 0) {
			onChange(fullString);
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedVersionId,
		selectedEditionId,
		isVersionManual,
		isEditionManual,
		customVersion,
		customEdition,
		versionesData,
		edicionesData,
		familiasData,
		onChange,
		value,
		shouldShowEditionSelect,
	]);

	return (
		<div className='flex flex-col gap-6'>
			{/* 1. SELECCIÓN RÁPIDA (Con Iconos) */}
			<div>
				<div className='mb-3 flex items-center gap-2'>
					<Icon
						icon='DuoThunder'
						className='h-4 w-4'
						color='amber'
						colorIntensity='500'
					/>
					<label className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>
						Configuraciones comunes
					</label>
				</div>
				<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
					{OPERATING_SYSTEM_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={value === opt.value}
							onClick={() => {
								if (readOnly) return;
								// Reset estados internos al usar selección rápida
								setSelectedBrand(null);
								resetDownstreamFromBrand();
								onChange(opt.value);
							}}
							variant='compact'
							className='text-xs transition-all hover:border-blue-400 active:scale-95'
						/>
					))}
				</div>
			</div>

			<div className='relative flex items-center py-2'>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-800'></div>
				<span className='mx-4 flex-shrink-0 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:bg-[#09090b]'>
					O Configuración Manual
				</span>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-800'></div>
			</div>

			<div className={`rounded-2xl border p-5 transition-all duration-300 ${brandStyles}`}>
				<div className='mb-5 flex items-center gap-3 border-b border-zinc-200/50 pb-4 dark:border-zinc-700/50'>
					<div className='rounded-lg bg-white p-2 shadow-sm dark:bg-zinc-800'>
						{getBrandIcon()}
					</div>
					<div>
						<h4 className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
							Detalles del Sistema
						</h4>
						<p className='text-[10px] font-medium uppercase text-zinc-500'>
							Define marca, versión y edición
						</p>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
					{/* Marca */}
					<div>
						<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
							<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
								1
							</span>
							<Icon
								icon='DuoLayers'
								className='h-3.5 w-3.5'
								color='zinc'
								colorIntensity='500'
							/>
							Fabricante
						</label>
						<SelectReact
							name='so-brand'
							options={brandOptions}
							value={brandOptions.find((o) => o.value === selectedBrand) || null}
							onChange={handleBrandChange}
							placeholder='Ej: Microsoft'
							isDisabled={readOnly}
						/>
					</div>

					{/* Versión */}
					<div>
						<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
							<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
								2
							</span>
							<Icon
								icon='DuoShieldCheck'
								className='h-3.5 w-3.5'
								color='zinc'
								colorIntensity='500'
							/>
							Versión
						</label>
						{!isVersionManual ? (
							<SelectReact
								name='so-version'
								options={versionOptions}
								value={
									versionOptions.find((o) => o.value === selectedVersionId) ||
									null
								}
								onChange={handleVersionChange}
								placeholder='Selecciona...'
								isDisabled={readOnly || !selectedBrand}
							/>
						) : (
							<div className='relative'>
								<Input
									name='custom-version'
									value={customVersion}
									onChange={(e) => setCustomVersion(e.target.value)}
									placeholder='Escriba la versión...'
									className='w-full pr-8'
									autoFocus
									disabled={readOnly}
								/>
								<button
									type='button'
									onClick={() => {
										setIsVersionManual(false);
										setCustomVersion('');
										setSelectedVersionId(null);
										resetDownstreamFromVersion();
									}}
									className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500'
									title='Volver a lista'>
									✕
								</button>
							</div>
						)}
					</div>

					{/* Edición / Custom (Full width) */}
					{shouldShowEditionSelect && (
						<div className='pt-2 sm:col-span-full'>
							<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
								<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
									3
								</span>
								<Icon
									icon='DuoSelect'
									className='h-3.5 w-3.5'
									color='zinc'
									colorIntensity='500'
								/>
								Edición específica
							</label>
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
								{!isEditionManual ? (
									<SelectReact
										name='so-edition'
										options={editionOptions}
										value={
											editionOptions.find(
												(o) => o.value === selectedEditionId,
											) || null
										}
										onChange={handleEditionChange}
										placeholder='Edición...'
										isDisabled={
											readOnly || (!selectedVersionId && !isVersionManual)
										}
									/>
								) : (
									<div className='relative'>
										<Input
											name='custom-edition'
											value={customEdition}
											onChange={(e) => setCustomEdition(e.target.value)}
											placeholder='Escriba la edición...'
											className='w-full pr-8'
											autoFocus
											disabled={readOnly}
										/>
										<button
											type='button'
											onClick={() => {
												setIsEditionManual(false);
												setCustomEdition('');
												setSelectedEditionId(null);
											}}
											className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500'
											title='Volver a lista'>
											✕
										</button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Input directo cuando modo versión es manual (no hay ediciones de donde elegir) */}
					{isVersionManual && (
						<div className='pt-2 sm:col-span-full'>
							<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
								<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
									3
								</span>
								<Icon
									icon='DuoSelect'
									className='h-3.5 w-3.5'
									color='zinc'
									colorIntensity='500'
								/>
								Edición (opcional)
							</label>
							<div className='relative'>
								<Input
									name='custom-edition-manual'
									value={customEdition}
									onChange={(e) => setCustomEdition(e.target.value)}
									placeholder='Escriba la edición (opcional)...'
									className='w-full'
									disabled={readOnly}
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 3. VISUALIZADOR FINAL (El "Donde aparece el SO") */}
			{value && (
				<div className='flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-white/5'>
					<span className='ml-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-zinc-400'>
						<Icon
							icon='DuoShieldCheck'
							className='h-3.5 w-3.5'
							color='emerald'
							colorIntensity='500'
						/>
						Resultado:
					</span>
					<div className='flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
						<div className='h-2 w-2 rounded-full bg-emerald-500'></div>
						<span className='font-mono text-sm font-bold text-zinc-700 dark:text-zinc-200'>
							{value}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
