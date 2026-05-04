import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FormikProps } from 'formik';
import { TicketFormValues, FloatingOrnament } from '@/pages/Public/formLockCleare/components/FormLockCare.types';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import useForceLightMode from '@/hooks/useForceLightMode';

// Reutilizamos los componentes del MVP directamente
import FormLockCareDecorations from '@/pages/Public/formLockCleare/components/FormLockCareDecorations';
import FormLockCareFormPanel from '@/pages/Public/formLockCleare/components/FormLockCareFormPanel';
import FormLockCareGuidePanel from '@/pages/Public/formLockCleare/components/FormLockCareGuidePanel';

import CheckInSuccessSteps from './components/CheckInSuccessSteps';
import LockerPinModal from './components/LockerPinModal';
import TerminoCondiciones from '../formLockCleare/TerminoCondiciones';

interface PublicLockCareViewProps {
	isLoadingInfo: boolean;
	infoError: string | null;
	formik: FormikProps<TicketFormValues>;
	pinReceived: string | null;
	lockerNumberReceived: string | null;
	isTerminosOpen: boolean;
	isPinModalOpen: boolean;
	isCheckInComplete: boolean;
	handleOpenTerms: () => void;
	handleCloseTerms: () => void;
	handleAcceptTerms: () => void;
	handleClosePinModal: () => void;
	handleOpenPinModal: () => void;
}

export const PublicLockCareView: React.FC<PublicLockCareViewProps> = ({
	isLoadingInfo,
	infoError,
	formik,
	pinReceived,
	lockerNumberReceived,
	isTerminosOpen,
	isPinModalOpen,
	isCheckInComplete,
	handleOpenTerms,
	handleCloseTerms,
	handleAcceptTerms,
	handleClosePinModal,
	handleOpenPinModal,
}) => {
	useForceLightMode();

	// --- Estado de decoraciones (mismo patrón que FormLockCare.tsx) ---
	const [showStepsMobile, setShowStepsMobile] = useState(false);
	const [showChecklistMobile, setShowChecklistMobile] = useState(false);
	const [isDesktopViewport, setIsDesktopViewport] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const [decorationsReady, setDecorationsReady] = useState(false);
	const [floatingOrnaments, setFloatingOrnaments] = useState<FloatingOrnament[]>([]);

	useEffect(() => {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

		const desktopQuery = window.matchMedia('(min-width: 1024px)');
		const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const syncPreferences = () => {
			setIsDesktopViewport(desktopQuery.matches);
			setPrefersReducedMotion(reducedMotionQuery.matches);
		};

		syncPreferences();
		desktopQuery.addEventListener('change', syncPreferences);
		reducedMotionQuery.addEventListener('change', syncPreferences);

		return () => {
			desktopQuery.removeEventListener('change', syncPreferences);
			reducedMotionQuery.removeEventListener('change', syncPreferences);
		};
	}, []);

	const shouldRenderHeavyDecorations = isDesktopViewport && !prefersReducedMotion;

	useEffect(() => {
		if (typeof window === 'undefined') return;

		let isCancelled = false;
		const idleCallbackApi = window as Window & {
			requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
			cancelIdleCallback?: (handle: number) => void;
		};

		const enableDecorations = () => {
			if (!isCancelled) setDecorationsReady(true);
		};

		const idleHandle = idleCallbackApi.requestIdleCallback
			? idleCallbackApi.requestIdleCallback(enableDecorations, { timeout: 1200 })
			: null;
		const timeoutHandle =
			idleHandle === null ? window.setTimeout(enableDecorations, 900) : null;

		return () => {
			isCancelled = true;
			if (idleHandle !== null && idleCallbackApi.cancelIdleCallback) {
				idleCallbackApi.cancelIdleCallback(idleHandle);
			}
			if (timeoutHandle !== null) {
				window.clearTimeout(timeoutHandle);
			}
		};
	}, []);

	useEffect(() => {
		let isCancelled = false;

		const loadOrnaments = async () => {
			if (!shouldRenderHeavyDecorations || !decorationsReady) {
				if (!isCancelled) setFloatingOrnaments([]);
				return;
			}

			const utilsModule = await import(
				'@/pages/Public/formLockCleare/components/FormLockCare.utils'
			);
			if (!isCancelled) {
				setFloatingOrnaments(utilsModule.buildFloatingOrnaments());
			}
		};

		loadOrnaments();

		return () => {
			isCancelled = true;
		};
	}, [decorationsReady, shouldRenderHeavyDecorations]);

	const handleToggleSteps = useCallback(() => {
		setShowStepsMobile((prev) => !prev);
	}, []);

	const handleToggleChecklist = useCallback(() => {
		setShowChecklistMobile((prev) => !prev);
	}, []);

	// --- Escáner QR para casillero no disponible ---
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const [scannerError, setScannerError] = useState<string | null>(null);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const scannerRunningRef = useRef(false);

	useEffect(() => {
		if (!isScannerOpen) return;

		let cancelled = false;
		setScannerError(null);

		// Pequeño delay para asegurar que el div #qr-reader esté en el DOM
		const timer = setTimeout(() => {
			if (cancelled) return;

			const qrReaderEl = document.getElementById('qr-reader');
			if (!qrReaderEl) {
				setScannerError('No se pudo inicializar el escáner.');
				setIsScannerOpen(false);
				return;
			}

			const scanner = new Html5Qrcode('qr-reader');
			scannerRef.current = scanner;

			scanner
				.start(
					{ facingMode: 'environment' },
					{ fps: 10, qrbox: { width: 250, height: 250 } },
					(decodedText) => {
						if (cancelled) return;
						cancelled = true;
						scannerRunningRef.current = false;

						// Detener el escáner
						scanner.stop().catch(() => {});
						scannerRef.current = null;

						// Navegar a la URL del QR escaneado
						try {
							const url = new URL(decodedText);
							window.location.href = url.pathname;
						} catch {
							if (decodedText.startsWith('/')) {
								window.location.href = decodedText;
							}
						}
					},
					() => {
						// Ignorar frames sin QR
					},
				)
				.then(() => {
					scannerRunningRef.current = true;
				})
				.catch(() => {
					scannerRef.current = null;
					scannerRunningRef.current = false;
					if (!cancelled) {
						setScannerError(
							'No se pudo acceder a la cámara. Asegúrate de dar permiso o usa un dispositivo con cámara.',
						);
						setIsScannerOpen(false);
					}
				});
		}, 100);

		return () => {
			cancelled = true;
			clearTimeout(timer);
			if (scannerRef.current && scannerRunningRef.current) {
				scannerRef.current.stop().catch(() => {});
				scannerRunningRef.current = false;
			}
			scannerRef.current = null;
		};
	}, [isScannerOpen]);

	const handleStopScanner = useCallback(() => {
		if (scannerRef.current && scannerRunningRef.current) {
			scannerRef.current.stop().catch(() => {});
			scannerRunningRef.current = false;
		}
		scannerRef.current = null;
		setIsScannerOpen(false);
	}, []);

	// --- Pantalla de carga ---
	if (isLoadingInfo) {
		return (
			<main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 p-4 sm:p-8'>
				<div className='flex flex-col items-center gap-4'>
					<div className='h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent' />
					<p className='text-lg font-medium text-white/90'>
						Verificando disponibilidad del casillero...
					</p>
				</div>
			</main>
		);
	}

	// --- Pantalla de error (casillero no disponible o error de red) ---
	if (infoError) {
		return (
			<main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 p-4 sm:p-8'>
				<Card className='mx-auto max-w-lg border border-emerald-900/10 bg-white/90 shadow-2xl backdrop-blur-xl'>
					<CardBody className='p-8 text-center'>
						{!isScannerOpen ? (
							<>
								<div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500'>
									<Icon icon='HeroExclamationCircle' className='h-10 w-10' />
								</div>
								<h2 className='mt-6 text-2xl font-bold text-zinc-900'>
									Casillero No Disponible
								</h2>
								<p className='mt-3 text-zinc-600'>{infoError}</p>
								
								{/* Detectar si es un caso de retiro pendiente */}
								{(infoError.toLowerCase().includes('retiro') || infoError.toLowerCase().includes('listo')) && (
									<div className='mt-6 rounded-xl bg-blue-50 p-4 border border-blue-100 text-left'>
										<p className='text-sm text-blue-800 font-medium'>¿Vienes a retirar tu equipo?</p>
										<p className='text-xs text-blue-600 mt-1'>Usa la palabra clave que recibiste por correo para abrir el casillero.</p>
										<Button
											color='blue'
											variant='solid'
											className='mt-3 w-full justify-center py-2'
											onClick={() => window.location.href = '/lockers/check-out'}>
											Ir a Retiro de Equipo
										</Button>
									</div>
								)}

								{scannerError && (
									<p className='mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700'>
										{scannerError}
									</p>
								)}
								<div className='mt-8'>
									<Button
										color='emerald'
										variant='solid'
										icon='HeroQrCode'
										className='w-full justify-center rounded-xl py-3 font-semibold'
										onClick={() => setIsScannerOpen(true)}>
										Escanear otro casillero
									</Button>
								</div>
							</>
						) : (
							<>
								<h2 className='mb-4 text-xl font-bold text-zinc-900'>
									Escanea el QR de otro casillero
								</h2>
								<p className='mb-4 text-sm text-zinc-500'>
									Apunta la cámara al código QR del casillero disponible.
								</p>
								<div
									id='qr-reader'
									className='mx-auto overflow-hidden rounded-xl'
									style={{ width: '100%', maxWidth: 350 }}
								/>
								<div className='mt-4'>
									<Button
										color='zinc'
										variant='outline'
										className='w-full justify-center rounded-xl py-2'
										onClick={handleStopScanner}>
										Cancelar
									</Button>
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</main>
		);
	}

	// --- Pantalla de éxito (PIN recibido y modal ya cerrado) ---
	// Si el PIN fue recibido y el modal está cerrado, mostramos la pantalla
	// con las instrucciones completas y un botón para volver a ver el PIN
	if (isCheckInComplete && !isPinModalOpen) {
		return (
			<main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 p-4 sm:p-8'>
				<FormLockCareDecorations
					ornaments={floatingOrnaments}
					showEnhancedEffects={shouldRenderHeavyDecorations && decorationsReady}
				/>
				
				<div className='relative z-10 w-full max-w-5xl animate-in fade-in zoom-in duration-500'>
					<CheckInSuccessSteps 
						lockerNumber={lockerNumberReceived || '---'} 
						pin={pinReceived || '----'} 
					/>
				</div>

				{/* Botón flotante para volver a ver el PIN */}
				<button
					type='button'
					onClick={handleOpenPinModal}
					className='fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95'
					aria-label='Ver PIN de acceso'>
					<Icon icon='HeroKey' className='h-5 w-5' />
					Ver mi PIN
				</button>

				{/* Modal del PIN (se puede reabrir) */}
				<LockerPinModal
					isOpen={isPinModalOpen}
					pin={pinReceived}
					lockerNumber={lockerNumberReceived || '---'}
					onClose={handleClosePinModal}
				/>
			</main>
		);
	}

	// --- Formulario principal (reutilizando diseño del MVP) ---
	return (
		<main className='relative min-h-full overflow-hidden bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500 p-4 sm:p-8'>
			<FormLockCareDecorations
				ornaments={floatingOrnaments}
				showEnhancedEffects={shouldRenderHeavyDecorations && decorationsReady}
			/>

			<div className='relative z-10 mx-auto flex w-full max-w-6xl items-start py-2 sm:py-4'>
				<Card className='w-full border border-emerald-900/10 bg-white/85 shadow-2xl backdrop-blur-xl'>
					<CardHeader className='border-b border-zinc-200/70 px-6 py-5 sm:px-8'>
						<div className='flex w-full items-start justify-between gap-4'>
							<div className='space-y-2'>
								<div className='inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'>
									<Icon icon='HeroSparkles' className='h-4 w-4' />
									Ingreso de equipo
								</div>
								<CardTitle className='text-3xl font-bold text-zinc-800'>
									Ingrese un Ticket
								</CardTitle>
							</div>
							<div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-400'>
								<Icon icon='HeroTicket' className='h-7 w-7 text-white' />
							</div>
						</div>
					</CardHeader>

					<CardBody className='px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6'>
						<div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-[0.9fr_1.1fr]'>
							<FormLockCareGuidePanel
								showSteps={showStepsMobile}
								showChecklist={showChecklistMobile}
								onToggleSteps={handleToggleSteps}
								onToggleChecklist={handleToggleChecklist}
							/>

							<FormLockCareFormPanel
								formik={formik}
								onOpenTerms={handleOpenTerms}
							/>
						</div>
					</CardBody>
				</Card>
			</div>

			{isTerminosOpen && (
				<Suspense
					fallback={
						<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
							<div className='h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent' />
						</div>
					}>
					<TerminoCondiciones
						isOpen={isTerminosOpen}
						onClose={handleCloseTerms}
						onAccept={handleAcceptTerms}
					/>
				</Suspense>
			)}

			{/* Modal del PIN — se muestra inmediatamente después del registro exitoso */}
			<LockerPinModal
				isOpen={isPinModalOpen}
				pin={pinReceived}
				lockerNumber={lockerNumberReceived || '---'}
				onClose={handleClosePinModal}
			/>
		</main>
	);
};
