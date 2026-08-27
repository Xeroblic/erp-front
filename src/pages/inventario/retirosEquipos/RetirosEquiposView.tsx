import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Alert from '@/components/ui/Alert';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { WITHDRAWALS_USE_MOCKS } from '@/store/slices/equipmentWithdrawals';
import RetirosFilters from './components/filters/RetirosFilters';
import RetirosTable from './components/tables/RetirosTable';
import { useRetirosEquipos } from './hooks/useRetirosEquipos';

const RetirosEquiposView: React.FC = () => {
	const {
		rows,
		meta,
		isLoading,
		error,
		hasValidBranch,
		quickFilter,
		applyQuickFilter,
		pageIndex,
		pageSize,
		onPageChange,
		searchValue,
		onSearchChange,
		reload,
	} = useRetirosEquipos();
	return (
		<PageWrapper isProtectedRoute title='Retiros de equipos' name='retiros-equipos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroArchiveBox' />
					<span>Inventario / Retiros de equipos</span>
				</SubheaderLeft>
			</Subheader>

			<Container className='space-y-4'>
				{WITHDRAWALS_USE_MOCKS && (
					<Alert color='amber' variant='outline' icon='HeroExclamationTriangle'>
						Estás viendo datos de ejemplo. No representan retiros reales ni deben usarse
						para tomar decisiones operativas.
					</Alert>
				)}
				<RetirosFilters
					quickFilter={quickFilter}
					searchValue={searchValue}
					onQuickFilterChange={applyQuickFilter}
					onSearchChange={onSearchChange}
				/>
				<Card>
					<CardBody className='space-y-4'>
						{!hasValidBranch && (
							<Alert color='amber' variant='outline' icon='HeroExclamationTriangle'>
								No se pudo determinar tu sucursal activa. Selecciona una sucursal
								para ver los retiros.
							</Alert>
						)}
						{error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No se pudieron cargar los retiros'>
								<div className='flex flex-wrap items-center gap-3'>
									<span>{error}</span>
									<Button
										size='sm'
										variant='outline'
										color='red'
										onClick={reload}>
										Reintentar
									</Button>
								</div>
							</Alert>
						)}
						<RetirosTable
							rows={rows}
							loading={isLoading}
							pageCount={meta?.last_page ?? 1}
							pageIndex={pageIndex}
							pageSize={pageSize}
							onPageChange={onPageChange}
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default RetirosEquiposView;
