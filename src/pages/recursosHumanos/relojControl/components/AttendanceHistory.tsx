// src/pages/recursosHumanos/relojControl/components/AttendanceHistory.tsx
import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { IRHAttendanceRecord } from '@/interface/rh.interface';

interface AttendanceHistoryProps {
	records: IRHAttendanceRecord[];
}

const punctualityLabel = (p: string): { text: string; color: string } => {
	switch (p) {
		case 'on_time':
			return { text: 'Puntual', color: 'text-emerald-400' };
		case 'late':
			return { text: 'Atraso', color: 'text-amber-400' };
		case 'early_exit':
			return { text: 'Salida anticipada', color: 'text-amber-400' };
		default:
			return { text: '—', color: 'text-zinc-500' };
	}
};

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records }) => {
	if (records.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Historial de Hoy</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='py-6 text-center'>
						<Icon
							icon='HeroClipboardDocumentList'
							size='text-3xl'
							className='mx-auto mb-2 text-zinc-600'
						/>
						<p className='text-sm text-zinc-500'>Sin registros hoy</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Historial de Hoy</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<span className='rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-400'>
						{records.length} registro{records.length !== 1 ? 's' : ''}
					</span>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='space-y-3'>
					{records.map((record) => {
						const time = new Date(record.timestamp).toLocaleTimeString('es-CL', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							hour12: false,
						});
						const punct = punctualityLabel(record.punctuality);

						return (
							<div
								key={record.id}
								className='flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3'>
								{/* Icono tipo */}
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-full ${
										record.type === 'entry'
											? 'bg-emerald-500/20'
											: 'bg-orange-500/20'
									}`}>
									<Icon
										icon={
											record.type === 'entry'
												? 'HeroArrowRightOnRectangle'
												: 'HeroArrowLeftOnRectangle'
										}
										size='text-lg'
										className={
											record.type === 'entry'
												? 'text-emerald-400'
												: 'text-orange-400'
										}
									/>
								</div>

								{/* Info */}
								<div className='flex-1'>
									<div className='flex items-center gap-2'>
										<span className='font-mono text-sm font-medium text-zinc-200'>
											{time}
										</span>
										<span
											className={`rounded-full px-2 py-0.5 text-xs font-medium ${
												record.type === 'entry'
													? 'bg-emerald-500/20 text-emerald-400'
													: 'bg-orange-500/20 text-orange-400'
											}`}>
											{record.type === 'entry' ? 'Entrada' : 'Salida'}
										</span>
										<span className={`text-xs ${punct.color}`}>
											{punct.text}
										</span>
									</div>
									<div className='mt-0.5 flex items-center gap-3 text-xs text-zinc-500'>
										<span>{record.userName}</span>
										<span>
											{record.validations.geolocation?.distanceMeters ?? '—'}m
										</span>
										<span className='font-mono'>{record.publicIP || '—'}</span>
									</div>
								</div>

								{/* Status */}
								{record.validations.allPassed ? (
									<Icon
										icon='HeroCheckCircle'
										size='text-lg'
										className='text-emerald-400'
									/>
								) : (
									<Icon
										icon='HeroExclamationCircle'
										size='text-lg'
										className='text-amber-400'
									/>
								)}
							</div>
						);
					})}
				</div>
			</CardBody>
		</Card>
	);
};

export default AttendanceHistory;
