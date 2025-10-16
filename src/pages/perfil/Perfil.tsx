import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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
import useCompanyManager from '@/hooks/useCompanyManager';
import ApiService from '@/services/ApiService';
import type { TSelectOption } from '@/components/form/SelectReact';
import { TDarkMode } from '@/types/darkMode.type';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabs from './components/ProfileTabs';
import EditProfileTab from './components/tabs/EditProfileTab';
import ContactTab from './components/tabs/ContactTab';
import AppearanceTab from './components/tabs/AppearanceTab';
import { ProfileFormValues, ProfileTabDefinition, ProfileTabKey } from './components/types';

const PROFILE_TABS: ProfileTabDefinition[] = [
  { key: 'EDIT', label: 'Editar Perfil', icon: 'HeroPencil' },
  { key: 'CONTACT', label: 'Contacto', icon: 'HeroGlobeAmericas' },
  { key: 'APPEARANCE', label: 'Apariencia', icon: 'HeroSwatch' },
];

const NAME_REGEX = /^[A-Za-zÀ-ÿ'`´\s-]+$/;
const RUT_REGEX = /^(?:\d{1,2}\.\d{3}\.\d{3}|\d{7,8})-[\dkK]$/;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_AVATAR_FILE_SIZE_MB = 5;

const toGenderFormValue = (value?: string | null) => {
  if (!value) return '';
  switch (value) {
    case 'male':
      return '1';
    case 'female':
      return '2';
    case 'other':
      return '0';
    default:
      return value;
  }
};

const toGenderApiValue = (value?: string | null) => {
  switch (value) {
    case '1':
      return 'male';
    case '2':
      return 'female';
    case '0':
      return 'other';
    default:
      return value || null;
  }
};

const Perfil = () => {
  const dispatch = useAppDispatch();
  const { setDarkModeStatus } = useDarkModeManager();
  const { user: userData } = useAppSelector((state) => state.auth);
  const darkMode = useAppSelector(selectDarkMode);
  const { currentCompany } = useCompanyManager();
  const { listaComunas, listaProvincias, listaRegiones } = useAppSelector((state) => state.core);

  const [activeTab, setActiveTab] = useState<ProfileTabKey>('EDIT');
  const [optionsRegion, setOptionsRegion] = useState<TSelectOption[]>([]);
  const [optionsProvincia, setOptionsProvincia] = useState<TSelectOption[]>([]);
  const [optionsComuna, setOptionsComuna] = useState<TSelectOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(userMeThunk() as any);
  }, [dispatch]);

  const themeSyncingRef = useRef(false);
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
      region: userData?.region != null ? String(userData.region) : '',
      provincia: userData?.provincia != null ? String(userData.provincia) : '',
      comuna: userData?.comuna != null ? String(userData.comuna) : '',
      genero: toGenderFormValue((userData as any)?.genero ?? userData?.gender),
      theme: darkMode === 'light' ? 'light' : darkMode === 'dark' ? 'dark' : 'system',
      fecha_nacimiento: (userData as any)?.fecha_nacimiento ?? '',
    },
    validationSchema: Yup.object().shape({
      first_name: Yup.string()
        .required('El primer nombre es requerido')
        .matches(NAME_REGEX, 'El primer nombre solo puede contener letras y espacios'),
      second_name: Yup.string()
        .matches(NAME_REGEX, 'El segundo nombre solo puede contener letras y espacios')
        .nullable(),
      last_name: Yup.string()
        .required('El primer apellido es requerido')
        .matches(NAME_REGEX, 'El primer apellido solo puede contener letras y espacios'),
      second_last_name: Yup.string()
        .matches(NAME_REGEX, 'El segundo apellido solo puede contener letras y espacios')
        .nullable(),
      rut: Yup.string()
        .required('El RUT es requerido')
        .matches(RUT_REGEX, 'El formato del RUT no es valido'),
      phone_number: Yup.string()
        .matches(/^(\+569|569|9)[\d]{8}$/, 'El numero de celular debe tener 9 digitos comenzando con 9')
        .nullable(),
      direccion: Yup.string().max(250, 'La direccion debe tener menos de 250 caracteres').nullable(),
      region: Yup.string().nullable(),
      provincia: Yup.string().nullable(),
      comuna: Yup.string().nullable(),
    }),
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
          region: toNumber(values.region),
          provincia: toNumber(values.provincia),
          comuna: toNumber(values.comuna),
          gender: toGenderApiValue(values.genero),
          fecha_nacimiento: trimOrNull(values.fecha_nacimiento),
        };

        await ApiService.fetchData({
          url: `/users/${userId}`,
          method: 'put',
          data: payload,
        });

        toast.success('Perfil actualizado');
        await dispatch(userMeThunk() as any);
      } catch (error: any) {
        toast.error(error?.message ?? 'No se pudo actualizar el perfil');
      } finally {
        setIsSaving(false);
      }
    },
  });

  useEffect(() => {
    const currentTheme = (darkMode || 'system') as TDarkMode;
    const formTheme = (formik.values.theme || 'system') as TDarkMode;

    if (currentTheme !== formTheme) {
      themeSyncingRef.current = true;
      formik.setFieldValue('theme', currentTheme, false);
    }
  }, [darkMode]);

  useEffect(() => {
    const selectedTheme = (formik.values.theme || 'system') as TDarkMode;

    if (themeSyncingRef.current) {
      themeSyncingRef.current = false;
      return;
    }

    if (selectedTheme !== darkMode) {
      setDarkModeStatus(selectedTheme);
    }
  }, [formik.values.theme, darkMode, setDarkModeStatus]);

  useEffect(() => {
    setOptionsRegion(
      listaRegiones
        .filter((region) => region.codigo !== undefined)
        .map((region) => ({ value: String(region.codigo), label: region.nombre })),
    );
  }, [listaRegiones]);

  useEffect(() => {
    if (!formik.values.region) {
      setOptionsProvincia([]);
      if (formik.values.provincia) {
        formik.setFieldValue('provincia', '');
      }
      if (formik.values.comuna) {
        formik.setFieldValue('comuna', '');
      }
      return;
    }

    const filtered = listaProvincias.filter((provincia) => {
      if (provincia.codigo_padre === undefined || provincia.codigo === undefined) {
        return false;
      }
      return String(provincia.codigo_padre) === formik.values.region;
    });

    setOptionsProvincia(
      filtered.map((provincia) => ({ value: String(provincia.codigo), label: provincia.nombre })),
    );

    if (formik.values.provincia) {
      formik.setFieldValue('provincia', '');
    }
    if (formik.values.comuna) {
      formik.setFieldValue('comuna', '');
    }
  }, [formik.values.region, formik.values.comuna, formik.values.provincia, listaProvincias, formik]);

  useEffect(() => {
    if (!formik.values.provincia) {
      setOptionsComuna([]);
      if (formik.values.comuna) {
        formik.setFieldValue('comuna', '');
      }
      return;
    }

    const filtered = listaComunas.filter((comuna) => {
      if (comuna.codigo_padre === undefined || comuna.codigo === undefined) {
        return false;
      }
      return String(comuna.codigo_padre) === formik.values.provincia;
    });

    setOptionsComuna(filtered.map((comuna) => ({ value: String(comuna.codigo), label: comuna.nombre })));

    if (formik.values.comuna) {
      formik.setFieldValue('comuna', '');
    }
  }, [formik.values.provincia, formik.values.comuna, listaComunas, formik]);

  const { saveBtnText, saveBtnColor, saveBtnDisable } = useSaveBtn({
    isNewItem: false,
    isSaving,
    isDirty: formik.dirty,
  });

  const handleAvatarUpload = async (file: File) => {
    if (!userId) {
      toast.error('No se encontro la informacion del usuario activo');
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Solo se permiten imagenes JPG o PNG');
      return;
    }

    const maxSizeInBytes = MAX_AVATAR_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error(`La imagen debe pesar menos de ${MAX_AVATAR_FILE_SIZE_MB}MB`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('image', file);

      const response = await ApiService.fetchData<{ data?: any; image?: any }, FormData>({
        url: `/users/${userId}/avatar`,
        method: 'post',
        data: formData,
      });

      const hasMedia = Boolean(response.data?.data ?? response.data?.image);
      toast.success('Imagen actualizada', { autoClose: 1000 });
      await dispatch(userMeThunk() as any);

      if (!hasMedia) {
        setTimeout(() => {
          dispatch(userMeThunk() as any);
        }, 500);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const backendErrors =
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data) ? error.response.data.join(', ') : null);
      const message =
        status === 404
          ? 'El endpoint para subir avatar no esta disponible. Verifica la version del backend.'
          : backendErrors || error?.message || 'No se pudo actualizar la imagen';
      toast.error(message);
    }
  };

  const avatarData = (userData as any)?.image;
  const avatarUrl = (() => {
    if (typeof avatarData === 'string') return avatarData;
    if (!avatarData) return null;
    const candidates = [
      avatarData?.md,
      avatarData?.sm,
      avatarData?.lg,
      avatarData?.original_url,
      avatarData?.url,
      avatarData?.path,
      avatarData?.thumb,
      avatarData?.medium,
      avatarData?.full,
      avatarData?.urls?.md,
      avatarData?.urls?.sm,
      avatarData?.urls?.lg,
      avatarData?.urls?.original,
    ];
    return candidates.find((item) => typeof item === 'string' && item.length > 0) ?? null;
  })();

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
              <ProfileTabs tabs={PROFILE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
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
                  <AppearanceTab formik={formik} currentCompany={currentCompany} />
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

