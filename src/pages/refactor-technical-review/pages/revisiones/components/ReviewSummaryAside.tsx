/**
 * ReviewSummaryAside - Panel lateral con resumen del equipo en revisión.
 * Replica la funcionalidad completa del HiddenAside del legacy BatchItemReviewPage
 * usando datos del hook refactorizado.
 */
import React, { useMemo } from 'react';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import HiddenAside from '@/components/ui/HiddenAside/HiddenAside';
import type { EquipmentType, ReviewStatus } from '@/interface/technicalReviews.interface';
import {
	translateField,
	translateValue,
	calculateReviewDuration,
	generateConnectivityText,
	getFieldsForType,
} from './utils/reviewTranslations';
import { getHardwareDisplayValue } from '../../../components/utils/hardwareAbsence';

/** Datos del item necesarios para el panel lateral */
interface ReviewItemSummary {
	serial_number?: string;
	grade?: string | null;
	suggested_grade?: string | null;
	scoring_confidence?: number | null;
	reviewed_by?: { name: string } | string | null;
	review_started_at?: string;
	reviewed_at?: string;
	details?: Record<string, unknown> | null;
	attributes_json?: Record<string, unknown>;
}

interface ReviewSummaryAsideProps {
	item: ReviewItemSummary | null;
	serialNumber: string;
	equipmentType: EquipmentType;
	normalizedReviewStatus: ReviewStatus | string;
	automaticGrade: string | null;
}

const ReviewSummaryAside: React.FC<ReviewSummaryAsideProps> = ({
	item,
	serialNumber,
	equipmentType,
	normalizedReviewStatus,
	automaticGrade,
}) => {
	const reviewDuration = useMemo(() => calculateReviewDuration(item), [item]);

	const detailValues = useMemo<Record<string, unknown>>(
		() => item?.details || item?.attributes_json || {},
		[item],
	);

	// Filtra solo los campos válidos para el tipo de equipo actual
	const detailEntries = useMemo<Array<[string, unknown]>>(() => {
		const allEntries = Object.entries(detailValues);
		const validFields = getFieldsForType(equipmentType);
		const entries = validFields
			? allEntries.filter(([key]) => validFields.has(key))
			: allEntries;
		return entries.map(([key, value]): [string, unknown] => [
			key,
			getHardwareDisplayValue(detailValues, key) ?? value,
		]);
	}, [detailValues, equipmentType]);
	const hasDetails = detailEntries.length > 0;

	const displayGrade = automaticGrade || item?.grade || item?.suggested_grade;
	const hasGrade = Boolean(displayGrade);

	/** Extrae nombre del revisor (puede ser string u objeto) */
	const reviewerName = useMemo((): string | null => {
		if (!item?.reviewed_by) return null;
		if (typeof item.reviewed_by === 'object') return item.reviewed_by.name;
		return String(item.reviewed_by);
	}, [item?.reviewed_by]);

	const confidence = item?.scoring_confidence ?? null;

	const handleCopyInfo = () => {
		const info = [
			`S/N: ${serialNumber || item?.serial_number || '-'}`,
			`Tipo: ${translateValue(equipmentType) || '-'}`,
			`Estado: ${translateValue(normalizedReviewStatus) || 'Pendiente'}`,
			`Grado: ${displayGrade || '-'}`,
			confidence !== null ? `Confianza: ${Math.round(confidence)}%` : null,
			'',
			'REVISIÓN:',
			reviewerName ? `Técnico: ${reviewerName}` : null,
			reviewDuration ? `Tiempo: ${reviewDuration}` : null,
			'',
			'DETALLES:',
			...detailEntries.map(
				([key, value]) =>
					`${translateField(key, equipmentType)}: ${translateValue(value, key)}`,
			),
			'',
			generateConnectivityText(item) || null,
		]
			.filter((line) => line !== null && line !== '')
			.join('\n');

		navigator.clipboard.writeText(info);
		toast.success('Información copiada al portapapeles');
	};

	return (
		<HiddenAside
			className='rounded-l-2xl bg-zinc-700/70 shadow-2xl backdrop-blur-md dark:bg-zinc-900/95 dark:shadow-black/50'
			asideWidth='w-96 md:w-128'>
			<div className='flex h-full flex-col'>
				{/* Title */}
				<div className='flex-shrink-0 px-6 py-6'>
					<h2 className='text-2xl font-bold tracking-tight text-white drop-shadow-sm'>
						Resumen del Equipo
					</h2>
				</div>

				{/* Cards Container */}
				<div className='flex-grow space-y-4 overflow-y-auto px-6 pb-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2'>
					{/* Identificación */}
					<div className='rounded-xl bg-white/10 p-4 shadow-inner backdrop-blur-sm'>
						<h3 className='mb-3 text-lg font-bold tracking-wide text-white'>
							Identificación
						</h3>
						<div className='space-y-2'>
							<div className='flex items-center justify-between gap-4'>
								<span className='text-sm font-medium text-white/70'>S/N:</span>
								<span className='font-mono text-sm font-bold uppercase text-white'>
									{translateValue(serialNumber || item?.serial_number) || '-'}
								</span>
							</div>
							<div className='flex items-center justify-between gap-4'>
								<span className='text-sm font-medium text-white/70'>Tipo:</span>
								<span className='text-sm font-bold capitalize text-white'>
									{translateValue(equipmentType) || '-'}
								</span>
							</div>
							<div className='flex items-center justify-between gap-4'>
								<span className='text-sm font-medium text-white/70'>Estado:</span>
								<span className='text-sm font-extrabold uppercase tracking-wide text-white'>
									{translateValue(normalizedReviewStatus) || 'EN REVISIÓN'}
								</span>
							</div>
						</div>
					</div>

					{/* Resultado (grado + confianza) */}
					{hasGrade && (
						<div className='rounded-xl bg-white/10 p-4 shadow-inner backdrop-blur-sm'>
							<h3 className='mb-3 text-lg font-bold tracking-wide text-white'>
								Resultado
							</h3>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-xs font-semibold uppercase tracking-wider text-white/60'>
										Grado
									</p>
									<p className='text-3xl font-black text-white drop-shadow-md'>
										{translateValue(displayGrade) || '-'}
									</p>
								</div>
								{confidence !== null && (
									<div className='text-right'>
										<p className='text-xs font-semibold uppercase tracking-wider text-white/60'>
											Confianza
										</p>
										<p className='text-xl font-bold text-emerald-400 drop-shadow-sm'>
											{Math.round(confidence)}%
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Información de Revisión */}
					{(reviewerName || reviewDuration) && (
						<div className='rounded-xl bg-white/10 p-4 shadow-inner backdrop-blur-sm'>
							<h3 className='mb-3 text-lg font-bold tracking-wide text-white'>
								Información de Revisión
							</h3>
							<div className='space-y-2'>
								{reviewerName && (
									<div className='flex items-center justify-between gap-4'>
										<span className='text-sm font-medium text-white/70'>
											Técnico:
										</span>
										<span className='text-right text-sm font-bold text-white'>
											{reviewerName}
										</span>
									</div>
								)}
								{reviewDuration && (
									<div className='flex items-center justify-between gap-4'>
										<span className='text-sm font-medium text-white/70'>
											Tiempo de Revisión:
										</span>
										<span className='text-sm font-bold text-green-400'>
											{reviewDuration}
										</span>
									</div>
								)}
								{item?.review_started_at && (
									<div className='flex items-center justify-between gap-4'>
										<span className='text-sm font-medium text-white/70'>
											Inicio:
										</span>
										<span className='text-sm font-bold lowercase text-white'>
											{new Date(item.review_started_at).toLocaleTimeString(
												'es-CL',
												{
													hour: '2-digit',
													minute: '2-digit',
												},
											)}
										</span>
									</div>
								)}
								{item?.reviewed_at && (
									<div className='flex items-center justify-between gap-4'>
										<span className='text-sm font-medium text-white/70'>
											Finalización:
										</span>
										<span className='text-sm font-bold lowercase text-white'>
											{new Date(item.reviewed_at).toLocaleTimeString(
												'es-CL',
												{
													hour: '2-digit',
													minute: '2-digit',
												},
											)}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Detalles Técnicos */}
					{hasDetails && (
						<div className='flex flex-col rounded-xl bg-white/10 shadow-inner backdrop-blur-sm'>
							<div className='px-4 pb-2 pt-4'>
								<h3 className='text-lg font-bold tracking-wide text-white'>
									Detalles
								</h3>
							</div>
							<div className='max-h-[35vh] space-y-1.5 overflow-y-auto px-4 pb-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'>
								{detailEntries.map(([key, value]) => (
									<div
										key={key}
										className='flex items-start justify-between gap-4 py-0.5'>
										<span className='shrink-0 text-sm font-medium capitalize text-white/70'>
											{translateField(key, equipmentType)}
										</span>
										<span className='whitespace-normal break-words text-right text-sm font-bold text-white'>
											{translateValue(value, key) || '-'}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Copy Button */}
				<div className='flex-shrink-0 px-6 py-6'>
					<Button
						variant='solid'
						className='w-full justify-center rounded-xl border-0 !bg-white/10 py-2.5 text-base font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:!bg-white/20 hover:shadow-xl'
						onClick={handleCopyInfo}>
						<Icon icon='HeroClipboardDocument' className='mr-2 h-5 w-5' />
						Copiar Información
					</Button>
				</div>
			</div>
		</HiddenAside>
	);
};

export default ReviewSummaryAside;
