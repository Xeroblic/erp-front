import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBranchConfig } from '@/store/slices/recursosHumanos/rhSlice';
import { selectUserBranches, type UserBranchInfo } from '@/store/selectors/userBranchesSelectors';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { IRHBranchConfigFormValues } from '@/interface/rh.interface';
import Badge from '@/components/ui/Badge';
import Label from '@/components/form/Label';

const configSchema = Yup.object().shape({
	latitude: Yup.string()
		.required('Latitud requerida')
		.test('valid-lat', 'Latitud inválida (-90 a 90)', (val) => {
			const n = Number(val);
			return !isNaN(n) && n >= -90 && n <= 90;
		}),
	longitude: Yup.string()
		.required('Longitud requerida')
		.test('valid-lng', 'Longitud inválida (-180 a 180)', (val) => {
			const n = Number(val);
			return !isNaN(n) && n >= -180 && n <= 180;
		}),
	radiusMeters: Yup.string()
		.required('Radio requerido')
		.test('valid-radius', 'Debe ser mayor a 0', (val) => {
			const n = Number(val);
			return !isNaN(n) && n > 0;
		}),
	authorizedPublicIP: Yup.string()
		.required('IP pública requerida')
		.matches(/^(\d{1,3}\.){3}\d{1,3}$/, 'Formato IP inválido (ej: 190.100.50.25)'),
	entryTime: Yup.string()
		.required('Hora de entrada requerida')
		.matches(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
	exitTime: Yup.string()
		.required('Hora de salida requerida')
		.matches(/^\d{2}:\d{2}$/, 'Formato HH:mm'),
	timezone: Yup.string().required('Zona horaria requerida'),
	branchName: Yup.string(),
});

const SucursalConfigForm: React.FC = () => {
	const dispatch = useAppDispatch();
	const config = useAppSelector((s) => s.recursosHumanos.config);
	const branches = useAppSelector(selectUserBranches);
	const branchesLoading = false;

	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
		config.branchId ?? null,
	);

	const branchOptions: TSelectOption[] = useMemo(
		() =>
			branches.map((b: UserBranchInfo) => ({
				value: String(b.id),
				label: b.name ?? `Sucursal ${b.id}`,
			})),
		[branches],
	);

	const selectedBranchOption = useMemo(
		() => branchOptions.find((o) => Number(o.value) === selectedBranchId) ?? null,
		[branchOptions, selectedBranchId],
	);

	const [gpsLoading, setGpsLoading] = useState(false);

	const [showIP, setShowIP] = useState(false);
	const ipAlreadySet = Boolean(config.authorizedPublicIP);

	const formik = useFormik<IRHBranchConfigFormValues>({
		initialValues: {
			branchName: config.branchName || '',
			latitude: config.latitude ? String(config.latitude) : '',
			longitude: config.longitude ? String(config.longitude) : '',
			radiusMeters: String(config.radiusMeters || 50),
			authorizedPublicIP: config.authorizedPublicIP || '',
			entryTime: config.entryTime || '08:00',
			exitTime: config.exitTime || '18:00',
			timezone: config.timezone || 'America/Santiago',
		},
		validationSchema: configSchema,
		enableReinitialize: true,
		onSubmit: (values) => {
			dispatch(
				setBranchConfig({
					branchName:
						values.branchName ||
						branches.find((b: UserBranchInfo) => b.id === selectedBranchId)?.name ||
						'',
					branchId: selectedBranchId ?? undefined,
					latitude: Number(values.latitude),
					longitude: Number(values.longitude),
					radiusMeters: Number(values.radiusMeters),
					authorizedPublicIP: values.authorizedPublicIP,
					entryTime: values.entryTime,
					exitTime: values.exitTime,
					timezone: values.timezone,
					qrCode: config.qrCode || crypto.randomUUID(),
				}),
			);
			toast.success('Configuración de sucursal guardada');
		},
	});

	useEffect(() => {
		if (!selectedBranchId && branches.length > 0) {
			const firstBranch = branches[0];
			setSelectedBranchId(firstBranch.id);
			formik.setFieldValue('branchName', firstBranch.name ?? '');
		}
	}, [branches, selectedBranchId]);

	const handleUseMyLocation = useCallback(() => {
		if (!navigator.geolocation) {
			toast.error('Geolocalización no disponible en este navegador');
			return;
		}

		setGpsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				formik.setFieldValue('latitude', pos.coords.latitude.toFixed(6));
				formik.setFieldValue('longitude', pos.coords.longitude.toFixed(6));
				setGpsLoading(false);
				toast.success('Ubicación obtenida del GPS');
			},
			(err) => {
				setGpsLoading(false);
				if (err.code === err.PERMISSION_DENIED) {
					toast.error('Permiso de ubicación denegado');
				} else {
					toast.error('Error al obtener ubicación');
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, [formik]);

	const handleBranchChange = useCallback(
		(option: TSelectOption | null) => {
			if (!option) return;
			const branchId = Number(option.value);
			setSelectedBranchId(branchId);
			const branch = branches.find((b: UserBranchInfo) => b.id === branchId);
			if (branch) {
				formik.setFieldValue('branchName', branch.name ?? '');
			}
		},
		[branches, formik],
	);

	const maskedIP = (ip: string): string => {
		if (!ip) return '';
		const parts = ip.split('.');
		if (parts.length < 4) return '••••••••';
		return `${parts[0]}.•••.•••.${parts[3]}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle color='zinc'>
						<Badge className='flex items-center gap-2'>
							<Icon icon='HeroCog6Tooth' size='text-xl' />
							Configuración de Sucursal
						</Badge>
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='bg-white dark:bg-zinc-800' autoCapitalize='on'>
				<form className='mt-4' onSubmit={formik.handleSubmit}>
					<div className='flex flex-col gap-5'>
						<Card className='rounded-lg p-4'>
							<Label
								htmlFor='branch_select'
								className='mb-2 flex items-center gap-2 text-sm font-semibold'>
								<Icon icon='HeroBuildingOffice2' size='text-2xl' color='sky' />
								Sucursal
							</Label>
							<SelectReact
								name='branch_select'
								value={selectedBranchOption}
								options={branchOptions}
								isLoading={branchesLoading}
								placeholder={
									branchesLoading
										? 'Cargando sucursales...'
										: 'Selecciona una sucursal'
								}
								onChange={(opt: unknown) => {
									if (Array.isArray(opt)) return;
									handleBranchChange(opt as TSelectOption);
								}}
								dimension='default'
							/>
							{selectedBranchId && (
								<p className='mt-1 text-xs'>ID de sucursal: {selectedBranchId}</p>
							)}
						</Card>

						<Card className='rounded-lg p-4'>
							<div className='mb-3 flex items-center justify-between'>
								<Label
									htmlFor='ubicacion_sucursal'
									className='flex items-center gap-2 text-sm font-semibold'>
									<Icon icon='HeroMapPin' size='text-2xl' color='emerald' />
									Ubicación de la Sucursal
								</Label>
								<Button
									type='button'
									variant='outline'
									color='emerald'
									size='sm'
									icon='HeroMapPin'
									isLoading={gpsLoading}
									onClick={handleUseMyLocation}>
									{gpsLoading ? 'Obteniendo...' : 'Usar mi ubicación'}
								</Button>
							</div>

							<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
								<div>
									<label className='mb-1 block text-xs'>Latitud</label>
									<Input
										id='latitude'
										name='latitude'
										placeholder='-33.448890'
										value={formik.values.latitude}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.latitude && formik.errors.latitude && (
										<p className='mt-1 text-xs text-red-400'>
											{formik.errors.latitude}
										</p>
									)}
								</div>
								<div>
									<label className='mb-1 block text-xs'>Longitud</label>
									<Input
										id='longitude'
										name='longitude'
										placeholder='-70.669300'
										value={formik.values.longitude}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.longitude && formik.errors.longitude && (
										<p className='mt-1 text-xs text-red-400'>
											{formik.errors.longitude}
										</p>
									)}
								</div>
								<div>
									<label className='mb-1 block text-xs'>
										Radio de tolerancia (metros)
									</label>
									<Input
										id='radiusMeters'
										name='radiusMeters'
										placeholder='50'
										value={formik.values.radiusMeters}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.radiusMeters && formik.errors.radiusMeters && (
										<p className='mt-1 text-xs text-red-400'>
											{formik.errors.radiusMeters}
										</p>
									)}
								</div>
							</div>
						</Card>

						{/* ── IP Pública (como contraseña) ── */}
						<Card className='rounded-lg p-4'>
							<Label
								htmlFor='authorizedPublicIP'
								className='mb-2 flex items-center gap-2 text-sm font-semibold'>
								<Icon icon='HeroGlobeAlt' size='text-2xl' color='violet' />
								IP Pública Autorizada
							</Label>

							{ipAlreadySet && !showIP ? (
								<div className='flex items-center gap-3'>
									<Badge
										color='red'
										className='flex-1 border border-red-400 p-3 text-lg'>
										<Icon
											icon='HeroGlobeAlt'
											size='text-2xl'
											color='red'
											className='mr-2'
										/>
										<span className='font-mono'>
											{maskedIP(config.authorizedPublicIP)}
										</span>
									</Badge>
									<Button
										type='button'
										color='violet'
										size='sm'
										className='border-violet-400 bg-violet-100/50 text-violet-600 hover:bg-violet-200/50 hover:text-violet-500'
										onClick={() => setShowIP(true)}>
										<Icon
											icon='HeroEye'
											size='text-lg'
											color='violet'
											className='mr-2'
										/>
										Mostrar
									</Button>
									<Button
										type='button'
										color='amber'
										variant='outline'
										className='border-orange-400 bg-amber-100/50 text-orange-600 hover:bg-amber-200/50 hover:text-orange-500'
										size='sm'
										onClick={() => {
											setShowIP(true);
											formik.setFieldValue('authorizedPublicIP', '');
										}}>
										<Icon
											icon='HeroPencil'
											size='text-lg'
											color='orange'
											className='mr-2'
										/>
										Cambiar
									</Button>
								</div>
							) : (
								<div className='flex items-center gap-3'>
									<div className='flex-1'>
										<Input
											id='authorizedPublicIP'
											name='authorizedPublicIP'
											type={showIP || !ipAlreadySet ? 'text' : 'password'}
											placeholder='Ej: 190.100.50.25'
											value={formik.values.authorizedPublicIP}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</div>
									{showIP && ipAlreadySet && (
										<Button
											type='button'
											variant='outline'
											className='border-red-400 bg-red-400/30 text-red-400 hover:bg-red-400/20 hover:text-red-300'
											color='red'
											size='sm'
											icon='HeroEyeSlash'
											onClick={() => {
												setShowIP(false);
												if (!formik.values.authorizedPublicIP) {
													formik.setFieldValue(
														'authorizedPublicIP',
														config.authorizedPublicIP,
													);
												}
											}}>
											Ocultar
										</Button>
									)}
								</div>
							)}

							{formik.touched.authorizedPublicIP &&
								formik.errors.authorizedPublicIP && (
									<p className='mt-1 text-xs text-red-400'>
										{formik.errors.authorizedPublicIP}
									</p>
								)}
							<p className='mt-2 text-xs'>
								<Icon
									icon='HeroLockClosed'
									size='text-xs'
									className='mr-1 inline'
								/>
								Se configura una vez. Todos los empleados deben estar en esta red
								para marcar.
							</p>
						</Card>

						<Card className='rounded-lg p-4'>
							<Label
								htmlFor='horario_laboral'
								className='mb-3 flex items-center gap-2 text-sm font-semibold'>
								<Icon icon='HeroClock' size='text-2xl' color={'amber'} />
								Horario Laboral
							</Label>
							<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
								<div>
									<Label htmlFor='entryTime' className='mb-1 block text-xs'>
										Hora de Entrada
									</Label>
									<Input
										id='entryTime'
										name='entryTime'
										type='time'
										value={formik.values.entryTime}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</div>
								<div>
									<Label htmlFor='exitTime' className='mb-1 block text-xs'>
										Hora de Salida
									</Label>
									<Input
										id='exitTime'
										name='exitTime'
										type='time'
										value={formik.values.exitTime}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</div>
								<div>
									<Label htmlFor='timezone' className='mb-1 block text-xs'>
										Zona Horaria
									</Label>
									<Input
										id='timezone'
										name='timezone'
										value={formik.values.timezone}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</div>
							</div>
						</Card>

						{/* ── Submit ── */}
						<div className='flex justify-end'>
							<Button
								type='submit'
								variant='solid'
								color='blue'
								icon='HeroCheck'
								isDisable={!formik.isValid || (!formik.dirty && !selectedBranchId)}>
								Guardar Configuración
							</Button>
						</div>
					</div>
				</form>
			</CardBody>
		</Card>
	);
};

export default SucursalConfigForm;
