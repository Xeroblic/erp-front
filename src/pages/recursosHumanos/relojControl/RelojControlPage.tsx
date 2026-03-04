// src/pages/recursosHumanos/relojControl/RelojControlPage.tsx
import React, { useCallback } from 'react';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppSelector } from '@/store';

import ClockDisplay from './components/ClockDisplay';
import ValidationStatus from './components/ValidationStatus';
import QRScanner from './components/QRScanner';
import AttendanceHistory from './components/AttendanceHistory';
import { useRelojControl } from '../hooks/useRelojControl';

const RelojControlPage: React.FC = () => {
	const config = useAppSelector((s) => s.recursosHumanos.config);
	const geoPermission = useAppSelector((s) => s.recursosHumanos.ui.geoPermission);
	const user = useAppSelector((s) => s.auth.user);

	const {
		nextPunchType,
		preValidationsPassed,
		validations,
		isValidating,
		isScanning,
		error,
		lastRecord,
		todayRecords,
		alreadyPunchedEntry,
		alreadyPunchedExit,
		justPunched,
		runPreValidations,
		handleQRScanned,
		cancelScan,
		resetValidations,
	} = useRelojControl();

	const handleStartPunch = useCallback(async () => {
		resetValidations();
		await runPreValidations();
	}, [runPreValidations, resetValidations]);

	const hasConfig = config.branchName && config.latitude && config.longitude && config.qrCode;
	const allPunchesComplete = alreadyPunchedEntry && alreadyPunchedExit;

	// ── Sin configuración ──────────────────────────────
	if (!hasConfig) {
		return (
			<Container>
				<div className='flex min-h-[60vh] items-center justify-center'>
					<Card>
						<CardBody>
							<div className='flex flex-col items-center gap-4 px-8 py-12'>
								<Icon
									icon='HeroWrenchScrewdriver'
									size='text-5xl'
									className='text-amber-400'
								/>
								<h2 className='text-xl font-semibold text-zinc-200'>
									Configuración requerida
								</h2>
								<p className='max-w-sm text-center text-sm text-zinc-400'>
									Primero debes configurar la sucursal (ubicación, IP, horario y
									QR) desde la sección de Configuración de RRHH.
								</p>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>
		);
	}

	// ── Permiso denegado ───────────────────────────────
	if (geoPermission === 'denied') {
		return (
			<Container>
				<div className='flex min-h-[60vh] items-center justify-center'>
					<Card>
						<CardBody>
							<div className='flex flex-col items-center gap-4 px-8 py-12'>
								<Icon icon='HeroMapPin' size='text-5xl' className='text-red-400' />
								<h2 className='text-xl font-semibold text-zinc-200'>
									Ubicación Requerida
								</h2>
								<p className='max-w-sm text-center text-sm text-zinc-400'>
									Necesitamos tu ubicación para registrar tu asistencia. Por
									favor, habilítala en la configuración del navegador.
								</p>
								<Button
									variant='outline'
									color='blue'
									onClick={() => window.location.reload()}>
									Reintentar
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>
		);
	}

	// Nombre del usuario
	const userName = user?.first_name
		? `${user.first_name} ${user?.last_name ?? ''}`.trim()
		: 'Usuario';

	return (
		<Container>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-zinc-100'>Reloj Control</h1>
				<p className='mt-1 text-sm text-zinc-400'>
					{config.branchName} — {userName}
				</p>
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* ── Columna principal ── */}
				<div className='lg:col-span-2'>
					<div className='flex flex-col gap-6'>
						<Card>
							<CardBody>
								<div className='flex flex-col items-center gap-6 py-6'>
									<ClockDisplay />

									{/* Info de usuario */}
									<div className='flex items-center gap-2 text-sm text-zinc-400'>
										<Icon icon='HeroUser' size='text-base' />
										<span>{userName}</span>
									</div>

									{/* Último registro */}
									{lastRecord && (
										<p className='text-xs text-zinc-500'>
											Último registro:{' '}
											<span className='text-zinc-300'>
												{lastRecord.type === 'entry' ? 'Entrada' : 'Salida'}{' '}
												a las{' '}
												{new Date(lastRecord.timestamp).toLocaleTimeString(
													'es-CL',
													{
														hour: '2-digit',
														minute: '2-digit',
														hour12: false,
													},
												)}
												{lastRecord.punctuality === 'late' && (
													<span className='ml-1 text-amber-400'>
														(Atraso)
													</span>
												)}
												{lastRecord.punctuality === 'early_exit' && (
													<span className='ml-1 text-amber-400'>
														(Salida anticipada)
													</span>
												)}
											</span>
										</p>
									)}

									{/* Marcación exitosa */}
									{justPunched && (
										<div className='w-full max-w-md rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroCheckCircle'
													size='text-xl'
													className='text-emerald-400'
												/>
												<div>
													<p className='text-sm font-medium text-emerald-300'>
														¡Marcación registrada exitosamente!
													</p>
													<p className='text-xs text-emerald-400/70'>
														{lastRecord?.punctuality === 'on_time'
															? '✓ Puntual'
															: lastRecord?.punctuality === 'late'
																? '⚠ Con atraso'
																: '⚠ Salida anticipada'}
													</p>
												</div>
											</div>
										</div>
									)}

									{/* Ya completó ambas marcaciones */}
									{allPunchesComplete && !justPunched && (
										<div className='w-full max-w-md rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroCheckBadge'
													size='text-xl'
													className='text-blue-400'
												/>
												<p className='text-sm text-blue-300'>
													Ya registraste entrada y salida hoy. ¡Buen
													trabajo!
												</p>
											</div>
										</div>
									)}

									{/* Error */}
									{error && !justPunched && (
										<div className='w-full max-w-md rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3'>
											<div className='flex items-center gap-2'>
												<Icon
													icon='HeroExclamationTriangle'
													size='text-xl'
													className='text-red-400'
												/>
												<p className='text-sm text-red-300'>{error}</p>
											</div>
										</div>
									)}

									{/* Botón principal */}
									{!isScanning && !allPunchesComplete && (
										<button
											onClick={handleStartPunch}
											disabled={isValidating}
											className={`group relative flex h-32 w-32 items-center justify-center rounded-full border-4 transition-all duration-300 ${
												isValidating
													? 'cursor-wait border-amber-500/50 bg-amber-500/10'
													: nextPunchType === 'entry'
														? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20'
														: 'border-orange-500/50 bg-orange-500/10 hover:border-orange-400 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20'
											}`}>
											{isValidating ? (
												<Icon
													icon='HeroArrowPath'
													size='text-4xl'
													className='animate-spin text-amber-400'
												/>
											) : (
												<div className='flex flex-col items-center gap-1'>
													<Icon
														icon={
															nextPunchType === 'entry'
																? 'HeroArrowRightOnRectangle'
																: 'HeroArrowLeftOnRectangle'
														}
														size='text-3xl'
														className={
															nextPunchType === 'entry'
																? 'text-emerald-400'
																: 'text-orange-400'
														}
													/>
													<span
														className={`text-xs font-semibold ${
															nextPunchType === 'entry'
																? 'text-emerald-400'
																: 'text-orange-400'
														}`}>
														{nextPunchType === 'entry'
															? 'ENTRADA'
															: 'SALIDA'}
													</span>
												</div>
											)}

											{!isValidating && (
												<span
													className={`absolute inset-0 animate-ping rounded-full opacity-20 ${
														nextPunchType === 'entry'
															? 'bg-emerald-500'
															: 'bg-orange-500'
													}`}
													style={{ animationDuration: '2s' }}
												/>
											)}
										</button>
									)}

									{!isScanning && !isValidating && !allPunchesComplete && (
										<p className='text-xs text-zinc-500'>
											Presiona para validar y escanear QR
										</p>
									)}
								</div>
							</CardBody>
						</Card>

						{/* QR Scanner */}
						{isScanning && preValidationsPassed && (
							<QRScanner
								isActive={isScanning}
								onScan={handleQRScanned}
								onCancel={cancelScan}
							/>
						)}

						{/* Validaciones */}
						{(validations || isValidating) && !justPunched && (
							<Card>
								<CardBody>
									<ValidationStatus
										validations={validations}
										isValidating={isValidating}
									/>
								</CardBody>
							</Card>
						)}
					</div>
				</div>

				{/* ── Columna lateral ── */}
				<div>
					<AttendanceHistory records={todayRecords} />
				</div>
			</div>
		</Container>
	);
};

export default RelojControlPage;
