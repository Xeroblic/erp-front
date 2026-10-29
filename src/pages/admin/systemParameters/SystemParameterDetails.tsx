import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { systemParametersMock } from './mocks/systemParameters.mock';

const SystemParameterDetails: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	// En un escenario real, esto vendría de una API
	const parameter = systemParametersMock.find((p) => p.id === parseInt(id || ''));

	if (!parameter) {
		return (
			<PageWrapper
				title='Parámetro no encontrado'
				isProtectedRoute
				name='Parámetro no encontrado'>
				<Container>
					<div className='flex h-64 flex-col items-center justify-center text-center'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-600'
						/>
						<h3 className='mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
							Parámetro no encontrado
						</h3>
						<p className='mb-6 max-w-md text-zinc-500 dark:text-zinc-400'>
							El parámetro que buscas no existe o ha sido eliminado.
						</p>
						<Button
							variant='outline'
							icon='HeroArrowLeft'
							onClick={() => navigate('/admin/system-parameters')}>
							Volver a Parámetros
						</Button>
					</div>
				</Container>
			</PageWrapper>
		);
	}

	const formatValue = () => {
		const { value, data_type } = parameter;

		switch (data_type) {
			case 'boolean':
				return value === 'true' ? 'Verdadero' : 'Falso';
			case 'json':
				try {
					return JSON.stringify(JSON.parse(value), null, 2);
				} catch {
					return value;
				}
			case 'date':
				try {
					return new Date(value).toLocaleString('es-CL');
				} catch {
					return value;
				}
			default:
				return value;
		}
	};

	const getCategoryColor = (category: string) => {
		const colors = {
			general: 'blue',
			system: 'red',
			email: 'green',
			security: 'yellow',
			integration: 'purple',
			ui: 'pink',
			business: 'indigo',
		} as const;
		return colors[category as keyof typeof colors] || 'gray';
	};

	const getDataTypeColor = (dataType: string) => {
		const colors = {
			string: 'green',
			number: 'blue',
			boolean: 'purple',
			json: 'orange',
			date: 'pink',
		} as const;
		return colors[dataType as keyof typeof colors] || 'gray';
	};

	return (
		<PageWrapper
			title={`Parámetro: ${parameter.key}`}
			isProtectedRoute
			name={`Parámetro: ${parameter.key}`}>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30'>
							<span className='font-mono text-sm font-bold text-blue-600 dark:text-blue-400'>
								{parameter.data_type.charAt(0).toUpperCase()}
							</span>
						</div>
						<div>
							<h1 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								{parameter.key}
							</h1>
							<p className='text-sm text-zinc-600 dark:text-zinc-400'>
								Detalles del parámetro de sistema
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex items-center space-x-3'>
						<Button
							variant='outline'
							icon='HeroArrowLeft'
							onClick={() => navigate('/admin/system-parameters')}>
							Volver
						</Button>
						{parameter.is_editable && (
							<Button
								icon='HeroPencil'
								onClick={() => {
									// Aquí iríamos a la página de edición o abriríamos modal
									navigate(`/admin/system-parameters/${parameter.id}/edit`);
								}}>
								Editar
							</Button>
						)}
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-6'>
					{/* Información básica */}
					<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
						<div className='space-y-6 lg:col-span-2'>
							<Card>
								<CardHeader>
									<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										Información General
									</h3>
								</CardHeader>
								<CardBody className='space-y-6'>
									<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Clave
											</label>
											<div className='rounded-lg bg-zinc-100 p-3 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'>
												{parameter.key}
											</div>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												ID
											</label>
											<div className='rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
												#{parameter.id}
											</div>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Categoría
											</label>
											<Badge className='capitalize'>
												{parameter.category}
											</Badge>
										</div>

										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Tipo de Dato
											</label>
											<Badge
												variant='outline'
												className='font-mono capitalize'>
												{parameter.data_type}
											</Badge>
										</div>
									</div>

									<div>
										<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
											Descripción
										</label>
										<div className='rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
											{parameter.description}
										</div>
									</div>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										Valor y Configuración
									</h3>
								</CardHeader>
								<CardBody className='space-y-6'>
									<div>
										<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
											Valor Actual
										</label>
										<div className='rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800'>
											<pre className='whitespace-pre-wrap font-mono text-sm text-zinc-900 dark:text-zinc-100'>
												{formatValue()}
											</pre>
										</div>
									</div>

									{parameter.default_value && (
										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Valor por Defecto
											</label>
											<div className='rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50'>
												<pre className='whitespace-pre-wrap font-mono text-sm text-zinc-600 dark:text-zinc-400'>
													{parameter.default_value}
												</pre>
											</div>
										</div>
									)}

									{parameter.validation_rules && (
										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Reglas de Validación
											</label>
											<div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
												<code className='text-sm text-amber-800 dark:text-amber-200'>
													{parameter.validation_rules}
												</code>
											</div>
										</div>
									)}
								</CardBody>
							</Card>
						</div>

						{/* Panel lateral */}
						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										Estado
									</h3>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-zinc-600 dark:text-zinc-400'>
											Editable
										</span>
										<Badge>{parameter.is_editable ? 'Sí' : 'No'}</Badge>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-zinc-600 dark:text-zinc-400'>
											Visible
										</span>
										<Badge>{parameter.is_visible ? 'Sí' : 'No'}</Badge>
									</div>
								</CardBody>
							</Card>

							<Card>
								<CardHeader>
									<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
										Información de Auditoría
									</h3>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div>
										<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
											Creado
										</label>
										<div className='text-sm text-zinc-600 dark:text-zinc-400'>
											{new Date(parameter.created_at).toLocaleString('es-CL')}
										</div>
									</div>
									<div>
										<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
											Última Actualización
										</label>
										<div className='text-sm text-zinc-600 dark:text-zinc-400'>
											{new Date(parameter.updated_at).toLocaleString('es-CL')}
										</div>
									</div>
									{parameter.updated_by && (
										<div>
											<label className='mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
												Actualizado por
											</label>
											<div className='text-sm text-zinc-600 dark:text-zinc-400'>
												{parameter.updated_by}
											</div>
										</div>
									)}
								</CardBody>
							</Card>

							{/* Acciones rápidas */}
							{parameter.is_editable && (
								<Card>
									<CardHeader>
										<h3 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
											Acciones
										</h3>
									</CardHeader>
									<CardBody className='space-y-3'>
										<Button
											variant='outline'
											icon='HeroPencil'
											className='w-full justify-center'
											onClick={() => {
												// Navegar a edición o abrir modal
												navigate(
													`/admin/system-parameters?edit=${parameter.id}`,
												);
											}}>
											Editar Parámetro
										</Button>
										<Button
											variant='outline'
											color='red'
											icon='HeroTrash'
											className='w-full justify-center'
											onClick={() => {
												// Navegar con confirmación de eliminación
												navigate(
													`/admin/system-parameters?delete=${parameter.id}`,
												);
											}}>
											Eliminar
										</Button>
									</CardBody>
								</Card>
							)}
						</div>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default SystemParameterDetails;
