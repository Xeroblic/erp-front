import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { AllowedActionsToolbar } from '@/components/procurement';
import useRecepcionDetalle from './hooks/useRecepcionDetalle';
import StockReceiptSummaryCard from './components/parts/StockReceiptSummaryCard';
import StockReceiptProcessingCard from './components/parts/StockReceiptProcessingCard';
import StockReceiptItemsTable from './components/parts/StockReceiptItemsTable';
import CancelStockReceiptModal from './components/modals/CancelStockReceiptModal';
import ReverseStockReceiptModal from './components/modals/ReverseStockReceiptModal';
import RecepcionFormModal from '../components/modals/RecepcionFormModal';

/**
 * Ficha de recepción física (card 05, sección 7 del contrato). El polling
 * mientras está `queued` vive en `useRecepcionDetalle`; acá sólo se pinta lo
 * que el store tiene en cada momento — la pantalla nunca afirma que hay
 * stock disponible mientras el estado siga siendo `queued`.
 */
const RecepcionDetalleView = () => {
	const {
		branchId,
		subsidiaryId,
		receipt,
		etag,
		loading,
		error,
		isFormModalOpen,
		setIsFormModalOpen,
		isCancelModalOpen,
		setIsCancelModalOpen,
		isReverseModalOpen,
		setIsReverseModalOpen,
		handleAction,
		goToList,
		retry,
		isPosting,
		isRetrying,
	} = useRecepcionDetalle();

	let pendingAction: 'post' | 'retry' | null = null;
	if (isPosting) pendingAction = 'post';
	else if (isRetrying) pendingAction = 'retry';

	return (
		<PageWrapper isProtectedRoute title={receipt ? `Recepción #${receipt.id}` : 'Recepción'}>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroInboxArrowDown' />
					<span>Inventario / Abastecimiento / Recepciones</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' icon='HeroArrowLeft' onClick={goToList}>
						Volver al listado
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				{loading && (
					<div className='space-y-4'>
						<div className='h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700' />
						<div className='h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700' />
					</div>
				)}

				{!loading && error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar la recepción'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={retry}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}

				{!loading && !error && receipt && (
					<>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<AllowedActionsToolbar
								allowedActions={receipt.allowed_actions}
								resource='stock_receipt'
								onAction={handleAction}
								branchId={branchId}
								subsidiaryId={subsidiaryId}
								scope='access'
								pendingAction={pendingAction}
							/>
						</div>

						<StockReceiptSummaryCard receipt={receipt} />
						<StockReceiptProcessingCard receipt={receipt} />
						<StockReceiptItemsTable items={receipt.items} />
					</>
				)}
			</Container>

			<RecepcionFormModal
				isOpen={isFormModalOpen}
				setIsOpen={setIsFormModalOpen}
				subsidiaryId={subsidiaryId}
				branchId={branchId}
				receipt={receipt}
				etag={etag}
				onSuccess={() => setIsFormModalOpen(false)}
				onStaleVersion={retry}
			/>
			<CancelStockReceiptModal
				isOpen={isCancelModalOpen}
				setIsOpen={setIsCancelModalOpen}
				receipt={receipt}
				subsidiaryId={subsidiaryId}
				onCancelled={() => undefined}
			/>
			<ReverseStockReceiptModal
				isOpen={isReverseModalOpen}
				setIsOpen={setIsReverseModalOpen}
				receipt={receipt}
				subsidiaryId={subsidiaryId}
				onReversed={() => undefined}
			/>
		</PageWrapper>
	);
};

export default RecepcionDetalleView;
