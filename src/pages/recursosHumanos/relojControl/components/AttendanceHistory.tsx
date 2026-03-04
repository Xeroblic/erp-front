// src/pages/recursosHumanos/relojControl/components/AttendanceHistory.tsx
import React from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import type { IRHAttendanceRecord } from '@/interface/rh.interface';

interface AttendanceHistoryProps {
	records: IRHAttendanceRecord[];
}

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
				<div className='overflow-x-auto'>
					<table className='w-full text-left text-sm'>
						<thead>
							<tr className='border-b border-zinc-700 text-zinc-400'>
								<th className='px-3 py-2'>Hora</th>
								<th className='px-3 py-2'>Tipo</th>
								<th className='px-3 py-2'>Ubicación</th>
								<th className='px-3 py-2'>IP</th>
								<th className='px-3 py-2'>Estado</th>
							</tr>
						</thead>
						<tbody>
							{records.map((record) => {
								const time = new Date(record.timestamp).toLocaleTimeString(
									'es-CL',
									{
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit',
										hour12: false,
									},
								);

								return (
									<tr key={record.id} className='border-b border-zinc-700/50'>
										<td className='px-3 py-2 font-mono text-zinc-200'>
											{time}
										</td>
										<td className='px-3 py-2'>
											<span
												className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
													record.type === 'entry'
														? 'bg-emerald-500/20 text-emerald-400'
														: 'bg-orange-500/20 text-orange-400'
												}`}>
												<Icon
													icon={
														record.type === 'entry'
															? 'HeroArrowRightOnRectangle'
															: 'HeroArrowLeftOnRectangle'
													}
													size='text-xs'
												/>
												{record.type === 'entry' ? 'Entrada' : 'Salida'}
											</span>
										</td>
										<td className='px-3 py-2 text-xs text-zinc-400'>
											{record.validations.geolocation?.distanceMeters ?? '—'}m
										</td>
										<td className='px-3 py-2 font-mono text-xs text-zinc-400'>
											{record.publicIP || '—'}
										</td>
										<td className='px-3 py-2'>
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
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</CardBody>
		</Card>
	);
};

export default AttendanceHistory;
