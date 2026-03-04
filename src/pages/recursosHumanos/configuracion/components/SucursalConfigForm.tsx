// src/pages/recursosHumanos/configuracion/components/SucursalConfigForm.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { setBranchConfig } from '@/store/slices/recursosHumanos/rhSlice';
import {
	useUserBranches,
	type UserBranch,
} from '@/pages/catalogos/productos/components/modals/hooks/userBranch';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { IRHBranchConfigFormValues } from '@/interface/rh.interface';

/* ======================================================
   VALIDATION SCHEMA
   ====================================================== */

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

/* ======================================================
   COMPONENT
   ====================================================== */

const SucursalConfigForm: React.FC = () => {
	const dispatch = useAppDispatch();
	const config = useAppSelector((s) => s.recursosHumanos.config);
	const user = useAppSelector((s) => s.auth.user);
	const userId = user?.id ?? (user as unknown as Record<string, unknown>)?.pk ?? null;

	const { branches, loading: branchesLoading } = useUserBranches(
		(userId as number) ?? undefined,
		{ enabled: Boolean(userId) },
	);

	// ── Branch selection ──────────────────────────────
	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
		config.branchId ?? null,
	);

	const branchOptions: TSelectOption[] = useMemo(
		() =>
			branches.map((b: UserBranch) => ({
				value: String(b.id),
				label: b.name ?? `Sucursal ${b.id}`,
			})),
		[branches],
	);

	const selectedBranchOption = useMemo(
		() => branchOptions.find((o) => Number(o.value) === selectedBranchId) ?? null,
		[branchOptions, selectedBranchId],
	);

	// ── GPS state ─────────────────────────────────────
	const [gpsLoading, setGpsLoading] = useState(false);

	// ── IP masking ────────────────────────────────────
	const [showIP, setShowIP] = useState(false);
	const ipAlreadySet = Boolean(config.authorizedPublicIP);

	// ── Formik ────────────────────────────────────────
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
						branches.find((b: UserBranch) => b.id === selectedBranchId)?.name ||
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

	// Auto-select first branch if none selected
	useEffect(() => {
		if (!selectedBranchId && branches.length > 0) {
			const firstBranch = branches[0];
			setSelectedBranchId(firstBranch.id);
			formik.setFieldValue('branchName', firstBranch.name ?? '');
		}
	}, [branches, selectedBranchId]); // eslint-disable-line react-hooks/exhaustive-deps

	// ── GPS: "Usar mi ubicación" ──────────────────────
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

	// ── Handle branch change ──────────────────────────
	const handleBranchChange = useCallback(
		(option: TSelectOption | null) => {
			if (!option) return;
			const branchId = Number(option.value);
			setSelectedBranchId(branchId);
			const branch = branches.find((b: UserBranch) => b.id === branchId);
			if (branch) {
				formik.setFieldValue('branchName', branch.name ?? '');
			}
		},
		[branches, formik],
	);

	// ── Mask IP display ───────────────────────────────
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
					<CardTitle>
						<span className='flex items-center gap-2'>
							<Icon icon='HeroCog6Tooth' size='text-xl' className='text-blue-400' />
							Configuración de Sucursal
						</span>
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<form onSubmit={formik.handleSubmit}>
					<div className='flex flex-col gap-5'>
						{/* ── Selección de Sucursal ── */}
						<div className='rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4'>
							<label className='mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300'>
								<Icon
									icon='HeroBuildingOffice2'
									size='text-base'
									className='text-blue-400'
								/>
								Sucursal
							</label>
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
								<p className='mt-1 text-xs text-zinc-500'>
									ID de sucursal: {selectedBranchId}
								</p>
							)}
						</div>

						{/* ── Ubicación (GPS) ── */}
						<div className='rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4'>
							<div className='mb-3 flex items-center justify-between'>
								<label className='flex items-center gap-2 text-sm font-semibold text-zinc-300'>
									<Icon
										icon='HeroMapPin'
										size='text-base'
										className='text-emerald-400'
									/>
									Ubicación de la Sucursal
								</label>
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
									<label className='mb-1 block text-xs text-zinc-500'>
										Latitud
									</label>
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
									<label className='mb-1 block text-xs text-zinc-500'>
										Longitud
									</label>
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
									<label className='mb-1 block text-xs text-zinc-500'>
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
						</div>

						{/* ── IP Pública (como contraseña) ── */}
						<div className='rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4'>
							<label className='mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300'>
								<Icon
									icon='HeroGlobeAlt'
									size='text-base'
									className='text-violet-400'
								/>
								IP Pública Autorizada
							</label>

							{ipAlreadySet && !showIP ? (
								<div className='flex items-center gap-3'>
									<div className='flex-1 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-zinc-400'>
										{maskedIP(config.authorizedPublicIP)}
									</div>
									<Button
										type='button'
										variant='outline'
										color='zinc'
										size='sm'
										icon='HeroEye'
										onClick={() => setShowIP(true)}>
										Mostrar
									</Button>
									<Button
										type='button'
										variant='outline'
										color='amber'
										size='sm'
										icon='HeroPencil'
										onClick={() => {
											setShowIP(true);
											formik.setFieldValue('authorizedPublicIP', '');
										}}>
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
											color='zinc'
											size='sm'
											icon='HeroEyeSlash'
											onClick={() => {
												setShowIP(false);
												// Restore original value if cleared
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
							<p className='mt-2 text-xs text-zinc-500'>
								<Icon
									icon='HeroLockClosed'
									size='text-xs'
									className='mr-1 inline'
								/>
								Se configura una vez. Todos los empleados deben estar en esta red
								para marcar.
							</p>
						</div>

						{/* ── Horario Laboral ── */}
						<div className='rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4'>
							<label className='mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300'>
								<Icon
									icon='HeroClock'
									size='text-base'
									className='text-amber-400'
								/>
								Horario Laboral
							</label>
							<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
								<div>
									<label className='mb-1 block text-xs text-zinc-500'>
										Hora de Entrada
									</label>
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
									<label className='mb-1 block text-xs text-zinc-500'>
										Hora de Salida
									</label>
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
									<label className='mb-1 block text-xs text-zinc-500'>
										Zona Horaria
									</label>
									<Input
										id='timezone'
										name='timezone'
										value={formik.values.timezone}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</div>
							</div>
						</div>

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
