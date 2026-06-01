// src/pages/recursosHumanos/relojControl/RelojControlPage.tsx
import React, { useCallback } from 'react';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { useAppSelector } from '@/store';

import ClockDisplay from './components/ClockDisplay';
import ValidationStatus from './components/ValidationStatus';
import QRScanner from './components/QRScanner';
import AttendanceHistory from './components/AttendanceHistory';
import { useRelojControl } from '../hooks/useRelojControl';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';

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
			<PageWrapper name='Reloj Control' title='Sin Configuración' isProtectedRoute={true} >
				<Subheader>
					<SubheaderLeft>
						<h2 className='text-xl font-semibold'>Reloj Control</h2>
					</SubheaderLeft>
				</Subheader>
				<Container>
					<div className='flex min-h-[60vh] items-center justify-center'>
						<Card className='max-w-md w-full'>
							<CardBody>
								<div className='flex flex-col items-center gap-4 px-4 py-8'>
									<Icon
										icon='HeroWrenchScrewdriver'
										size='text-5xl'
										className='text-amber-500 dark:text-amber-400'
									/>
									<h2 className='text-xl font-semibold text-zinc-900 dark:text-zinc-200'>
										Configuración requerida
									</h2>
									<p className='text-center text-sm text-zinc-500 dark:text-zinc-400'>
										Primero debes configurar la sucursal (ubicación, IP, horario y
										QR) desde la sección de Configuración de RRHH.
									</p>
								</div>
							</CardBody>
						</Card>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	// ── Permiso denegado ───────────────────────────────
	if (geoPermission === 'denied') {
		return (
			<PageWrapper title='Sin Permisos' name='Reloj Control' isProtectedRoute={true} >
				<Subheader>
					<SubheaderLeft>
						<h2 className='text-xl font-semibold'>Reloj Control</h2>
					</SubheaderLeft>
				</Subheader>
				<Container>
					<div className='flex min-h-[60vh] items-center justify-center'>
						<Card className='max-w-md w-full'>
							<CardBody>
								<div className='flex flex-col items-center gap-4 px-4 py-8'>
									<Icon icon='HeroMapPin' size='text-5xl' className='text-red-500 dark:text-red-400' />
									<h2 className='text-xl font-semibold text-zinc-900 dark:text-zinc-200'>
										Ubicación Requerida
									</h2>
									<p className='text-center text-sm text-zinc-500 dark:text-zinc-400'>
										Necesitamos tu ubicación para registrar tu asistencia. Por
										favor, habilítala en la configuración del navegador.
									</p>
									<Button
										variant='outline'
										color='blue'
										className='mt-2'
										onClick={() => window.location.reload()}>
										Reintentar
									</Button>
								</div>
							</CardBody>
						</Card>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	// Nombre del usuario
	const userName = user?.first_name
		? `${user.first_name} ${user?.last_name ?? ''}`.trim()
		: 'Usuario';

	return (
		<PageWrapper name='Reloj Control' title={config.branchName + ' — ' + userName} isProtectedRoute={true} >
			<Subheader className='mb-6'>
				<SubheaderLeft className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
					<Icon icon='HeroClock' className='text-3xl text-blue-500' />
					<div className='flex flex-col items-start gap-1'>
						<Badge className='text-2xl font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700/50'>
							Reloj Control
						</Badge>
						<p className='mt-1 text-sm font-normal text-zinc-500 dark:text-zinc-400'>
							<span className='font-semibold text-zinc-700 dark:text-zinc-300'>{config.branchName}</span> — {userName}
						</p>
					</div>
				</SubheaderLeft>
			</Subheader>

			<Container className='h-full'>
				<div className='grid grid-cols-1 gap-6 lg:grid-cols-3 min-h-[72vh] pb-10'>
					{/* ── Columna principal ── */}
					<div className='lg:col-span-2'>
						<div className='flex flex-col gap-6'>
							<Card>
								<CardBody>
									<div className='flex flex-col items-center gap-6 py-6'>
										<ClockDisplay />

										{/* Info de usuario */}
										<div className='flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400'>
											<Icon icon='HeroUser' size='text-base' />
											<span>{userName}</span>
										</div>

										{/* Último registro */}
										{lastRecord && (
											<p className='text-xs text-zinc-500'>
												Último registro:{' '}
												<span className='font-medium text-zinc-700 dark:text-zinc-300'>
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
														<span className='ml-1 text-amber-600 dark:text-amber-400'>
															(Atraso)
														</span>
													)}
													{lastRecord.punctuality === 'early_exit' && (
														<span className='ml-1 text-amber-600 dark:text-amber-400'>
															(Salida anticipada)
														</span>
													)}
												</span>
											</p>
										)}

										{/* Marcación exitosa */}
										{justPunched && (
											<Alert color='emerald' variant='outline' icon='HeroCheckCircle' title='¡Marcación registrada exitosamente!' className='w-full max-w-md'>
												{lastRecord?.punctuality === 'on_time'
													? '✓ Puntual'
													: lastRecord?.punctuality === 'late'
														? '⚠ Con atraso'
														: '⚠ Salida anticipada'}
											</Alert>
										)}

										{/* Ya completó ambas marcaciones */}
										{allPunchesComplete && !justPunched && (
											<Alert color='blue' variant='outline' icon='HeroCheckBadge' className='w-full max-w-md'>
												Ya registraste entrada y salida hoy. ¡Buen trabajo!
											</Alert>
										)}

										{/* Error */}
										{error && !justPunched && (
											<Alert color='red' variant='outline' icon='HeroExclamationTriangle' className='w-full max-w-md'>
												{error}
											</Alert>
										)}

										{/* Botón principal */}
										{!isScanning && !allPunchesComplete && (
											<button
												onClick={handleStartPunch}
												disabled={isValidating}
												className={`group relative flex h-32 w-32 items-center justify-center rounded-full border-4 transition-all duration-300 ${isValidating
														? 'cursor-wait border-amber-500/30 bg-amber-500/10 dark:border-amber-500/50'
														: nextPunchType === 'entry'
															? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500 hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-emerald-500/50 dark:hover:border-emerald-400'
															: 'border-orange-500/30 bg-orange-500/10 hover:border-orange-500 hover:bg-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 dark:border-orange-500/50 dark:hover:border-orange-400'
													}`}>
												{isValidating ? (
													<Icon
														icon='HeroArrowPath'
														size='text-4xl'
														className='animate-spin text-amber-600 dark:text-amber-400'
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
																	? 'text-emerald-600 dark:text-emerald-400'
																	: 'text-orange-600 dark:text-orange-400'
															}
														/>
														<span
															className={`text-xs font-semibold ${nextPunchType === 'entry'
																	? 'text-emerald-600 dark:text-emerald-400'
																	: 'text-orange-600 dark:text-orange-400'
																}`}>
															{nextPunchType === 'entry'
																? 'ENTRADA'
																: 'SALIDA'}
														</span>
													</div>
												)}

												{!isValidating && (
													<span
														className={`absolute inset-0 animate-ping rounded-full opacity-[0.15] dark:opacity-20 ${nextPunchType === 'entry'
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
		</PageWrapper>
	);
};

export default RelojControlPage;
