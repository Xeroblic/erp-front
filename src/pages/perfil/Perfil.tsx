import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
// Validación y helpers extraídos
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardFooter, CardFooterChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
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
import useCompanyManager from '@/hooks/useCompanyManager';
import ApiService from '@/services/ApiService';
// import { TDarkMode } from '@/types/darkMode.type';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import EditProfileTab from './components/tabs/EditProfileTab';
import ContactTab from './components/tabs/ContactTab';
import AppearanceTab from './components/tabs/AppearanceTab';
import { ProfileFormValues, ProfileTabDefinition, ProfileTabKey } from './components/types';
import { toApiDate, toInputDate } from '@/utils/dateNormalize.util';
import { buildProfileValidationSchema } from './components/validation/profile.validation';
import {
	buildProfileUpdatePayload,
	normalizeInitialGeoFromUser,
	toGenderApiValue,
	toGenderFormValue,
} from './components/helpers/profile.helpers';
import { useProfileGeo } from './components/hooks/useProfileGeo';
import { useProfileAvatar } from './components/hooks/useProfileAvatar';
import { useProfileTheme } from './components/hooks/useProfileTheme';

const PROFILE_TABS: ProfileTabDefinition[] = [
	{ key: 'EDIT', label: 'Editar Perfil', icon: 'HeroPencil' },
	{ key: 'CONTACT', label: 'Contacto', icon: 'HeroGlobeAmericas' },
	{ key: 'APPEARANCE', label: 'Apariencia', icon: 'HeroSwatch' },
];

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_AVATAR_FILE_SIZE_MB = 5;

const Perfil = () => {
	const dispatch = useAppDispatch();
	const { setDarkModeStatus } = useDarkModeManager();
	const { user: userData } = useAppSelector((state) => state.auth);
	const darkMode = useAppSelector(selectDarkMode);
	const { currentCompany } = useCompanyManager();
	const { listaComunas, listaProvincias, listaRegiones } = useAppSelector((state) => state.core);

	const [activeTab, setActiveTab] = useState<ProfileTabKey>('EDIT');
	const [optionsRegion, setOptionsRegion] = useState<any[]>([]);
	const [optionsProvincia, setOptionsProvincia] = useState<any[]>([]);
	const [optionsComuna, setOptionsComuna] = useState<any[]>([]);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		dispatch(userMeThunk() as any);
	}, [dispatch]);

	useEffect(() => {
		if (!listaRegiones.length) dispatch(listaRegionesThunk());
		if (!listaProvincias.length) dispatch(listaProvinciasThunk());
		if (!listaComunas.length) dispatch(listaComunasThunk());
	}, [dispatch, listaRegiones.length, listaProvincias.length, listaComunas.length]);

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

	useProfileTheme(formik as any, darkMode, setDarkModeStatus);

	const { saveBtnText, saveBtnColor, saveBtnDisable } = useSaveBtn({
		isNewItem: false,
		isSaving,
		isDirty: formik.dirty,
	});

	const { avatarUrl, handleAvatarUpload } = useProfileAvatar(userData as any, userId, dispatch);

	const fullName = `${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`.trim();

	return (
		<PageWrapper isProtectedRoute={true} name={formik.values.first_name}>
			<ProfileHeader
				fullName={fullName}
				onSubmit={formik.handleSubmit}
				saveButton={{ text: saveBtnText, color: saveBtnColor, disabled: saveBtnDisable }}
			/>
			<Container className='h-full'>
				<Card className='h-full'>
					<CardBody>
						<div className='grid grid-cols-12 gap-4'>
							<ProfileTabs
								tabs={PROFILE_TABS}
								activeTab={activeTab}
								onTabChange={setActiveTab}
							/>
							<div className='col-span-12 flex flex-col gap-4 sm:col-span-8 md:col-span-10'>
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
								{activeTab === 'APPEARANCE' && (
									<AppearanceTab
										formik={formik}
										currentCompany={currentCompany}
									/>
								)}
							</div>
						</div>
					</CardBody>
					<CardFooter>
						<CardFooterChild />
						<CardFooterChild>
							<Button
								icon='HeroServer'
								variant='solid'
								color={saveBtnColor}
								isDisable={saveBtnDisable}
								onClick={() => formik.handleSubmit()}>
								{saveBtnText}
							</Button>
						</CardFooterChild>
					</CardFooter>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default Perfil;
