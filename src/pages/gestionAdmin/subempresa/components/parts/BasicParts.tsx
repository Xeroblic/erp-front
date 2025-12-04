import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { IBranch } from '@/interface';

const BasicParts = ({
	subempresa,
	isEditing,
	formik,
	viewData,
	optionsRegion,
	optionsProvincia,
	optionsComuna,
}: {
	subempresa: any;
	isEditing: boolean;
	formik: any;
	viewData: any;
	optionsRegion: TSelectOption[];
	optionsProvincia: TSelectOption[];
	optionsComuna: TSelectOption[];
}) => {
	return (
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
			<Card>
				<CardHeader>
					<CardTitle>
						<Badge className='font-bold'>Información Básica</Badge>
					</CardTitle>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='flex items-center gap-4'>
						<div className='flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white'>
							{subempresa.logo_url ? (
								<img
									src={subempresa.logo_url}
									alt='Logo subempresa'
									className='max-h-14 max-w-14 object-contain'
								/>
							) : (
								<Icon icon='HeroPhoto' className='text-2xl text-zinc-400' />
							)}
						</div>
						<div className='text-xs text-zinc-500'>
							Logo actual de la subempresa. Usa "Subir logo" para actualizar.
						</div>
					</div>
					<div>
						<Label className='text-lg font-semibold' htmlFor='nombre'>
							Nombre
						</Label>
						{isEditing ? (
							<Input
								id='nombre'
								name='nombre'
								placeholder='Ej: Subsidiaria Norte'
								value={formik.values.nombre}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
						) : (
							<div className='text-base font-medium'>{viewData.name}</div>
						)}
						{formik.touched.nombre && formik.errors.nombre && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.nombre}</p>
						)}
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='rut'>
								RUT
							</Label>
							{isEditing ? (
								<Input
									id='rut'
									name='rut'
									placeholder='Ej: 12.345.678-9'
									value={formik.values.rut}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div>
									{viewData.rut ? (
										<span className='font-mono'>{viewData.rut}</span>
									) : (
										<Badge variant='outline' className='text-zinc-400'>
											Sin RUT
										</Badge>
									)}
								</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='telefono'>
								Teléfono
							</Label>
							{isEditing ? (
								<Input
									id='telefono'
									name='telefono'
									placeholder='Ej: +56 9 8765 4321'
									value={formik.values.telefono}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : viewData.phone ? (
								<div className='flex items-center gap-2'>
									<Icon icon='HeroPhone' className='text-sm text-zinc-400' />
									<span>{viewData.phone}</span>
								</div>
							) : (
								<Badge variant='outline' className='text-zinc-400'>
									Sin teléfono
								</Badge>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='email'>
								Email
							</Label>
							{isEditing ? (
								<Input
									id='email'
									name='email'
									type='email'
									placeholder='Ej: contacto@subsidiaria.com'
									value={formik.values.email}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : viewData.email ? (
								<div className='flex items-center gap-2'>
									<Icon icon='HeroEnvelope' className='text-sm text-zinc-400' />
									<a
										href={`mailto:${viewData.email}`}
										className='text-primary-600 hover:text-primary-800'>
										{viewData.email}
									</a>
								</div>
							) : (
								<Badge variant='outline' className='text-zinc-400'>
									Sin email
								</Badge>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='direccion'>
								Dirección
							</Label>
							{isEditing ? (
								<Input
									id='direccion'
									name='direccion'
									placeholder='Ej: Av. Principal 123, Ciudad'
									value={formik.values.direccion}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : viewData.address ? (
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroMapPin'
										className='mt-0.5 text-sm text-zinc-400'
									/>
									<span>{viewData.address}</span>
								</div>
							) : (
								<Badge variant='outline' className='text-zinc-400'>
									Sin dirección
								</Badge>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='region'>
								Región
							</Label>
							{isEditing ? (
								<SelectReact
									name='region'
									placeholder='Seleccione región'
									value={
										optionsRegion.find(
											(o) => o.value === String(formik.values.region),
										) || null
									}
									onChange={(opt) =>
										formik.setFieldValue(
											'region',
											(opt as TSelectOption | null)?.value || '',
										)
									}
									options={optionsRegion}
								/>
							) : (
								<div className='text-sm text-zinc-700'>No definida</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='provincia'>
								Provincia
							</Label>
							{isEditing ? (
								<SelectReact
									name='provincia'
									placeholder='Seleccione provincia'
									value={
										optionsProvincia.find(
											(o) => o.value === String(formik.values.provincia),
										) || null
									}
									onChange={(opt) =>
										formik.setFieldValue(
											'provincia',
											(opt as TSelectOption | null)?.value || '',
										)
									}
									options={optionsProvincia}
								/>
							) : (
								<div className='text-sm text-zinc-700'>No definida</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='comuna'>
								Comuna
							</Label>
							{isEditing ? (
								<SelectReact
									name='comuna'
									placeholder='Seleccione comuna'
									value={
										optionsComuna.find(
											(o) => o.value === String(formik.values.comuna),
										) ||
										(formik.values.comuna
											? {
													value: String(formik.values.comuna),
													label: 'Cargando…',
												}
											: null)
									}
									onChange={(opt) =>
										formik.setFieldValue(
											'comuna',
											(opt as TSelectOption | null)?.value || '',
										)
									}
									options={optionsComuna}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{viewData.commune || 'Sin comuna'}
								</div>
							)}
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>
						<Badge className='font-bold'>Estadísticas</Badge>
					</CardTitle>
				</CardHeader>
				<CardBody className='space-y-6'>
					<div className='flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800'>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<Icon icon='HeroBuildingOffice' className='text-lg text-blue-600' />
							</div>
							<div>
								<div className='font-medium'>Sucursales</div>
								<div className='text-sm text-zinc-500'>
									Total de sucursales activas
								</div>
							</div>
						</div>
						<div className='text-2xl font-bold text-blue-600'>
							{subempresa.branches_count ||
								(subempresa.sucursales?.length ?? subempresa.branches?.length ?? 0)}
						</div>
					</div>

					<div className='space-y-3'>
						<div className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
							Sucursales registradas
						</div>
						<div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
							{subempresa.sucursales?.length || subempresa.branches?.length ? (
								(subempresa.sucursales?.length
									? subempresa.sucursales
									: subempresa.branches || []
								)?.map((sucursal: IBranch) => (
									<div
										key={sucursal.id}
										className='flex items-start justify-between rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-700'>
										<div className='flex items-start gap-3'>
											<div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100'>
												<Icon
													icon='HeroBuildingLibrary'
													className='text-emerald-600'
												/>
											</div>
											<div>
												<p className='font-medium text-zinc-900 dark:text-zinc-100'>
													{sucursal.branch_name}
												</p>
												{sucursal.branch_address ? (
													<p className='text-xs text-zinc-500'>
														{sucursal.branch_address}
													</p>
												) : null}
											</div>
										</div>
										<div className='text-right text-xs text-zinc-500'>
											{sucursal.commune?.name
												? sucursal.commune?.name
												: 'Sin comuna'}
										</div>
									</div>
								))
							) : (
								<div className='rounded-lg border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700'>
									No hay sucursales registradas actualmente.
								</div>
							)}
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default BasicParts;
