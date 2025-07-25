import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
// import dayjs from 'dayjs';
// import { useTranslation } from 'react-i18next';
// import { Descendant } from 'slate';
import PageWrapper from '../components/layouts/PageWrapper/PageWrapper';
import Container from '../components/layouts/Container/Container';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../components/layouts/Subheader/Subheader';
import Card, { CardBody, CardFooter, CardFooterChild } from '../components/ui/Card';
import Button, { IButtonProps } from '../components/ui/Button';
import { TIcons } from '../types/icons.type';
import Label from '../components/form/Label';
import Input from '../components/form/Input';
// import Select from '../components/form/Select';
import Avatar from '../components/Avatar';
import useSaveBtn from '../hooks/useSaveBtn';
import FieldWrap from '../components/form/FieldWrap';
import Icon from '../components/icon/Icon';
// import Checkbox from '../components/form/Checkbox';
import Badge from '../components/ui/Badge';
// import RichText from '../components/RichText';
import Radio, { RadioGroup } from '../components/form/Radio';
import useDarkMode from '../hooks/useDarkMode';
import { TDarkMode } from '../types/darkMode.type';
import { useAppDispatch, useAppSelector } from '@/store';
import { userMeThunk } from '@/store/slices/auth/authSlice';
import * as Yup from 'yup';
import Validation from '@/components/form/Validation';
import ApiService from '@/services/ApiService';
import { toast } from 'react-toastify'
import Alert from '@/components/ui/Alert';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { ActionMeta, MultiValue, SingleValue } from 'react-select';

/* Removed misplaced initialValues object. Initial values are set inside useFormik where userData is available. */


type TTab = {
	text:
	| 'Editar Perfil'
	| 'Contacto'
	// | 'Contraseña'
	// | '2FA'
	// | 'Newsletter'
	// | 'Sessions'
	// | 'Connected'
	| 'Apariencia';
	icon: TIcons;
};

type TTabs = {
	[key in
	| 'EDIT'
	| 'CONTACTO'
	// | 'PASSWORD'
	// | '2FA'
	// | 'NEWSLETTER'
	// | 'SESSIONS'
	// | 'CONNECTED'
	| 'APPEARANCE']: TTab;
};

const TAB: TTabs = {
	EDIT: {
		text: 'Editar Perfil',
		icon: 'HeroPencil',
	},
	CONTACTO: {
		text: 'Contacto',
		icon: 'HeroGlobeAmericas',
	},
	// PASSWORD: {
	// 	text: 'Contraseña',
	// 	icon: 'HeroKey',
	// },
	// '2FA': {
	// 	text: '2FA',
	// 	icon: 'HeroShieldExclamation',
	// },
	// NEWSLETTER: {
	// 	text: 'Newsletter',
	// 	icon: 'HeroBell',
	// },
	// SESSIONS: {
	// 	text: 'Sessions',
	// 	icon: 'HeroQueueList',
	// },
	// CONNECTED: {
	// 	text: 'Connected',
	// 	icon: 'HeroLink',
	// },
	APPEARANCE: {
		text: 'Apariencia',
		icon: 'HeroSwatch',
	},
};


const Perfil = () => {
	const dispatch = useAppDispatch()
	const { setDarkModeStatus } = useDarkMode();
	const { user: userData, access, personalizacionUsuario } = useAppSelector((state) => state.auth)
	const [activeTab, setActiveTab] = useState<TTab>(TAB.EDIT);
	const { listaComunas, listaProvincias, listaRegiones } = useAppSelector((state) => state.core)
	const [optionsRegion, setOptionsRegion] = useState<{ value: string, label: string }[]>([])
	const [optionsProvincia, setOptionsProvincia] = useState<{ value: string, label: string }[]>([])
	const [optionsComuna, setOptionsComuna] = useState<{ value: string, label: string }[]>([])

	useEffect(() => {
		dispatch(userMeThunk())
	}, [])

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isSaving, setIsSaving] = useState<boolean>(false);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			email: userData?.email,
			first_name: userData?.first_name,
			second_name: userData?.second_name,
			last_name: userData?.last_name,
			second_last_name: userData?.second_last_name,
			rut: userData?.rut,
			celular: userData?.celular,
			fono_fijo: userData?.fono_fijo,
			direccion: userData?.direccion,
			region: userData?.region?.toString() || '0',
			provincia: userData?.provincia?.toString() || '0',
			comuna: userData?.comuna?.toString() || '0',
			genero: userData?.genero,
			theme: personalizacionUsuario?.tema === "1" ? "light" : personalizacionUsuario?.tema === "2" ? "dark" : personalizacionUsuario?.tema === "3" ? "system" : "system",
			fecha_nacimiento: userData?.fecha_nacimiento,
		},
		validationSchema: Yup.object().shape({
			// email: Yup.string()
			//     .email('Correo electrónico no válido')
			//     .required('El correo electrónico es requerido'),
			first_name: Yup.string()
				.required('El primer nombre es requerido')
				.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El primer nombre solo puede contener letras y espacios'),
			second_name: Yup.string()
				.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El segundo nombre solo puede contener letras y espacios')
				.nullable(),
			last_name: Yup.string()
				.required('El primer apellido es requerido')
				.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El primer apellido solo puede contener letras y espacios'),
			second_last_name: Yup.string()
				.matches(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/, 'El segundo apellido solo puede contener letras y espacios')
				.nullable(),
			rut: Yup.string()
				.required('El RUT es requerido')
				.matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, 'El formato del RUT no es válido'),
			celular: Yup.string()
				.matches(/^(\+569|569|9)[\d]{8}$/, 'El número de celular debe tener 9 dígitos comenzando con 9')
				.nullable(),
			fono_fijo: Yup.string()
				.matches(/^\d{9}$/, 'El número de teléfono fijo debe tener 9 dígitos')
				.nullable(),
			direccion: Yup.string()
				.max(250, 'La direccion debe tener menos de 250 caracteres')
				.nullable(),
			region: Yup.string()
				.required('La región es requerida').oneOf(listaRegiones.map(r => r.codigo),'La región seleccionada no es válida'),
			provincia: Yup.string()
    			.nullable().test('provincia-valida','La provincia no pertenece a la región seleccionada',function (value) {
						const regionCodigo = this.parent.region;
							if (!regionCodigo || !value) return true;
								const provincia = listaProvincias.find(p => p.codigo === value);
							return provincia
						? provincia.codigo_padre === regionCodigo
						: false;
					}),
			comuna: Yup.string()
				.nullable().test('comuna-valida','La comuna no pertenece a la provincia seleccionada',function (value) {
						const provinciaCodigo = this.parent.provincia;
							if (!provinciaCodigo || !value) return true;
								const comuna = listaComunas.find(c => c.codigo === value);
							return comuna
						? comuna.codigo_padre === provinciaCodigo
					: false;
				}),
		}),
		onSubmit: async vals => {
			try {
				const payload = {
					...vals,
					region: parseInt(vals.region),
					provincia: parseInt(vals.provincia),
					comuna: parseInt(vals.comuna),
				};
				await ApiService.fetchData({ url: `/auth/users/${userData?.pk}/`, method: 'patch', data: payload });
				toast.success('Perfil actualizado');
				dispatch(userMeThunk());
			} catch (e: any) { toast.error(e.message); }
		}
	});

	useEffect(() => {
		setDarkModeStatus(formik.values.theme as TDarkMode);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formik.values.theme]);
	useEffect(() => {
	setOptionsRegion(
		listaRegiones.map(r => ({
		value: r.codigo,     
		label: r.nombre       
		}))
	);
	}, [listaRegiones]);

	useEffect(() => {
		setOptionsProvincia(
			listaProvincias
				.filter(p => p.codigo !== undefined)
				.map(p => ({ value: p.codigo.toString(), label: p.nombre }))
		);
	}, [listaProvincias]);

	useEffect(() => {
		setOptionsComuna(
			listaComunas
				.filter(c => c.codigo !== undefined)
				.map(c => ({ value: c.codigo.toString(), label: c.nombre }))
		);
	}, [listaComunas]);

useEffect(() => {
  if (!formik.values.region) {
    setOptionsProvincia([]);
    formik.setFieldValue('provincia', '');
    formik.setFieldValue('comuna', '');
    return;
  }
  const filtered = listaProvincias.filter(p => p.codigo_padre === formik.values.region);
  setOptionsProvincia(
    filtered.map(p => ({
      value: p.codigo,    
      label: p.nombre      
    }))
  );
  formik.setFieldValue('provincia', '');
  formik.setFieldValue('comuna', '');
}, [formik.values.region, listaProvincias]);

useEffect(() => {
  if (!formik.values.provincia) {
    setOptionsComuna([]);
    formik.setFieldValue('comuna', '');
    return;
  }
  const filtered = listaComunas.filter(c => c.codigo_padre === formik.values.provincia);
  setOptionsComuna(
    filtered.map(c => ({
      value: c.codigo,    
      label: c.nombre     
    }))
  );
  formik.setFieldValue('comuna', '');
}, [formik.values.provincia, listaComunas]);


	// const selectedRegion = optionsRegion.find(o => o.value === formik.values.region) || null;
	// const selectedProvincia = optionsProvincia.find(o => o.value === formik.values.provincia) || null;
	// const selectedComuna = optionsComuna.find(o => o.value === formik.values.comuna) || null;


	const { saveBtnText, saveBtnColor, saveBtnDisable } = useSaveBtn({
		isNewItem: false,
		isSaving,
		isDirty: formik.dirty,
	});

	const defaultProps: IButtonProps = {
		color: 'zinc',
	};
	const activeProps: IButtonProps = {
		...defaultProps,
		isActive: true,
		color: 'emerald',
		colorIntensity: '500',
	};

	return (
		<PageWrapper isProtectedRoute={true} name={formik.values.first_name}>
			<Subheader>
				<SubheaderLeft>
					{`${userData?.first_name} ${userData?.last_name}`}{' '}
					<Badge
						color='emerald'
						variant='outline'
						rounded='rounded-full'
						className='border-transparent'>
						Editar Usuario
					</Badge>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						icon='HeroServer'
						variant='solid'
						color={saveBtnColor}
						isDisable={saveBtnDisable}
						onClick={() => formik.handleSubmit()}>
						{saveBtnText}
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container className='h-full'>
				<Card className='h-full'>
					<CardBody>
						<div className='grid grid-cols-12 gap-4'>
							<div className='col-span-12 flex gap-4 max-sm:flex-wrap sm:col-span-4 sm:flex-col md:col-span-2'>
								{Object.values(TAB).map((i) => (
									<div key={i.text}>
										<Button
											icon={i.icon}
											// eslint-disable-next-line react/jsx-props-no-spreading
											{...(activeTab.text === i.text
												? {
													...activeProps,
												}
												: {
													...defaultProps,
												})}
											onClick={() => {
												setActiveTab(i);
											}}>
											{i.text}
										</Button>
									</div>
								))}
								{/* <div className='border-zinc-500/25 dark:border-zinc-500/50 max-sm:border-s sm:border-t sm:pt-4'>
                                        <Button icon='HeroTrash' color='red'>
                                            Delete Account
                                        </Button>
								</div> */}
							</div>
							<div className='col-span-12 flex flex-col gap-4 sm:col-span-8 md:col-span-10'>
								{activeTab === TAB.EDIT && (
									<>
										<div className='text-4xl font-semibold'>Editar Perfil</div>
										<div className='flex w-full gap-4'>
											<div className='flex-shrink-0'>
												<Avatar
													src={userData?.image ? userData.image : ""}
													className='!w-24'
													// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
													name={`${userData?.first_name} ${userData?.last_name}`}
												/>
											</div>
											<div className='flex grow items-center'>
												<div>
													<div className='w-full'>
														<Label
															htmlFor=''
															className=''
															description='Esta permitido JPG o PNG.'>
															Sube una nueva imagen
														</Label>
														<Input
															id='fileUpload'
															name='fileUpload'
															type='file'
															onChange={async (e) => {
																if (e.target.files && e.target.files.length > 0) {
																	const form = new FormData();
																	form.append('image', e.target.files[0]);
																	try {
																		const response = await ApiService.fetchData({ url: `/api/users/${userData?.pk}/`, method: 'patch', data: form })
																		if (response.data) {
																			toast.success("Imagen Actualizada", { autoClose: 1000 })
																			dispatch(userMeThunk())
																		}
																	} catch (error: any) {
																		toast.error(error.response.detail)
																	}
																}
															}}
														/>
													</div>
												</div>
											</div>
										</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='email'>Email</Label>
												<FieldWrap
													firstSuffix={
														<Icon
															icon='HeroEnvelope'
															className='mx-2'
														/>
													}>
													<Input
														id='email'
														name='email'
														onChange={formik.handleChange}
														value={formik.values.email}
														autoComplete='email'
														readOnly
													/>
												</FieldWrap>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='rut'>Rut</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.rut}
													invalidFeedback={formik.errors.rut}
												>
													<Input
														id='rut'
														name='rut'
														onChange={formik.handleChange}
														value={formik.values.rut || ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='first_name'>Primer Nombre</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.first_name}
													invalidFeedback={formik.errors.first_name}
												>
													<Input
														id='first_name'
														name='first_name'
														onChange={formik.handleChange}
														value={formik.values.first_name}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='second_name'>Segundo Nombre</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.second_name}
													invalidFeedback={formik.errors.second_last_name}
												>
													<Input
														id='second_name'
														name='second_name'
														onChange={formik.handleChange}
														value={formik.values.second_name || ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='last_name'>Apellido Paterno</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.last_name}
													invalidFeedback={formik.errors.second_last_name}
												>
													<Input
														id='last_name'
														name='last_name'
														onChange={formik.handleChange}
														value={formik.values.last_name}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='second_last_name'>Apellido Materno</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.second_last_name}
													invalidFeedback={formik.errors.second_last_name}
												>
													<Input
														id='second_last_name'
														name='second_last_name'
														onChange={formik.handleChange}
														value={formik.values.second_last_name || ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='celular'>Celular</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.celular}
													invalidFeedback={formik.errors.celular}
												>
													<Input
														type='text'
														id='celular'
														name='celular'
														onChange={formik.handleChange}
														value={formik.values.celular ? formik.values.celular : ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='fono_fijo'>Telefono Fijo</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.fono_fijo}
													invalidFeedback={formik.errors.fono_fijo}
												>
													<Input
														type='text'
														id='fono_fijo'
														name='fono_fijo'
														onChange={formik.handleChange}
														value={formik.values.fono_fijo ? formik.values.fono_fijo : ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor='fecha_nacimiento'>Fecha de Nacimiento</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.fecha_nacimiento}
													invalidFeedback={formik.errors.fecha_nacimiento}
												>
													<Input
														type='date'
														id='fecha_nacimiento'
														name='fecha_nacimiento'
														onChange={formik.handleChange}
														value={formik.values.fecha_nacimiento ? formik.values.fecha_nacimiento : ""}
														onBlur={formik.handleBlur}
													/>
												</Validation>
											</div>
											<div className='col-span-12 lg:col-span-6'>
												<Label htmlFor=''>Genero</Label>
												<RadioGroup isInline>
													{[{ value: "0", label: 'No Especificado' }, { value: "1", label: 'Masculino' }, { value: "2", label: 'Femenino' }].map((i) => (
														<Radio
															key={i.value}
															label={i.label}
															name='genero'
															value={i.value}
															selectedValue={formik.values.genero}
															onChange={formik.handleChange}
														/>
													))}
												</RadioGroup>
											</div>

											<div className='col-span-12'>
												<Label htmlFor='position'>Role</Label>
												{/* <FieldWrap
													firstSuffix={
														<Icon
															icon='HeroShieldCheck'
															className='mx-2'
														/>
													}
													lastSuffix={
														<Icon
															icon='HeroChevronDown'
															className='mx-2'
														/>
													}>
													<Select
														name='role'
														onChange={formik.handleChange}
														value={formik.values.role}
														placeholder='Select role'>
														{rolesDb.map((role) => (
															<option key={role.id} value={role.id}>
																{role.name}
															</option>
														))}
													</Select>
												</FieldWrap> */}
											</div>
										</div>
									</>
								)}
								{activeTab === TAB.CONTACTO && (
									<>
										<div className='text-4xl font-semibold'>Contacto</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12'>
												<Label htmlFor='direccion'>Direccion</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.direccion}
													invalidFeedback={formik.errors.direccion}
												>
													<Input
														id='direccion'
														name='direccion'
														onChange={formik.handleChange}
														value={formik.values.direccion || ""}
													/>
												</Validation>
											</div>
										</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12'>
												<Label htmlFor='region'>Region</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.region}
													invalidFeedback={formik.errors.region}
												>
													<SelectReact
														id="region"
														name="region"
														isMulti={false}
														placeholder="Region"
														options={optionsRegion}
														onBlur={formik.handleBlur}
														  value={optionsRegion.find(o => o.value === formik.values.region) || null}
  onChange={opt => formik.setFieldValue('region', (opt as TSelectOption)?.value || '')}
													/>
												</Validation>
											</div>
										</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12'>
												<Label htmlFor='provincia'>Provincia</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.provincia}
													invalidFeedback={formik.errors.provincia}
												>
													<SelectReact
														id="provincia"
														name="provincia"
														isMulti={false}
														placeholder="Provincia"
														options={optionsProvincia}
														onBlur={formik.handleBlur}
														value={optionsProvincia.find(o => o.value === formik.values.provincia) || null}
  														onChange={opt => formik.setFieldValue('provincia', (opt as TSelectOption)?.value || '')}
													/>
												</Validation>
											</div>
										</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12'>
												<Label htmlFor='comuna'>Comuna</Label>
												<Validation
													isValid={formik.isValid}
													isTouched={formik.touched.comuna}
													invalidFeedback={formik.errors.comuna}
												>
													<SelectReact
														id="comuna"
														name="comuna"
														isMulti={false}
														placeholder="Comuna"
														options={optionsComuna}
														onBlur={formik.handleBlur}
														value={optionsComuna.find(o => o.value === formik.values.comuna) || null}
  														onChange={opt => formik.setFieldValue('comuna', (opt as TSelectOption)?.value || '')}
													/>
												</Validation>
											</div>
										</div>
									</>
								)}

								{activeTab === TAB.APPEARANCE && (
									<>
										<div className='text-4xl font-semibold'>Apariencia</div>
										<div className='grid grid-cols-12 gap-4'>
											<div className='col-span-12'>
												<Label htmlFor='theme'>Tema</Label>
												<RadioGroup isInline>
													<Radio
														name='theme'
														value='dark'
														selectedValue={formik.values.theme}
														onChange={formik.handleChange}>
														<div className='relative'>
															<div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
																<div className='h-1 w-1 rounded-full bg-red-500' />
																<div className='h-1 w-1 rounded-full bg-amber-500' />
																<div className='h-1 w-1 rounded-full bg-emerald-500' />
															</div>
															<div className='flex aspect-video w-56 bg-zinc-950'>
																<div className='h-full w-1/4 border-e border-zinc-800/50 bg-zinc-900/75' />
																<div className='h-full w-3/4'>
																	<div className='h-4 w-full border-b border-zinc-800/50 bg-zinc-900/75' />
																	<div />
																</div>
															</div>
														</div>
													</Radio>
													<Radio
														name='theme'
														value='light'
														selectedValue={formik.values.theme}
														onChange={formik.handleChange}>
														<div className='relative'>
															<div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
																<div className='h-1 w-1 rounded-full bg-red-500' />
																<div className='h-1 w-1 rounded-full bg-amber-500' />
																<div className='h-1 w-1 rounded-full bg-emerald-500' />
															</div>
															<div className='flex aspect-video w-56 bg-zinc-100'>
																<div className='h-full w-1/4 border-e border-zinc-300/25 bg-white' />
																<div className='h-full w-3/4'>
																	<div className='h-4 w-full border-b border-zinc-300/25 bg-white' />
																	<div />
																</div>
															</div>
														</div>
													</Radio>
													<Radio
														name='theme'
														value='system'
														selectedValue={formik.values.theme}
														onChange={formik.handleChange}
													>
														<div className='relative'>
															<div className='flex h-2 w-full items-center gap-1 bg-zinc-500 p-1'>
																<div className='h-1 w-1 rounded-full bg-red-500' />
																<div className='h-1 w-1 rounded-full bg-amber-500' />
																<div className='h-1 w-1 rounded-full bg-emerald-500' />
															</div>
															<div className='flex aspect-video w-56'>
																{/* Parte Oscura */}
																<div className='h-full w-1/2 bg-zinc-950'>
																	<div className='h-full w-1/4 border-e border-zinc-800/50 bg-zinc-900/75' />
																	<div className='h-full w-3/4'>
																		<div className='h-4 w-full border-b border-zinc-800/50 bg-zinc-900/75' />
																		<div />
																	</div>
																</div>
																{/* Parte Clara */}
																<div className='h-full w-1/2 bg-zinc-100'>
																	<div className='h-full w-1/4 border-e border-zinc-300/25 bg-white' />
																	<div className='h-full w-3/4'>
																		<div className='h-4 w-full border-b border-zinc-300/25 bg-white' />
																		<div />
																	</div>
																</div>
															</div>
														</div>
													</Radio>
												</RadioGroup>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</CardBody>
					<CardFooter>
						<CardFooterChild>
							{/* <div className='flex items-center gap-2'>
								<Icon icon='HeroDocumentCheck' size='text-2xl' />
								<span className='text-zinc-500'>Last saved:</span>
								<b>{dayjs().locale(i18n.language).format('LLL')}</b>
							</div> */}
						</CardFooterChild>
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
