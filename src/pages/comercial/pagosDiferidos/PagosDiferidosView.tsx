import React from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import DeferredPaymentsFilters from './components/filters/DeferredPaymentsFilters';
import DeferredPaymentsKpis from './components/kpis/DeferredPaymentsKpis';
import DeferredPaymentsTable from './components/tables/DeferredPaymentsTable';
import { usePagosDiferidos } from './hooks/usePagosDiferidos';

const PagosDiferidosView: React.FC = () => {
	const { data, filters } = usePagosDiferidos();

	return (
		<PageWrapper isProtectedRoute title='Pagos diferidos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBanknotes' />
					<span>Comercial / Pagos diferidos</span>
				</SubheaderLeft>
			</Subheader>
			<Container className='space-y-4'>
				<DeferredPaymentsKpis summary={data.summary} />
				<DeferredPaymentsFilters
					filters={filters.values}
					search={filters.search}
					onSearchChange={filters.setSearch}
					onChange={filters.setFilter}
					onReset={filters.reset}
				/>
				<DeferredPaymentsTable
					rows={data.list}
					meta={data.meta}
					onPageChange={(page) => filters.setFilter({ page })}
				/>
			</Container>
		</PageWrapper>
	);
};

export default PagosDiferidosView;
