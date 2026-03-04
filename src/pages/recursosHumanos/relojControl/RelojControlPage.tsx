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

	const {
		nextPunchType,
		preValidationsPassed,
		validations,
		isValidating,
		isScanning,
		error,
		lastRecord,
		todayRecords,
		runPreValidations,
		handleQRScanned,
		cancelScan,
		resetValidations,
	} = useRelojControl();

	const handleStartPunch = useCallback(async () => {
		resetValidations();
		await runPreValidations();
	}, [runPreValidations, resetValidations]);

	// ── Sin configuración ──────────────────────────────
	const hasConfig = config.branchName && config.latitude && config.longitude && config.qrCode;

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
									favor, habilítala en el candadito{' '}
									<Icon icon='HeroLockClosed' size='text-sm' className='inline' />{' '}
									de la barra de direcciones de tu navegador.
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

	// ── Marcación exitosa reciente ─────────────────────
	const justPunched = validations?.allPassed && validations?.qr?.passed;

	return (
		<Container>
			<div className='mb-6'>
				<h1 className='text-2xl font-bold text-zinc-100'>Reloj Control</h1>
				<p className='mt-1 text-sm text-zinc-400'>
					{config.branchName} — Registra tu entrada y salida
				</p>
			</div>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* ── Columna principal (reloj + acción) ── */}
				<div className='lg:col-span-2'>
					<div className='flex flex-col gap-6'>
						{/* Reloj + botón de marcación */}
						<Card>
							<CardBody>
								<div className='flex flex-col items-center gap-6 py-6'>
									<ClockDisplay />

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
											</span>
										</p>
									)}

									{/* Mensaje de éxito */}
									{justPunched && (
										<div className='flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3'>
											<Icon
												icon='HeroCheckCircle'
												size='text-xl'
												className='text-emerald-400'
											/>
											<p className='text-sm font-medium text-emerald-300'>
												¡Marcación registrada exitosamente!
											</p>
										</div>
									)}

									{/* Error */}
									{error && !justPunched && (
										<div className='flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3'>
											<Icon
												icon='HeroExclamationTriangle'
												size='text-xl'
												className='text-red-400'
											/>
											<p className='text-sm text-red-300'>{error}</p>
										</div>
									)}

									{/* Botón principal */}
									{!isScanning && (
										<button
											onClick={handleStartPunch}
											disabled={isValidating}
											className={`group relative flex h-32 w-32 items-center justify-center rounded-full border-4 transition-all duration-300 ${
												isValidating
													? 'cursor-wait border-amber-500/50 bg-amber-500/10'
													: nextPunchType === 'entry'
														? 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20'
														: 'border-orange-500/50 bg-orange-500/10 hover:border-orange-400 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20'
											} `}>
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

											{/* Pulse animation */}
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

									{!isScanning && !isValidating && (
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
						{(validations || isValidating) && (
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

				{/* ── Columna lateral (historial) ── */}
				<div>
					<AttendanceHistory records={todayRecords} />
				</div>
			</div>
		</Container>
	);
};

export default RelojControlPage;
