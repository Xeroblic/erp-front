import React, { useState, useEffect } from 'react';
import type { SingleValue, MultiValue } from 'react-select';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import {
	PROCESADORES_DATA,
	TipoDispositivo,
	MarcaProcesador,
	getMarcasPorDispositivo,
	getFamiliasPorMarcaYDispositivo,
	getGeneracionesPorFamilia,
	getModelosPorGeneracion,
} from '../constants/Procesadores';

interface ProcessorSelectorProps {
	deviceType: TipoDispositivo;
	value?: string;
	onChange: (processorText: string) => void;
	disabled?: boolean;
}

export const ProcessorSelector: React.FC<ProcessorSelectorProps> = ({
	deviceType,
	value,
	onChange,
	disabled = false,
}) => {
	const [selectedBrand, setSelectedBrand] = useState<MarcaProcesador | null>(null);
	const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
	const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
	const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

	useEffect(() => {
		setSelectedBrand(null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	}, [deviceType]);

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
			? getModelosPorGeneracion(deviceType, selectedBrand, selectedFamilyId, selectedGenerationId)
			: [];
	const modelOptions: TSelectOption[] = modelosData.map((modelo) => ({
		value: modelo.id,
		label: modelo.descripcion ? `${modelo.nombre} - ${modelo.descripcion}` : modelo.nombre,
	}));

	const shouldShowModelSelect = modelosData.length > 1;

	useEffect(() => {
		if (!selectedBrand || !selectedFamilyId || !selectedGenerationId) {
			return;
		}

		const familia = familiasData.find((f) => f.id === selectedFamilyId);
		const generacion = generacionesData.find((g) => g.id === selectedGenerationId);

		if (!familia || !generacion) return;

		if (modelosData.length === 1) {
			const modelo = modelosData[0];
			const processorText = `${modelo.nombre}`;
			onChange(processorText);
			return;
		}

		if (selectedModelId) {
			const modelo = modelosData.find((m) => m.id === selectedModelId);
			if (modelo) {
				const processorText = `${modelo.nombre}`;
				onChange(processorText);
			}
		}
	}, [selectedBrand, selectedFamilyId, selectedGenerationId, selectedModelId, modelosData, familiasData, generacionesData]);

	const handleBrandChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedBrand((option?.value as MarcaProcesador) || null);
		setSelectedFamilyId(null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleFamilyChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedFamilyId(option?.value || null);
		setSelectedGenerationId(null);
		setSelectedModelId(null);
	};

	const handleGenerationChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedGenerationId(option?.value || null);
		setSelectedModelId(null);
	};

	const handleModelChange = (newValue: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null) => {
		const option = newValue as TSelectOption | null;
		setSelectedModelId(option?.value || null);
	};

	return (
		<div className='space-y-3'>
			<div>
				<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
					1. Marca
				</label>
				<SelectReact
					name='processor-brand'
					options={brandOptions}
					value={brandOptions.find((o) => o.value === selectedBrand) || null}
					onChange={handleBrandChange}
					placeholder='Intel o AMD'
					isDisabled={disabled}
				/>
			</div>

			{selectedBrand && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						2. Familia de Procesador
					</label>
					<SelectReact
						name='processor-family'
						options={familyOptions}
						value={familyOptions.find((o) => o.value === selectedFamilyId) || null}
						onChange={handleFamilyChange}
						placeholder='Ej: Core i7, Ryzen 5'
						isDisabled={disabled}
					/>
				</div>
			)}

			{selectedFamilyId && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						3. Generación
					</label>
					<SelectReact
						name='processor-generation'
						options={generationOptions}
						value={generationOptions.find((o) => o.value === selectedGenerationId) || null}
						onChange={handleGenerationChange}
						placeholder='Ej: 13ª Gen, Serie 7000'
						isDisabled={disabled}
					/>
				</div>
			)}

			{selectedGenerationId && shouldShowModelSelect && (
				<div>
					<label className='mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'>
						4. Modelo Específico
					</label>
					<SelectReact
						name='processor-model'
						options={modelOptions}
						value={modelOptions.find((o) => o.value === selectedModelId) || null}
						onChange={handleModelChange}
						placeholder='Ej: i7-14700K, Ryzen 7 7800X3D'
						isDisabled={disabled}
					/>
				</div>
			)}

			{value && (
				<div className='rounded-md bg-blue-50 p-2 dark:bg-blue-900/20'>
					<p className='text-xs font-medium text-blue-800 dark:text-blue-300'>
						Procesador seleccionado:
					</p>
					<p className='font-semibold text-blue-900 dark:text-blue-200'>{value}</p>
				</div>
			)}
		</div>
	);
};
