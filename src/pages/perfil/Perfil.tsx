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
    dispatch(userMeThunk());
  }, [dispatch]);

  const themeSyncingRef = useRef(false);
  const formik = useFormik<ProfileFormValues>({
    enableReinitialize: true,
    initialValues: {
      email: userData?.email ?? '',
      first_name: userData?.first_name ?? '',
      second_name: userData?.second_name ?? '',
      last_name: userData?.last_name ?? '',
      second_last_name: userData?.second_last_name ?? '',
      rut: userData?.rut ?? '',
      celular: userData?.celular ?? '',
      fono_fijo: userData?.phone_number ?? '',
      direccion: userData?.direccion ?? '',
      region: userData?.region?.toString() ?? '',
      provincia: userData?.provincia?.toString() ?? '',
      comuna: userData?.comuna?.toString() ?? '',
      genero: userData?.gender ?? '',
      theme: darkMode === 'light' ? 'light' : darkMode === 'dark' ? 'dark' : 'system',
      fecha_nacimiento: userData?.comuna?.toString() ?? '',
    },
    validationSchema: Yup.object().shape({
      first_name: Yup.string()
        .required('El primer nombre es requerido')
        .matches(/^[a-zA-Z\s]+$/, 'El primer nombre solo puede contener letras y espacios'),
      second_name: Yup.string()
        .matches(/^[a-zA-Z\s]+$/, 'El segundo nombre solo puede contener letras y espacios')
        .nullable(),
      last_name: Yup.string()
        .required('El primer apellido es requerido')
        .matches(/^[a-zA-Z\s]+$/, 'El primer apellido solo puede contener letras y espacios'),
      second_last_name: Yup.string()
        .matches(/^[a-zA-Z\s]+$/, 'El segundo apellido solo puede contener letras y espacios')
        .nullable(),
      rut: Yup.string()
        .required('El RUT es requerido')
        .matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, 'El formato del RUT no es valido'),
      celular: Yup.string()
        .matches(/^(\+569|569|9)[\d]{8}$/, 'El numero de celular debe tener 9 digitos comenzando con 9')
        .nullable(),
      fono_fijo: Yup.string().matches(/^\d{9}$/, 'El numero de telefono fijo debe tener 9 digitos').nullable(),
      direccion: Yup.string().max(250, 'La direccion debe tener menos de 250 caracteres').nullable(),
      region: Yup.string().required('La region es requerida'),
      provincia: Yup.string().nullable(),
      comuna: Yup.string().nullable(),
    }),
    onSubmit: async (values) => {
      setIsSaving(true);
      const toNumber = (value?: string) => {
        if (!value) return null;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      try {
        const payload = {
          ...values,
          region: toNumber(values.region),
          provincia: toNumber(values.provincia),
          comuna: toNumber(values.comuna),
        };

        await ApiService.fetchData({
          url: `/auth/users/${userData?.id}/`,
          method: 'patch',
          data: payload,
        });

        toast.success('Perfil actualizado');
        dispatch(userMeThunk());
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
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await ApiService.fetchData({
        url: `/api/users/${userData?.id}/`,
        method: 'patch',
        data: formData,
      });

      if (response.data) {
        toast.success('Imagen actualizada', { autoClose: 1000 });
        dispatch(userMeThunk());
      }
    } catch (error: any) {
      toast.error(error?.response?.detail ?? 'No se pudo actualizar la imagen');
    }
  };

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
                  <EditProfileTab formik={formik} onAvatarUpload={handleAvatarUpload} />
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

