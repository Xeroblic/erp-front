import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	ackNotification,
	deleteNotification,
	fetchNotifications,
	markRead,
} from '@/store/slices/notifications/notificationsSlice';
import useThemeColorGlobal from '@/hooks/useThemeColorGlobal';

const timeAgo = (iso?: string | null) => {
	if (!iso) return '';
	const diff = Date.now() - new Date(iso).getTime();
	const m = Math.max(0, Math.floor(diff / 60000));
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	const d = Math.floor(h / 24);
	return `${d}d`;
};

const NotificationDetail: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { items, loading } = useAppSelector(
		(s) => s.notifications ?? { items: [], loading: false },
	);
	const { themeColor, themeColorShade } = useThemeColorGlobal();

	// Refs para animaciones GSAP
	const containerRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const actionsRef = useRef<HTMLDivElement>(null);
	const detailsRef = useRef<HTMLDivElement>(null);
	const topBarRef = useRef<HTMLDivElement>(null);
	const hoverAnimationRef = useRef<Map<Element, gsap.core.Tween>>(new Map());

	const nid = Number(id);
	const notif = useMemo(() => items.find((n) => n.id === nid), [items, nid]);

	useEffect(() => {
		if (!notif) {
			dispatch(fetchNotifications({ per_page: 50 })).catch(() => void 0);
		}
	}, [dispatch, notif]);

	// Animaciones GSAP consolidadas y optimizadas
	useEffect(() => {
		if (!notif) return;

		const ctx = gsap.context(() => {
			// Timeline principal de entrada
			const tl = gsap.timeline({
				defaults: { ease: 'power3.out' },
				onComplete: () => {
					// Limpiar will-change después de las animaciones para liberar recursos
					if (containerRef.current) {
						containerRef.current.style.willChange = 'auto';
					}
				},
			});

			// Aplicar will-change para GPU acceleration
			if (containerRef.current) {
				containerRef.current.style.willChange = 'transform, opacity';
			}

			// Botón de volver con entrada desde arriba
			if (topBarRef.current) {
				gsap.set(topBarRef.current, { force3D: true });
				tl.fromTo(
					topBarRef.current,
					{ opacity: 0, y: -20 },
					{ opacity: 1, y: 0, duration: 0.4 },
					0,
				);
			}

			// Header con escala y fade
			if (headerRef.current) {
				gsap.set(headerRef.current, { force3D: true });
				tl.fromTo(
					headerRef.current,
					{ opacity: 0, scale: 0.95, y: 20 },
					{ opacity: 1, scale: 1, y: 0, duration: 0.6 },
					0.1,
				);
			}

			// Botones de acción con slide desde la derecha
			if (actionsRef.current) {
				const buttons = actionsRef.current.querySelectorAll('button');
				gsap.set(buttons, { force3D: true });
				tl.fromTo(
					buttons,
					{ opacity: 0, x: 20 },
					{ opacity: 1, x: 0, stagger: 0.08, duration: 0.4 },
					0.3,
				);
			}

			// Detalles con stagger en cascada
			if (detailsRef.current) {
				const cards = detailsRef.current.querySelectorAll('.detail-card');
				gsap.set(cards, { force3D: true });
				tl.fromTo(
					cards,
					{ opacity: 0, y: 30, scale: 0.95 },
					{ opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5 },
					0.4,
				);

				// Delegación de eventos para hover optimizado
				const handleMouseEnter = (e: Event) => {
					const target = (e.target as HTMLElement).closest('.detail-card') as HTMLElement;
					if (!target) return;

					// Cancelar animación anterior si existe
					const existingTween = hoverAnimationRef.current.get(target);
					if (existingTween) {
						existingTween.kill();
					}

					const tween = gsap.to(target, {
						y: -4,
						duration: 0.3,
						ease: 'power2.out',
						overwrite: 'auto',
					});
					hoverAnimationRef.current.set(target, tween);
				};

				const handleMouseLeave = (e: Event) => {
					const target = (e.target as HTMLElement).closest('.detail-card') as HTMLElement;
					if (!target) return;

					// Cancelar animación anterior si existe
					const existingTween = hoverAnimationRef.current.get(target);
					if (existingTween) {
						existingTween.kill();
					}

					const tween = gsap.to(target, {
						y: 0,
						duration: 0.3,
						ease: 'power2.inOut',
						overwrite: 'auto',
					});
					hoverAnimationRef.current.set(target, tween);
				};

				// Usar delegación de eventos en el contenedor
				detailsRef.current.addEventListener('mouseenter', handleMouseEnter, true);
				detailsRef.current.addEventListener('mouseleave', handleMouseLeave, true);

				// Cleanup de event listeners
				return () => {
					if (detailsRef.current) {
						detailsRef.current.removeEventListener(
							'mouseenter',
							handleMouseEnter,
							true,
						);
						detailsRef.current.removeEventListener(
							'mouseleave',
							handleMouseLeave,
							true,
						);
					}
					// Limpiar todas las animaciones de hover
					hoverAnimationRef.current.forEach((tween) => tween.kill());
					hoverAnimationRef.current.clear();
				};
			}
		}, containerRef);

		return () => ctx.revert();
	}, [notif]);

	// Memoizar funciones de acciones para evitar re-renders
	const markAsRead = useCallback(() => {
		if (notif && notif.status !== 'read') {
			dispatch(markRead({ id: notif.id }));
			// Animación de confirmación optimizada
			if (headerRef.current) {
				gsap.to(headerRef.current, {
					scale: 1.02,
					duration: 0.2,
					yoyo: true,
					repeat: 1,
					ease: 'power2.inOut',
					force3D: true,
				});
			}
		}
	}, [notif, dispatch]);

	const archive = useCallback(() => {
		if (notif) {
			dispatch(ackNotification({ id: notif.id }));
			// Animación de salida optimizada
			if (containerRef.current) {
				gsap.to(containerRef.current, {
					opacity: 0,
					y: -20,
					duration: 0.4,
					ease: 'power2.in',
					force3D: true,
					onComplete: () => navigate('/notificaciones'),
				});
			}
		}
	}, [notif, dispatch, navigate]);

	const remove = useCallback(() => {
		if (notif) {
			// Animación de salida antes de eliminar
			if (containerRef.current) {
				gsap.to(containerRef.current, {
					opacity: 0,
					scale: 0.95,
					duration: 0.3,
					ease: 'power2.in',
					force3D: true,
					onComplete: () => {
						dispatch(deleteNotification({ id: notif.id }));
						navigate('/notificaciones');
					},
				});
			}
		}
	}, [notif, dispatch, navigate]);

	// Memoizar el icono para evitar cálculos repetidos
	const notificationIcon = useMemo((): string => {
		const module = notif?.event?.module ?? '';
		const bucket = notif?.bucket ?? '';

		if (bucket === 'Important') return 'HeroExclamationTriangle';
		if (module.toLowerCase().includes('inventario')) return 'HeroArchiveBox';
		if (module.toLowerCase().includes('producto')) return 'HeroCube';
		if (module.toLowerCase().includes('supplier') || module.toLowerCase().includes('proveedor'))
			return 'HeroTruck';
		return 'HeroBell';
	}, [notif?.event?.module, notif?.bucket]);

	// Memoizar el procesamiento de tarjetas de detalles
	const { cards, extraEntries } = useMemo(() => {
		const payload = (notif?.event?.payload ?? {}) as Record<string, any>;
		const cardsList: Array<{ key: string; label: string; value: string }> = [];

		const add = (key: string, label: string) => {
			const v = payload[key];
			if (v !== undefined && v !== null && String(v).trim() !== '') {
				cardsList.push({ key, label, value: String(v) });
			}
		};

		// Mapeo de campos comunes en español
		add('customer_supplier_name', 'Cliente-Proveedor');
		add('supplier_names', 'Proveedores');
		add('suppliers_count', 'Cantidad de Proveedores');
		add('product_name', 'Producto');
		add('sku', 'SKU');
		add('brand_name', 'Marca');
		add('category_name', 'Categoría');
		add('warehouse_name', 'Bodega');
		add('batch_code', 'Lote');
		add('expected_quantity', 'Cantidad Esperada');
		add('branch_name', 'Sucursal');
		add('subsidiary_name', 'Subempresa');
		add('company_name', 'Empresa');
		add('created_by', 'Creado Por');
		add('updated_by', 'Actualizado Por');
		add('action', 'Acción');

		const usedKeys = new Set(cardsList.map((c) => c.key));
		const extraEntriesList = Object.entries(payload).filter(
			([k, v]) => !usedKeys.has(k) && v !== null && v !== undefined,
		);

		return { cards: cardsList, extraEntries: extraEntriesList };
	}, [notif?.event?.payload]);

	return (
		<PageWrapper
			isProtectedRoute
			title='Detalle de Notificación'
			name='Detalle de Notificación'>
			<Container>
				<div ref={containerRef} className='mx-auto max-w-7xl'>
					{/* Header con botón de volver */}
					<div ref={topBarRef} className='mb-6'>
						<Button
							size='sm'
							variant='outline'
							icon='HeroArrowLeft'
							onClick={() => navigate('/notificaciones')}
							className='transition-transform hover:scale-105'>
							Volver
						</Button>
					</div>

					<Card className='overflow-hidden shadow-xl'>
						<CardHeader className='border-b border-zinc-200 dark:border-zinc-800'>
							<CardHeaderChild>
								<CardTitle>Detalle de Notificación</CardTitle>
							</CardHeaderChild>
							<CardHeaderChild>
								<div ref={actionsRef} className='flex flex-wrap gap-2'>
									{notif?.status !== 'read' && (
										<Button
											size='sm'
											variant='solid'
											color='emerald'
											onClick={markAsRead}
											className='transition-all hover:scale-105'>
											Marcar Leída
										</Button>
									)}
									<Button
										size='sm'
										variant='solid'
										color={themeColor}
										onClick={archive}
										className='transition-all hover:scale-105'>
										Archivar
									</Button>
									<Button
										size='sm'
										variant='solid'
										color='red'
										onClick={remove}
										className='transition-all hover:scale-105'>
										Eliminar
									</Button>
								</div>
							</CardHeaderChild>
						</CardHeader>

						<CardBody className='space-y-6 p-6'>
							{!notif && (
								<div className='py-12 text-center text-zinc-500'>
									{loading
										? 'Cargando notificación...'
										: 'Notificación no encontrada'}
								</div>
							)}

							{notif && (
								<>
									{/* Header de la notificación */}
									<div
										ref={headerRef}
										className='flex items-start gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50'>
										{/* Icono grande con colores del tema */}
										<div
											className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-md'
											style={{
												backgroundColor: `var(--color-primary-100)`,
											}}>
											<Icon
												icon={notificationIcon}
												className='text-3xl'
												style={{
													color: `var(--color-primary-600)`,
												}}
											/>
										</div>

										{/* Contenido principal */}
										<div className='min-w-0 flex-1'>
											<div className='mb-3 flex flex-wrap items-start gap-2'>
												<h2 className='text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
													{notif.event?.type_label ??
														notif.event?.type_key ??
														'Notificación'}
												</h2>
											</div>

											{/* Badges de estado y módulo con px-2 */}
											<div className='mb-4 flex flex-wrap items-center gap-2'>
												<Badge
													variant='outline'
													color={themeColor}
													colorIntensity={themeColorShade}
													className='px-2 font-semibold'>
													<Icon
														icon='HeroRectangleStack'
														className='mr-1 h-4 w-4'
													/>
													{notif.event?.module_label ??
														notif.event?.module ??
														'Sistema'}
												</Badge>

												{notif.bucket === 'Important' && (
													<Badge
														variant='solid'
														color='red'
														className='animate-pulse px-2'>
														<Icon
															icon='HeroExclamationTriangle'
															className='mr-1 h-4 w-4'
														/>
														Importante
													</Badge>
												)}

												{notif.status !== 'read' ? (
													<Badge
														variant='solid'
														color='emerald'
														className='px-2'>
														<span className='mr-1.5 h-2 w-2 animate-pulse rounded-full bg-white' />
														No Leída
													</Badge>
												) : (
													<Badge
														variant='outline'
														color='zinc'
														className='px-2'>
														<Icon
															icon='HeroCheckCircle'
															className='mr-1 h-4 w-4'
														/>
														Leída
													</Badge>
												)}
											</div>

											{/* Mensaje */}
											<p className='mb-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300'>
												{notif.message ?? ''}
											</p>

											{/* Timestamp */}
											<div className='flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400'>
												<Icon icon='HeroClock' className='h-4 w-4' />
												<span>Hace {timeAgo(notif.created_at)}</span>
												{notif.created_at && (
													<span className='text-xs'>
														•{' '}
														{new Date(notif.created_at).toLocaleString(
															'es-CL',
														)}
													</span>
												)}
											</div>
										</div>
									</div>

									{/* Alerta para notificaciones importantes */}
									{notif.bucket === 'Important' && (
										<Alert
											variant='outline'
											color='amber'
											icon='HeroExclamationTriangle'
											className='detail-card'>
											Esta notificación requiere tu atención inmediata.
										</Alert>
									)}

									{/* Grid de detalles */}
									{cards.length > 0 && (
										<div ref={detailsRef} className='space-y-4'>
											<h3 className='flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50'>
												<Icon
													icon='HeroInformationCircle'
													className='h-5 w-5'
												/>
												Detalles
											</h3>
											<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
												{cards.map((c) => (
													<div
														key={c.key}
														className='detail-card group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'>
														{/* Barra superior con color del tema */}
														<div
															className='absolute left-0 top-0 h-1 w-full scale-x-0 transform transition-transform duration-300 group-hover:scale-x-100'
															style={{
																backgroundColor: `var(--color-primary-${themeColorShade})`,
															}}
														/>
														<div className='mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
															{c.label}
														</div>
														<div className='break-words text-base font-medium text-zinc-900 dark:text-zinc-50'>
															{c.value}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Información adicional */}
									{extraEntries.length > 0 && (
										<div className='detail-card space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
											<h3 className='flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50'>
												<Icon icon='HeroListBullet' className='h-5 w-5' />
												Información Adicional
											</h3>
											<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
												{extraEntries.map(([k, v]) => (
													<div key={k} className='flex flex-col gap-1'>
														<div className='text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
															{k}
														</div>
														<div className='break-words text-sm font-medium text-zinc-800 dark:text-zinc-200'>
															{String(v)}
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</>
							)}
						</CardBody>
					</Card>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default NotificationDetail;
