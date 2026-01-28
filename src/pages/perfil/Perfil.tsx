import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import gsap from 'gsap';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ImageZoom } from '@/components/ImageZoom';
import useSaveBtn from '@/hooks/useSaveBtn';
import useDarkModeManager from '@/hooks/useDarkModeManager';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectDarkMode } from '@/store/slices/personalizacion/personalizacionSlice';
import { userMeThunk } from '@/store/slices/auth/authSlice';
import {
	listaRegionesThunk,
	listaProvinciasThunk,
	listaComunasThunk,
} from '@/store/slices/core/coreSlice';
import ApiService from '@/services/ApiService';
import ProfileHeader from './components/ProfileHeader';
import EditProfileTab from './components/tabs/EditProfileTab';
import ContactTab from './components/tabs/ContactTab';
import { ProfileFormValues, ProfileTabDefinition, ProfileTabKey } from './components/types';
import { toApiDate, toInputDate } from '@/utils/dateNormalize.util';
import { buildProfileValidationSchema } from './components/validation/profile.validation';
import {
	toGenderApiValue,
	toGenderFormValue,
	normalizeInitialGeoFromUser,
} from './components/helpers/profile.helpers';
import { useProfileGeo } from './components/hooks/useProfileGeo';
import { useProfileAvatar } from './components/hooks/useProfileAvatar';
import { useProfileTheme } from './components/hooks/useProfileTheme';
import Card, { CardBody } from '@/components/ui/Card';

const PROFILE_TABS: ProfileTabDefinition[] = [
	{ key: 'EDIT', label: 'Editar Perfil', icon: 'HeroPencil' },
	{ key: 'CONTACT', label: 'Contacto', icon: 'HeroGlobeAmericas' },
];

const Perfil = () => {
	const dispatch = useAppDispatch();
	const { setDarkModeStatus } = useDarkModeManager();
	const { user: userData } = useAppSelector((state) => state.auth);
	const darkMode = useAppSelector(selectDarkMode);
	const { listaComunas, listaProvincias, listaRegiones } = useAppSelector((state) => state.core);

	const [activeTab, setActiveTab] = useState<ProfileTabKey>('EDIT');
	const [optionsRegion, setOptionsRegion] = useState<any[]>([]);
	const [optionsProvincia, setOptionsProvincia] = useState<any[]>([]);
	const [optionsComuna, setOptionsComuna] = useState<any[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	// Refs para animaciones GSAP
	const containerRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const avatarRef = useRef<HTMLDivElement>(null);
	const tabsRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const indicatorRef = useRef<HTMLDivElement>(null);
	const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		dispatch(userMeThunk() as any);
	}, [dispatch]);

	useEffect(() => {
		if (!listaRegiones.length) dispatch(listaRegionesThunk());
		if (!listaProvincias.length) dispatch(listaProvinciasThunk());
		if (!listaComunas.length) dispatch(listaComunasThunk());
	}, [dispatch, listaRegiones.length, listaProvincias.length, listaComunas.length]);

	// Animación inicial GSAP
	useEffect(() => {
		const ctx = gsap.context(() => {
			const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			// Avatar scale + fade
			if (avatarRef.current) {
				tl.fromTo(
					avatarRef.current,
					{ scale: 0.8, opacity: 0, y: 20 },
					{ scale: 1, opacity: 1, y: 0, duration: 0.6 },
					0,
				);
			}

			// Header slide
			if (headerRef.current) {
				tl.fromTo(
					headerRef.current,
					{ opacity: 0, x: 30 },
					{ opacity: 1, x: 0, duration: 0.5 },
					0.15,
				);
			}

			// Tabs slide up
			if (tabsRef.current) {
				tl.fromTo(
					tabsRef.current,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.4 },
					0.25,
				);
			}

			// Content fade
			if (contentRef.current) {
				tl.fromTo(
					contentRef.current,
					{ opacity: 0, y: 15 },
					{ opacity: 1, y: 0, duration: 0.4 },
					0.35,
				);
			}
		}, containerRef);

		return () => ctx.revert();
	}, []);

	// Animación del indicador de tab
	useEffect(() => {
		const activeIndex = PROFILE_TABS.findIndex((t) => t.key === activeTab);
		const activeButton = tabButtonsRef.current[activeIndex];
		if (activeButton && indicatorRef.current) {
			gsap.to(indicatorRef.current, {
				x: activeButton.offsetLeft,
				width: activeButton.offsetWidth,
				duration: 0.3,
				ease: 'power2.inOut',
			});
		}
	}, [activeTab]);

	const userId = userData?.id ?? (userData as any)?.pk ?? null;
	const formik = useFormik<ProfileFormValues>({
		enableReinitialize: true,
		initialValues: {
			email: userData?.email ?? '',
			first_name: userData?.first_name ?? '',
			second_name: userData?.second_name ?? (userData as any)?.middle_name ?? '',
			last_name: userData?.last_name ?? '',
			second_last_name: userData?.second_last_name ?? '',
			rut: userData?.rut ?? '',
			phone_number: userData?.celular ?? userData?.phone_number ?? '',
			direccion: userData?.direccion ?? userData?.address ?? '',
			...normalizeInitialGeoFromUser(userData as any),
			genero: toGenderFormValue((userData as any)?.genero ?? userData?.gender),
			theme: darkMode === 'light' ? 'light' : darkMode === 'dark' ? 'dark' : 'system',
			fecha_nacimiento: toInputDate(
				(userData as any)?.fecha_nacimiento ?? (userData as any)?.date_of_birth ?? '',
			),
		},
		validationSchema: buildProfileValidationSchema(),
		onSubmit: async (values) => {
			if (!userId) {
				toast.error('No se encontro la informacion del usuario activo');
				return;
			}

			setIsSaving(true);
			const toNumber = (value?: string) => {
				if (!value) return null;
				const parsed = parseInt(value, 10);
				return Number.isNaN(parsed) ? null : parsed;
			};

			try {
				const trimOrNull = (value?: string | null) => {
					if (value == null) return null;
					const trimmed = value.trim();
					return trimmed.length > 0 ? trimmed : null;
				};

				const payload = {
					first_name: values.first_name?.trim() ?? '',
					middle_name: trimOrNull(values.second_name),
					last_name: values.last_name?.trim() ?? '',
					second_last_name: trimOrNull(values.second_last_name),
					rut: values.rut?.trim() ?? '',
					phone_number: trimOrNull(values.phone_number),
					address: trimOrNull(values.direccion),
					gender: toGenderApiValue(values.genero),
					fecha_nacimiento: toApiDate(values.fecha_nacimiento),
					date_of_birth: toApiDate(values.fecha_nacimiento),
				};

				await ApiService.fetchData({
					url: `/users/${userId}`,
					method: 'patch',
					data: payload,
				});

				const comunaId = toNumber(values.comuna);
				if (comunaId !== null) {
					await ApiService.fetchData({
						url: `/me/commune`,
						method: 'patch',
						data: { commune_id: comunaId },
					});
				}

				toast.success('Perfil actualizado');
				await dispatch(userMeThunk() as any);
			} catch (error: any) {
				toast.error(error?.message ?? 'No se pudo actualizar el perfil');
			} finally {
				setIsSaving(false);
			}
		},
	});

	const geo = useProfileGeo(formik as any, listaRegiones, listaProvincias, listaComunas);
	useEffect(() => {
		setOptionsRegion(geo.optionsRegion);
		setOptionsProvincia(geo.optionsProvincia);
		setOptionsComuna(geo.optionsComuna);
	}, [geo.optionsRegion, geo.optionsProvincia, geo.optionsComuna]);

	useEffect(() => {
		let mounted = true;
		async function trySetFromUserOrRefresh() {
			if (!userData) return;
			if (formik.values.comuna) return;

			const anyUser: any = userData as any;
			const foundId =
				anyUser?.comuna ??
				anyUser?.comuna_id ??
				anyUser?.commune?.id ??
				anyUser?.commune?.pk ??
				anyUser?.commune_id ??
				null;
			if (foundId) {
				if (mounted) formik.setFieldValue('comuna', String(foundId), false);
				return;
			}

			try {
				const full = await ApiService.fetchData<any>({ url: '/perfil', method: 'get' });
				const payload = full.data?.data ?? full.data?.user ?? full.data ?? null;
				const remoteId =
					payload?.comuna_id ?? payload?.comune?.id ?? payload?.commune?.id ?? null;
				if (mounted && remoteId) {
					formik.setFieldValue('comuna', String(remoteId), false);
				}
			} catch (err) {
				// silently fail
			}
		}
		trySetFromUserOrRefresh();
		return () => {
			mounted = false;
		};
	}, [userData, formik.values.comuna]);

	useProfileTheme(formik as any, darkMode, setDarkModeStatus);

	const { saveBtnText, saveBtnColor, saveBtnDisable } = useSaveBtn({
		isNewItem: false,
		isSaving,
		isDirty: formik.dirty,
	});

	const { avatarUrl, handleAvatarUpload } = useProfileAvatar(userData as any, userId, dispatch);

	const fullName = `${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`.trim();
	const userEmail = userData?.email ?? '';

	const handleTabChange = (key: ProfileTabKey) => {
		// Animar salida del contenido actual
		if (contentRef.current) {
			gsap.to(contentRef.current, {
				opacity: 0,
				y: -10,
				duration: 0.15,
				ease: 'power2.in',
				onComplete: () => {
					setActiveTab(key);
					// Animar entrada del nuevo contenido
					gsap.fromTo(
						contentRef.current,
						{ opacity: 0, y: 10 },
						{ opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
					);
				},
			});
		} else {
			setActiveTab(key);
		}
	};

	return (
		<PageWrapper isProtectedRoute name={formik.values.first_name}>
			<ProfileHeader
				fullName={fullName}
				onSubmit={formik.handleSubmit}
				saveButton={{ text: saveBtnText, color: saveBtnColor, disabled: saveBtnDisable }}
			/>
			<Container className='h-full py-6'>
				<div ref={containerRef} className='mx-auto max-w-5xl'>
					<div
						ref={containerRef}
						className='group/hero relative mb-8 min-h-[220px] w-full overflow-hidden rounded-3xl bg-neutral-200 shadow-2xl dark:bg-neutral-800'>
						<div className='absolute inset-0 z- overflow-hidden'>
							<div className='absolute right-0 top-0 flex h-full w-[90%] items-center justify-center transition-transform duration-700 ease-out will-change-transform group-hover/hero:scale-105 md:w-[50%]'>
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt='Cover'
										className='h-full w-full object-cover object-center drop-shadow-2xl'
									/>
								) : (
									<div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600'>
										<span className='text-8xl font-bold text-white/20'>
											{fullName
												.split(' ')
												.map((n) => n[0])
												.join('')
												.slice(0, 2)
												.toUpperCase()}
										</span>
									</div>
								)}
							</div>
							<div className='absolute inset-0 bg-black/10 dark:bg-black/30' />
						</div>

						<div
							className='relative z-1 flex h-full min-h-[220px] w-[65%] items-center bg-white dark:bg-neutral-900'
							style={{
								clipPath:
									'polygon(0% 0%, 100% 0%, 85% 60%, 95% 60%, 95% 85%, 100% 100%, 0% 100%)',
								WebkitClipPath:
									'polygon(0% 0%, 100% 0%, 85% 60%, 95% 60%, 85% 100%, 100% 100%, 0% 100%)',
							}}>
							<div className='flex w-full items-center gap-6 p-6 pr-20 md:p-10 md:pr-24'>
								<div ref={avatarRef} className='relative flex-shrink-0'>
									<ImageZoom
										imageUrl={avatarUrl || ''}
										alt={fullName}
										withModal
										modalTitle='Foto de perfil'
										modalSubtitle='Puedes acercar y mover la imagen'
										renderTrigger={(open) => (
											<div
												onClick={avatarUrl ? open : undefined}
												className={`relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-neutral-800 sm:h-28 sm:w-28 ${
													avatarUrl ? 'cursor-pointer' : ''
												}`}>
												{avatarUrl ? (
													<img
														src={avatarUrl}
														alt={fullName}
														className='h-full w-full object-cover transition-transform duration-500 hover:scale-110'
													/>
												) : (
													<div className='flex h-full w-full items-center justify-center bg-neutral-200 text-2xl font-bold dark:bg-neutral-700'>
														{fullName[0]}
													</div>
												)}
											</div>
										)}
									/>
									{/* Botón Cámara */}
									{/* <button
										onClick={() =>
											document.getElementById('avatar-upload')?.click()
										}
										className='absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-110'>
										<Icon icon='HeroCamera' className='h-4 w-4' />
									</button> */}
								</div>

								{/* Texto */}
								<div ref={headerRef} className='flex-1'>
									<h1 className='text-xl font-bold text-neutral-900 dark:text-white md:text-3xl'>
										{fullName || 'Usuario'}
									</h1>
									<p className='mb-3 text-sm text-neutral-500 dark:text-neutral-400'>
										{userEmail}
									</p>
									<div className='flex flex-wrap gap-2'>
										<span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'>
											<Icon icon='HeroCheckBadge' className='h-3.5 w-3.5' />{' '}
											Verificado
										</span>
										<span className='inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'>
											<Icon icon='HeroUser' className='h-3.5 w-3.5' /> Activo
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Tabs Navigation */}
					<div
						ref={tabsRef}
						className='relative mb-4 mt-4'
						style={{ willChange: 'transform, opacity' }}>
						<div className='relative flex gap-2 rounded-2xl bg-neutral-100/80 p-1.5 backdrop-blur-sm dark:bg-neutral-800/60'>
							{/* Sliding indicator */}
							<div
								ref={indicatorRef}
								className='absolute left-1.5 top-1.5 h-[calc(100%-12px)] rounded-xl bg-white shadow-md transition-shadow dark:bg-neutral-700'
								style={{ willChange: 'transform, width' }}
							/>

							{PROFILE_TABS.map((tab, index) => (
								<button
									key={tab.key}
									ref={(el) => {
										tabButtonsRef.current[index] = el;
									}}
									type='button'
									onClick={() => handleTabChange(tab.key)}
									className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
										activeTab === tab.key
											? 'text-neutral-900 dark:text-white'
											: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
									}`}>
									<Icon icon={tab.icon} className='h-4 w-4' />
									{tab.label}
								</button>
							))}
						</div>
					</div>

					{/* Tab Content */}
					<div
						ref={contentRef}
						className='rounded-3xl border border-neutral-200/50 bg-white/80 p-6 shadow-xl shadow-neutral-900/5 backdrop-blur-sm dark:border-white/5 dark:bg-neutral-900/60 sm:p-8'
						style={{ willChange: 'transform, opacity' }}>
						{activeTab === 'EDIT' && (
							<EditProfileTab
								formik={formik}
								onAvatarUpload={handleAvatarUpload}
								avatarUrl={avatarUrl}
							/>
						)}
						{activeTab === 'CONTACT' && (
							<ContactTab
								formik={formik}
								regionOptions={optionsRegion}
								provinceOptions={optionsProvincia}
								comunaOptions={optionsComuna}
							/>
						)}
					</div>

					{/* Footer Save Button (Mobile) */}
					<div className='mt-6 flex justify-end sm:hidden'>
						<Button
							icon='HeroServer'
							variant='solid'
							color={saveBtnColor}
							isDisable={saveBtnDisable}
							onClick={() => formik.handleSubmit()}
							className='w-full'>
							{saveBtnText}
						</Button>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default Perfil;
