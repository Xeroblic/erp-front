	import React, {
	Suspense,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import FormLockCareDecorations from './components/FormLockCareDecorations';
import FormLockCareFormPanel from './components/FormLockCareFormPanel';
import FormLockCareGuidePanel from './components/FormLockCareGuidePanel';
import { FloatingOrnament, TicketFormValues } from './components/FormLockCare.types';
import { formLockCareValidationSchema } from './components/FormLockCare.validation';
import { selectIsDarkTheme, useAppSelector } from '@/store';

const TerminoCondiciones = React.lazy(() => import('./TerminoCondiciones'));

const initialValues: TicketFormValues = {
	name: '',
	email: '',
	phone: '',
	termsAccepted: false,
	requiresInvoice: '',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: '',
	// Reparación
	repairBrand: '',
	repairModel: '',
	repairSerialNumber: '',
	repairIncludesCharger: '',
	// Upgrade
	upgradeType: '',
	upgradeBrand: '',
	upgradeModel: '',
	upgradeSerialNumber: '',
	notes: '',
	message: '',
	attachments: [],
};

const FormLockCare: React.FC = () => {
	const [showStepsMobile, setShowStepsMobile] = useState(false);
	const [showChecklistMobile, setShowChecklistMobile] = useState(false);
	const [isTerminosOpen, setIsTerminosOpen] = useState(false);
	const [isDesktopViewport, setIsDesktopViewport] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const [decorationsReady, setDecorationsReady] = useState(false);
	const [floatingOrnaments, setFloatingOrnaments] = useState<FloatingOrnament[]>([]);
	const isDarkTheme = useAppSelector(selectIsDarkTheme);
	const latestThemePreferenceRef = useRef(isDarkTheme);

	useEffect(() => {
		latestThemePreferenceRef.current = isDarkTheme;
	}, [isDarkTheme]);

	useLayoutEffect(() => {
		if (typeof document === 'undefined') return undefined;

		const root = document.documentElement;
		const previousColorScheme = root.style.getPropertyValue('color-scheme');

		// Remover oscuridad
		root.classList.remove('dark');
		root.style.setProperty('color-scheme', 'light');

		// Mutar si algún otro componente intenta forzar el modo dark
		const observer = new MutationObserver(() => {
			if (root.classList.contains('dark')) {
				root.classList.remove('dark');
			}
		});

		observer.observe(root, { attributes: true, attributeFilter: ['class'] });

		return () => {
			observer.disconnect();

			// Restaurar estado
			if (latestThemePreferenceRef.current) {
				root.classList.add('dark');
			} else {
				root.classList.remove('dark');
			}

			if (previousColorScheme) {
				root.style.setProperty('color-scheme', previousColorScheme);
			} else {
				root.style.removeProperty('color-scheme');
			}
		};
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return;
		}

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

			const utilsModule = await import('./components/FormLockCare.utils');
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
		setShowStepsMobile((prevState) => !prevState);
	}, []);

	const handleToggleChecklist = useCallback(() => {
		setShowChecklistMobile((prevState) => !prevState);
	}, []);

	const handleOpenTerms = useCallback(() => {
		setIsTerminosOpen(true);
	}, []);

	const handleCloseTerms = useCallback(() => {
		setIsTerminosOpen(false);
	}, []);

	const formik = useFormik<TicketFormValues>({
		initialValues,
		validationSchema: formLockCareValidationSchema,
		validateOnBlur: true,
		validateOnChange: false,
		onSubmit: async (values, helpers) => {
			try {
				console.log('Public service payload', values);
				await Promise.resolve();
				toast.success('Formulario enviado correctamente');
				helpers.resetForm();
				setIsTerminosOpen(false);
			} catch (error) {
				console.error('Error submitting form:', error);
				toast.error('No se pudo enviar el formulario. Intenta nuevamente.');
			} finally {
				helpers.setSubmitting(false);
			}
		},
	});

	const handleAcceptTerms = useCallback(() => {
		formik.setFieldValue('termsAccepted', true);
		formik.setFieldTouched('termsAccepted', true, true);
	}, [formik]);

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
									Ingreso de ticket
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

							<FormLockCareFormPanel formik={formik} onOpenTerms={handleOpenTerms} />
						</div>
					</CardBody>
				</Card>
			</div>

			{isTerminosOpen && (
				<Suspense fallback={null}>
					<TerminoCondiciones
						isOpen={isTerminosOpen}
						onClose={handleCloseTerms}
						onAccept={handleAcceptTerms}
					/>
				</Suspense>
			)}
		</main>
	);
};

export default FormLockCare;
