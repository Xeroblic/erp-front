/**
 * Modal para deshacer una importación de términos (categorías/marcas) desde WooCommerce.
 * Borra solo los términos que la integración creó y que hoy no están en uso; muestra
 * cuántos se eliminaron y cuántos se omitieron (con el detalle por estar en uso).
 *
 * El endpoint es síncrono (devuelve el resultado al instante, sin batch/polling), así que
 * el modal hace la llamada directa al servicio con estado local.
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
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { undoImportTerms } from '@/services/woocommerceProductsService';
import type { UndoImportTermsResponse, WooTaxonomy } from '@/types/integrations.types';

interface TaxonomyOption {
	value: WooTaxonomy;
	label: string;
	description: string;
}

const TAXONOMY_OPTIONS: TaxonomyOption[] = [
	{
		value: 'categories',
		label: 'Categorías',
		description: 'Elimina las categorías importadas que no estén en uso.',
	},
	{
		value: 'brands',
		label: 'Marcas',
		description: 'Elimina las marcas importadas que no estén en uso.',
	},
];

const REASON_LABEL: Record<string, string> = {
	has_products: 'tiene productos asociados',
	has_children: 'tiene subcategorías',
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

/** Extrae el `message` del backend de un error de axios; cae al genérico si no hay. */
const backendMessage = (error: unknown, fallback: string): string => {
	const data = asRecord(asRecord(asRecord(error)?.response)?.data);
	const message = data?.message;
	if (typeof message === 'string' && message.trim()) return message;
	return error instanceof Error ? error.message : fallback;
};

interface UndoImportTermsModalProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	/** Se invoca tras un undo exitoso (p. ej. refrescar listados de marcas/categorías). */
	onCompleted?: () => void;
}

const UndoImportTermsModal: React.FC<UndoImportTermsModalProps> = ({
	isOpen,
	setIsOpen,
	onCompleted,
}) => {
	const { subsidiaryId } = useCurrentBranch();

	const [selected, setSelected] = useState<Record<WooTaxonomy, boolean>>({
		categories: true,
		brands: true,
	});
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<UndoImportTermsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Reinicia estado cada vez que se abre.
	useEffect(() => {
		if (isOpen) {
			setSelected({ categories: true, brands: true });
			setSubmitting(false);
			setResult(null);
			setError(null);
		}
	}, [isOpen]);

	const selectedTaxonomies = useMemo(
		() => TAXONOMY_OPTIONS.filter((opt) => selected[opt.value]).map((opt) => opt.value),
		[selected],
	);

	const canSubmit =
		subsidiaryId !== null && selectedTaxonomies.length > 0 && !submitting && !result;

	const handleToggle = (taxonomy: WooTaxonomy) => {
		setSelected((prev) => ({ ...prev, [taxonomy]: !prev[taxonomy] }));
	};

	const handleClose: Dispatch<SetStateAction<boolean>> = (value) => {
		if (submitting) return;
		setIsOpen(value);
	};

	const handleConfirm = async () => {
		if (!subsidiaryId || selectedTaxonomies.length === 0) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await undoImportTerms(subsidiaryId, { taxonomies: selectedTaxonomies });
			setResult(res);
			onCompleted?.();
		} catch (err: unknown) {
			setError(backendMessage(err, 'No se pudo deshacer la importación de términos'));
		} finally {
			setSubmitting(false);
		}
	};

	const skippedDetails = result ? [...result.details.categories, ...result.details.brands] : [];

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='md' isStaticBackdrop={submitting}>
			<ModalHeader>
				<Icon icon='HeroArrowUturnLeft' className='text-rose-500' />
				<span>Deshacer importación de términos</span>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				<p className='text-sm text-zinc-600 dark:text-zinc-300'>
					Elimina las categorías y marcas que se crearon al importar desde WooCommerce.
					Por seguridad, <strong>solo se borran las que no estén en uso</strong> por
					ningún producto activo; el resto se conserva.
				</p>

				{subsidiaryId === null && (
					<div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'>
						No hay una subsidiaria activa. Selecciona una sucursal para continuar.
					</div>
				)}

				{/* Selección de taxonomías (oculta una vez que hay resultado) */}
				{!result && (
					<div className='space-y-2'>
						<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
							¿Qué deseas deshacer?
						</p>
						{TAXONOMY_OPTIONS.map((option) => (
							<div
								key={option.value}
								className='flex items-start gap-2 rounded-md border border-zinc-100 p-2 dark:border-white/5'>
								<Checkbox
									id={`undo-term-${option.value}`}
									checked={selected[option.value]}
									onChange={() => handleToggle(option.value)}
									disabled={submitting}
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
				)}

				{error && (
					<div className='rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200'>
						{error}
					</div>
				)}

				{/* Resultado */}
				{result && (
					<div className='space-y-3'>
						<div className='rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100'>
							<Icon icon='HeroCheckCircle' className='me-1 inline' />
							{result.message}
						</div>
						<div className='grid grid-cols-2 gap-2 text-center text-sm'>
							<div className='rounded-md bg-zinc-100 p-2 dark:bg-zinc-800'>
								<div className='text-lg font-semibold text-zinc-800 dark:text-zinc-100'>
									{result.deleted}
								</div>
								<div className='text-xs text-zinc-500 dark:text-zinc-400'>
									Eliminados
								</div>
							</div>
							<div className='rounded-md bg-zinc-100 p-2 dark:bg-zinc-800'>
								<div className='text-lg font-semibold text-zinc-800 dark:text-zinc-100'>
									{result.skipped_in_use}
								</div>
								<div className='text-xs text-zinc-500 dark:text-zinc-400'>
									Omitidos (en uso)
								</div>
							</div>
						</div>

						{skippedDetails.length > 0 && (
							<div className='space-y-1'>
								<p className='text-xs font-semibold text-zinc-600 dark:text-zinc-300'>
									Conservados por estar en uso:
								</p>
								<ul className='max-h-40 space-y-1 overflow-auto text-xs text-zinc-600 dark:text-zinc-300'>
									{skippedDetails.map((term) => (
										<li key={`${term.id}-${term.reason}`}>
											<span className='font-medium'>{term.name}</span>{' '}
											<span className='text-zinc-400'>
												({REASON_LABEL[term.reason] ?? term.reason})
											</span>
										</li>
									))}
								</ul>
							</div>
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
						isDisable={submitting}>
						{result ? 'Cerrar' : 'Cancelar'}
					</Button>
				</ModalFooterChild>
				{!result && (
					<ModalFooterChild>
						<Button
							variant='solid'
							color='red'
							icon='HeroArrowUturnLeft'
							onClick={handleConfirm}
							isDisable={!canSubmit}>
							{submitting ? 'Deshaciendo…' : 'Deshacer importación'}
						</Button>
					</ModalFooterChild>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default UndoImportTermsModal;
