import React from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import ReportFiltersInventory from '../components/ReportFiltersInventory';
import { useInventoryReports } from './hooks/useInventoryReports';
import ReportExportButton from '../components/ReportExportButton';

const InventoryReports: React.FC = () => {
	const {
		filters,
		setFilters,
		rows,
		columns,
		reportsLoading,
		reportsError,
		currentSubsidiaryId,
		mapFilters,
		retry,
		pagination,
		setPagination,
		meta,
	} = useInventoryReports();

	return (
		<PageWrapper title='Reportes de inventario' name='Reportes de inventario' isProtectedRoute>
			<Subheader className='group'>
				<SubheaderLeft>
					<div className='flex flex-col items-center justify-center gap-2'>
						<Icon
							icon='HeroCubeTransparent'
							className='text-2xl font-bold group-hover:animate-spin'
						/>
					</div>
					<div className='flex flex-col justify-center'>
						<div className='flex flex-row gap-2'>
							<Badge className='text-3xl font-semibold'>Reportes de inventario</Badge>
						</div>
						<div className='flex flex-row gap-2'>
							<p className='text-sm text-zinc-500'>Existencias, SKUs y valoración</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<ReportExportButton
						subsidiaryId={Number(currentSubsidiaryId ?? 0)}
						type='stock'
						filters={mapFilters(filters)}
					/>
				</SubheaderRight>
			</Subheader>
			<Container>
				<div className='space-y-6'>
					{reportsLoading && (
						<div className='p-4 text-sm text-zinc-500'>
							Cargando datos de inventario...
						</div>
					)}

					{reportsError && (
						<Card className='border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20'>
							<CardBody>
								<div className='flex items-center justify-between'>
									<div className='text-rose-700 dark:text-rose-400'>
										<strong>Error cargando inventario:</strong>{' '}
										{typeof reportsError === 'object' && reportsError !== null
											? JSON.stringify(reportsError)
											: String(reportsError)}
									</div>
									<Button
										variant='outline'
										color='rose'
										size='sm'
										onClick={retry}>
										Reintentar
									</Button>
								</div>
							</CardBody>
						</Card>
					)}

					<ReportFiltersInventory
						initial={filters}
						onApply={(f) => setFilters(f)}
						onReset={() => setFilters({})}
					/>

					<Card className='border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/60 shadow-sm dark:from-emerald-900/10 dark:to-transparent'>
						<CardHeader className='rounded-t-md bg-white/60 dark:bg-zinc-900/40'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100'>
										<Icon
											icon='HeroCubeTransparent'
											className='h-6 w-6 text-emerald-700'
										/>
									</div>
									<div>
										<h2 className='text-lg font-bold text-emerald-900'>
											Reportes de Inventario
										</h2>
										<p className='text-sm text-emerald-700'>
											Existencias, SKUs y valoración
										</p>
									</div>
								</div>
							</div>
						</CardHeader>

						<CardBody>
							<DataTable
								columns={columns}
								data={rows}
								loading={reportsLoading}
								enableSearch={false}
								emptyMessage='Sin resultados para los criterios seleccionados.'
								pageCount={meta ? meta.last_page : -1}
								paginationState={pagination}
								onPaginationChange={setPagination}
							/>
						</CardBody>
					</Card>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default InventoryReports;
