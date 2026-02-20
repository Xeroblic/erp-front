import React, { useState, useEffect, useMemo } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
// Using react-icons equivalents for requested Lucide icons
import { LuMonitor, LuTerminal, LuBox,  LuCpu } from 'react-icons/lu';
import { SiApple } from 'react-icons/si';

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
	const [selectedBrand, setSelectedBrand] = useState<MarcaSistema | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
	const [customEditionText, setCustomEditionText] = useState<string>('');

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

	// Dropdown Logic
	const marcasData = getMarcas();
	const brandOptions: TSelectOption[] = marcasData.map((m) => ({
		value: m.nombre,
		label: m.nombre,
	}));
	const familiasData = selectedBrand ? getFamiliasPorMarca(selectedBrand) : [];
	const familyOptions: TSelectOption[] = familiasData.map((f) => ({
		value: f.id,
		label: f.nombre,
	}));
	const shouldShowFamilySelect = familiasData.length > 1;

	// Auto-select family if only one
	useEffect(() => {
		if (selectedBrand && familiasData.length === 1 && !selectedFamilyId) {
			setSelectedFamilyId(familiasData[0].id);
		}
	}, [selectedBrand, familiasData, selectedFamilyId]);

	const versionesData =
		selectedBrand && selectedFamilyId
			? getVersionesPorFamilia(selectedBrand, selectedFamilyId)
			: [];
	const versionOptions: TSelectOption[] = versionesData.map((v) => ({
		value: v.id,
		label: v.año ? `${v.nombre} (${v.año})` : v.nombre,
	}));

	const edicionesData =
		selectedBrand && selectedFamilyId && selectedVersionId
			? getEdicionesPorVersion(selectedBrand, selectedFamilyId, selectedVersionId)
			: [];

	const editionOptions: TSelectOption[] = edicionesData.map((ed) => ({
		value: ed.id,
		label: ed.nombre,
	}));

	if (edicionesData.length > 0) {
		editionOptions.push({ value: 'custom_edition', label: 'Otra (Especificar)' });
	}

	const shouldShowEditionSelect = edicionesData.length > 1 || editionOptions.length > 1;

	useEffect(() => {
		if (selectedEditionId !== 'custom_edition') {
			setCustomEditionText('');
		}
	}, [selectedEditionId]);

	// Construction Logic
	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedVersionId) return;

		const version = versionesData.find((v) => v.id === selectedVersionId);
		if (!version) return;

		const setOS = (editionName: string) => {
			let text = `${version.nombre} ${editionName}`;
			if (['Standard', 'Base'].includes(editionName)) {
				text = version.nombre;
			}
			onChange(text);
		};

		if (selectedEditionId === 'custom_edition') {
			if (customEditionText.trim()) {
				setOS(customEditionText);
			} else {
				onChange(version.nombre);
			}
		} else if (selectedEditionId) {
			const ed = edicionesData.find((e) => e.id === selectedEditionId);
			if (ed) setOS(ed.nombre);
		} else if (edicionesData.length === 1 && !shouldShowEditionSelect) {
			setOS(edicionesData[0].nombre);
		} else if (!selectedEditionId && edicionesData.length === 0) {
			onChange(version.nombre);
		}
	}, [
		selectedBrand,
		selectedFamilyId,
		selectedVersionId,
		selectedEditionId,
		customEditionText,
		versionesData,
		edicionesData,
		onChange,
		shouldShowEditionSelect,
	]);

	return (
		<div className='flex flex-col gap-6'>
			{/* 1. SELECCIÓN RÁPIDA (Con Iconos) */}
			<div>
				<div className='mb-3 flex items-center gap-2'>
					{/* <LuCheckCircle2 className='h-4 w-4 text-emerald-500' /> */}
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
							onClick={() => !readOnly && onChange(opt.value)}
							variant='compact'
							className='text-xs transition-all hover:border-blue-400 active:scale-95'
						/>
					))}
				</div>
			</div>

			{/* DIVIDER MEJORADO */}
			<div className='relative flex items-center py-2'>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-800'></div>
				<span className='mx-4 flex-shrink-0 bg-white px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:bg-[#09090b]'>
					O Configuración Manual
				</span>
				<div className='flex-grow border-t border-zinc-200 dark:border-zinc-800'></div>
			</div>

			{/* 2. SELECTOR AVANZADO (Caja dinámica) */}
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
							Fabricante
						</label>
						<SelectReact
							name='so-brand'
							options={brandOptions}
							value={brandOptions.find((o) => o.value === selectedBrand) || null}
							onChange={(v) => {
								const option = v as TSelectOption | null;
								setSelectedBrand((option?.value as MarcaSistema) || null);
								setSelectedFamilyId(null);
								setSelectedVersionId(null);
								setSelectedEditionId(null);
							}}
							placeholder='Ej: Microsoft'
							isDisabled={readOnly}
						/>
					</div>

					{/* Versión (Dinámica) */}
					<div>
						<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
							<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
								2
							</span>
							Versión
						</label>
						<SelectReact
							name='so-version'
							options={versionOptions}
							value={
								versionOptions.find((o) => o.value === selectedVersionId) || null
							}
							onChange={(v) => {
								const option = v as TSelectOption | null;
								setSelectedVersionId(option?.value || null);
								setSelectedEditionId(null);
							}}
							placeholder='Selecciona...'
							isDisabled={readOnly || !selectedBrand}
						/>
					</div>

					{/* Edición / Custom (Full width) */}
					{shouldShowEditionSelect && (
						<div className='pt-2 sm:col-span-full'>
							<label className='mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
								<span className='flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-700'>
									3
								</span>
								Edición específica
							</label>
							<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
								<SelectReact
									name='so-edition'
									options={editionOptions}
									value={
										editionOptions.find((o) => o.value === selectedEditionId) ||
										null
									}
									onChange={(v) => {
										const option = v as TSelectOption | null;
										setSelectedEditionId(option?.value || null);
									}}
									placeholder='Edición...'
									isDisabled={readOnly || !selectedVersionId}
								/>
								{selectedEditionId === 'custom_edition' && (
									<Input
										name='so-custom-edition'
										value={customEditionText}
										onChange={(e) => setCustomEditionText(e.target.value)}
										placeholder='Escribe la edición...'
										disabled={readOnly}
										className='animate-in fade-in slide-in-from-left-2 duration-300'
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 3. VISUALIZADOR FINAL (El "Donde aparece el SO") */}
			{value && (
				<div className='animate-pulse-slow flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-white/5'>
					<span className='ml-2 text-[10px] font-bold uppercase text-zinc-400'>
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
