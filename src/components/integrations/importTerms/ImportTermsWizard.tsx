/**
 * Asistente reutilizable para importar términos (categorías/marcas) desde
 * WooCommerce hacia el ERP. Un único endpoint trae ambas taxonomías, por lo
 * que el wizard deja elegir cuáles importar y se usa indistintamente desde
 * la página de integraciones, Categorías y Marcas.
 */

import React, { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import type { WooTaxonomy } from '@/types/integrations.types';
import { useImportTerms } from './useImportTerms';

interface TaxonomyOption {
	value: WooTaxonomy;
	label: string;
	description: string;
}

const TAXONOMY_OPTIONS: TaxonomyOption[] = [
	{
		value: 'categories',
		label: 'Categorías',
		description: 'Trae las categorías de productos de la tienda.',
	},
	{
		value: 'brands',
		label: 'Marcas',
		description: 'Trae las marcas de productos de la tienda.',
	},
];

interface ImportTermsWizardProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	/** Se invoca al completar la importación (p. ej. refrescar la grilla). */
	onCompleted?: () => void;
	/** Taxonomías marcadas por defecto al abrir. Por defecto, ambas. */
	defaultTaxonomies?: WooTaxonomy[];
}

const ImportTermsWizard: React.FC<ImportTermsWizardProps> = ({
	isOpen,
	setIsOpen,
	onCompleted,
	defaultTaxonomies,
}) => {
	const { phase, isRunning, progress, error, canImport, launch, reset } = useImportTerms({
		onCompleted,
	});

	const buildInitialSelection = useMemo(() => {
		const defaults = defaultTaxonomies ?? ['categories', 'brands'];
		return TAXONOMY_OPTIONS.reduce<Record<WooTaxonomy, boolean>>(
			(acc, option) => {
				acc[option.value] = defaults.includes(option.value);
				return acc;
			},
			{ categories: false, brands: false },
		);
	}, [defaultTaxonomies]);

	const [selected, setSelected] = useState<Record<WooTaxonomy, boolean>>(buildInitialSelection);

	// Reinicia selección y estado cada vez que se abre el asistente.
	useEffect(() => {
		if (isOpen) {
			setSelected(buildInitialSelection);
			reset();
		}
	}, [isOpen, buildInitialSelection, reset]);

	const selectedTaxonomies = useMemo(
		() => TAXONOMY_OPTIONS.filter((opt) => selected[opt.value]).map((opt) => opt.value),
		[selected],
	);

	const handleToggle = (taxonomy: WooTaxonomy) => {
		setSelected((prev) => ({ ...prev, [taxonomy]: !prev[taxonomy] }));
	};

	const handleClose: Dispatch<SetStateAction<boolean>> = (value) => {
		// No permitir cerrar mientras hay un lote en curso.
		if (isRunning) return;
		setIsOpen(value);
	};

	const handleLaunch = () => {
		void launch(selectedTaxonomies);
	};

	const canLaunch = canImport && selectedTaxonomies.length > 0 && !isRunning;

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='md' isStaticBackdrop={isRunning}>
			<ModalHeader>
				<Icon icon='HeroArrowDownTray' className='text-indigo-500' />
				<span>Importar desde WooCommerce</span>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					Programa la importación masiva de categorías y marcas desde la tienda hacia el
					ERP. La operación se ejecuta en segundo plano y puede tardar unos minutos.
				</p>

				{!canImport && (
					<div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'>
						No hay una subsidiaria activa. Selecciona una sucursal para poder importar.
					</div>
				)}

				<div className='space-y-2'>
					<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
						¿Qué deseas importar?
					</p>
					{TAXONOMY_OPTIONS.map((option) => (
						<div
							key={option.value}
							className='flex items-start gap-2 rounded-md border border-zinc-100 p-2 dark:border-white/5'>
							<Checkbox
								id={`import-term-${option.value}`}
								checked={selected[option.value]}
								onChange={() => handleToggle(option.value)}
								disabled={isRunning}
								dimension='sm'
								label={
									<span className='flex flex-col'>
										<span className='font-medium'>{option.label}</span>
										<span className='text-xs text-zinc-500 dark:text-zinc-400'>
											{option.description}
										</span>
									</span>
								}
							/>
						</div>
					))}
				</div>

				{(isRunning || phase === 'finished' || phase === 'failed') && (
					<div className='space-y-2 rounded-md bg-zinc-100 p-3 dark:bg-zinc-800'>
						<div className='flex items-center justify-between text-sm'>
							<span className='font-medium text-zinc-700 dark:text-zinc-200'>
								{phase === 'launching' && 'Encolando importación…'}
								{phase === 'polling' && 'Descargando términos de WooCommerce…'}
								{phase === 'finished' && '✅ Importación completada'}
								{phase === 'failed' && '❌ La importación falló'}
							</span>
							{(isRunning || phase === 'finished') && (
								<span className='text-xs text-zinc-500 dark:text-zinc-400'>
									{phase === 'finished' ? 100 : progress}%
								</span>
							)}
						</div>
						<div className='h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'>
							<div
								className={`h-full rounded-full transition-all duration-300 ${
									phase === 'failed' ? 'bg-rose-500' : 'bg-indigo-500'
								}`}
								style={{ width: `${phase === 'finished' ? 100 : progress}%` }}
							/>
						</div>
						{phase === 'failed' && (
							<p className='text-xs text-rose-600 dark:text-rose-300'>
								{error ??
									'El proceso del servidor terminó con error. Revisa los jobs fallidos / logs del backend.'}
							</p>
						)}
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button
						variant='outline'
						icon='HeroXMark'
						onClick={() => setIsOpen(false)}
						isDisable={isRunning}>
						{phase === 'finished' ? 'Cerrar' : 'Cancelar'}
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='indigo'
						icon='HeroArrowDownTray'
						onClick={handleLaunch}
						isDisable={!canLaunch}>
						{isRunning ? 'Importando…' : 'Importar'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ImportTermsWizard;
