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
import {
	translateField,
	translateValue,
	calculateReviewDuration,
	generateConnectivityText,
} from './utils/reviewTranslations';

interface ReviewSummaryAsideProps {
	item: any;
	serialNumber: string;
	equipmentType: string;
	normalizedReviewStatus: string;
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

	const detailValues: Record<string, any> = useMemo(
		() => item?.details || item?.attributes_json || {},
		[item],
	);

	const detailEntries = useMemo(() => Object.entries(detailValues), [detailValues]);
	const hasDetails = detailEntries.length > 0;

	const displayGrade = automaticGrade || item?.grade || item?.suggested_grade;
	const hasGrade = Boolean(displayGrade);

	const handleCopyInfo = () => {
		const info = [
			`S/N: ${serialNumber || item?.serial_number || '-'}`,
			`Tipo: ${translateValue(equipmentType) || '-'}`,
			`Estado: ${translateValue(normalizedReviewStatus) || 'Pendiente'}`,
			`Grado: ${displayGrade || '-'}`,
			item?.scoring_confidence !== undefined
				? `Confianza: ${Math.round(item.scoring_confidence)}%`
				: null,
			'',
			'REVISIÓN:',
			item?.reviewed_by ? `Técnico: ${item.reviewed_by.name || item.reviewed_by}` : null,
			reviewDuration ? `Tiempo: ${reviewDuration}` : null,
			'',
			'DETALLES:',
			...detailEntries.map(
				([key, value]) => `${translateField(key, equipmentType)}: ${translateValue(value)}`,
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
			className='rounded-l-xl bg-zinc-500 backdrop-blur-sm dark:bg-zinc-900'
			asideWidth='w-96 md:w-128'>
			<div className='space-y-6'>
				<h2 className='text-2xl font-bold text-white'>Resumen del Equipo</h2>
				<div className='space-y-4'>
					{/* Identificación */}
					<div className='rounded-xl bg-white/10 p-4 backdrop-blur-sm'>
						<h3 className='mb-2 text-lg font-semibold text-white'>Identificación</h3>
						<div className='space-y-2 text-sm text-white/80'>
							<div className='flex justify-between pb-1'>
								<span className='opacity-70'>S/N:</span>
								<span className='font-mono font-bold'>
									{translateValue(serialNumber || item?.serial_number) || '-'}
								</span>
							</div>
							<div className='flex justify-between pb-1'>
								<span className='opacity-70'>Tipo:</span>
								<span className='capitalize'>
									{translateValue(equipmentType) || '-'}
								</span>
							</div>
							<div className='flex justify-between pb-1'>
								<span className='opacity-70'>Estado:</span>
								<span className='font-semibold uppercase'>
									{translateValue(normalizedReviewStatus) || 'Pendiente'}
								</span>
							</div>
						</div>
					</div>

					{/* Resultado (grado + confianza) */}
					{hasGrade && (
						<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
							<h3 className='mb-2 text-lg font-semibold text-white'>Resultado</h3>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-xs uppercase text-white/60'>Grado</p>
									<p className='text-4xl font-black text-white'>
										{translateValue(displayGrade) || '-'}
									</p>
								</div>
								{item?.scoring_confidence !== undefined && (
									<div className='text-right'>
										<p className='text-xs uppercase text-white/60'>Confianza</p>
										<p className='text-xl font-bold text-white'>
											{Math.round(item.scoring_confidence)}%
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Información de Revisión */}
					{(item?.reviewed_by || reviewDuration) && (
						<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
							<h3 className='mb-2 text-lg font-semibold text-white'>
								Información de Revisión
							</h3>
							<div className='space-y-2 text-sm text-white/80'>
								{item?.reviewed_by && (
									<div className='flex justify-between pb-1'>
										<span className='opacity-70'>Técnico:</span>
										<span className='font-medium'>
											{item.reviewed_by.name || item.reviewed_by}
										</span>
									</div>
								)}
								{reviewDuration && (
									<div className='flex justify-between pb-1'>
										<span className='opacity-70'>Tiempo de Revisión:</span>
										<span className='font-bold text-green-400'>
											{reviewDuration}
										</span>
									</div>
								)}
								{item?.review_started_at && (
									<div className='flex justify-between pb-1'>
										<span className='opacity-70'>Inicio:</span>
										<span className='font-medium'>
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
									<div className='flex justify-between pb-1'>
										<span className='opacity-70'>Finalización:</span>
										<span className='font-medium'>
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
						<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
							<h3 className='mb-2 text-lg font-semibold text-white'>Detalles</h3>
							<div className='max-h-80 space-y-1 overflow-y-auto pr-2 text-xs text-white/80'>
								{detailEntries.map(([key, value]) => (
									<div key={key} className='flex justify-between gap-4 py-1'>
										<span className='capitalize opacity-70'>
											{translateField(key, equipmentType)}
										</span>
										<span className='text-right font-medium'>
											{translateValue(value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Botón Copiar */}
					<Button
						variant='solid'
						color='neutral'
						className='w-full'
						onClick={handleCopyInfo}>
						<Icon icon='HeroClipboardDocument' className='mr-2 h-4 w-4' />
						Copiar Información
					</Button>
				</div>
			</div>
		</HiddenAside>
	);
};

export default ReviewSummaryAside;
