import React from 'react';
import classNames from 'classnames';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import PageLinkButton from '@/components/procurement/PageLinkButton';
import type { IPageLink } from '@/config/procurementLinks';
import { formatDateTime } from '@/utils/format.utils';
import type {
	IStockReceipt,
	TStockReceiptEnteredLocation,
} from '@/interface/procurement.interface';

interface IStockReceiptProgressCardProps {
	receipt: IStockReceipt;
	/** Ubicación de Inventario donde entró el stock, o `null` si no corresponde ofrecerla. */
	inventoryLink?: IPageLink | null;
	/**
	 * Dónde ingresó el stock (contabilizada) o dónde ingresará (antes). `null`
	 * si no se sabe: la tarjeta no nombra ninguna ubicación.
	 */
	stockLocation?: TStockReceiptEnteredLocation | null;
	/**
	 * La ficha dejó de actualizarse sola (tope de la consulta automática) con
	 * la recepción todavía en `queued`.
	 */
	isPollingStalled?: boolean;
	/** Vuelve a consultar el estado y reanuda la actualización automática. */
	onRefresh?: () => void;
}

type TStepState = 'done' | 'current' | 'error' | 'pending';

interface IStep {
	title: string;
	hint: string;
	state: TStepState;
}

/** «Bodega Central» o «Sin ubicación»; `null` si no se sabe dónde. */
const locationLabel = (location: TStockReceiptEnteredLocation | null): string | null => {
	if (location === null) return null;
	return location.scope === 'warehouse' ? `«${location.warehouse.name}»` : '«Sin ubicación»';
};

/** Aviso de una recepción ingresada: nombra la ubicación sólo si se sabe. */
const postedMessage = (location: TStockReceiptEnteredLocation | null): string => {
	if (location === null) return 'Las unidades ya están disponibles en la sucursal';
	if (location.scope === 'unlocated')
		return 'Las unidades ya están disponibles en la sucursal, en «Sin ubicación»';
	return `Las unidades ya están disponibles en ${locationLabel(location)}`;
};

/** Los tres pasos del contrato (`draft` → `queued` → `posted`) con nombres de bodega. */
const buildSteps = (
	status: IStockReceipt['status'],
	stockLocation: TStockReceiptEnteredLocation | null,
): IStep[] => {
	const isQueued = status === 'queued';
	const isFailed = status === 'failed';
	const isPosted = status === 'posted';
	const pastDraft = isQueued || isFailed || isPosted;

	let ingressState: TStepState = 'pending';
	if (isQueued) ingressState = 'current';
	else if (isFailed) ingressState = 'error';
	else if (isPosted) ingressState = 'done';

	return [
		{
			title: 'Borrador',
			hint: 'Guardada, sin mover stock',
			state: pastDraft ? 'done' : 'current',
		},
		{
			title: 'Ingresando',
			hint: isFailed ? 'No se pudo completar' : 'Procesando el ingreso',
			state: ingressState,
		},
		{
			title: 'En stock',
			hint: `Disponible en ${locationLabel(stockLocation) ?? 'la sucursal'}`,
			state: isPosted ? 'done' : 'pending',
		},
	];
};

const STEP_CIRCLE_CLASSES: Record<TStepState, string> = {
	done: 'bg-emerald-600 text-white',
	current: 'bg-blue-600 text-white',
	error: 'bg-red-600 text-white',
	pending: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300',
};

const StepCircle: React.FC<{ state: TStepState; index: number; isSpinning: boolean }> = ({
	state,
	index,
	isSpinning,
}) => {
	let content: React.ReactNode = index + 1;
	if (state === 'done') content = <Icon icon='HeroCheck' className='h-4 w-4 text-white!' />;
	if (state === 'error')
		content = <Icon icon='HeroExclamationTriangle' className='h-4 w-4 text-white!' />;
	if (isSpinning)
		content = <Icon icon='HeroArrowPath' className='h-4 w-4 animate-spin text-white!' />;
	return (
		<span
			aria-hidden='true'
			className={classNames(
				'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
				STEP_CIRCLE_CLASSES[state],
			)}>
			{content}
		</span>
	);
};

const STEP_STATE_LABEL: Record<TStepState, string> = {
	done: 'completado',
	current: 'en curso',
	error: 'con error',
	pending: 'pendiente',
};

/**
 * Dónde está la recepción y qué hacer ahora. Reemplaza la vieja tarjeta de
 * «Publicación asíncrona»: un avance de tres pasos y un único aviso de
 * siguiente paso.
 *
 * `queued` nunca afirma que el stock ya está disponible; `failed` muestra
 * `failure_message` (texto seguro en español), nunca una traza técnica. Los
 * datos de intentos sólo aparecen cuando hay un error que diagnosticar.
 */
const StockReceiptProgressCard: React.FC<IStockReceiptProgressCardProps> = ({
	receipt,
	inventoryLink = null,
	stockLocation = null,
	isPollingStalled = false,
	onRefresh,
}) => {
	if (receipt.status === 'cancelled') {
		return (
			<Alert
				color='zinc'
				variant='outline'
				icon='HeroXCircle'
				title='Recepción anulada'
				// El gris 500 por defecto casi no se lee sobre fondo oscuro.
				className='text-zinc-700! dark:text-zinc-200!'>
				Se anuló antes de ingresar al stock: nunca movió unidades.
			</Alert>
		);
	}

	if (receipt.status === 'reversed') {
		return (
			<Alert
				color='amber'
				variant='outline'
				icon='HeroArrowUturnLeft'
				title='Recepción revertida'>
				Las unidades que había ingresado se descontaron de donde entraron. La historia se
				conserva.
			</Alert>
		);
	}

	const steps = buildSteps(receipt.status, stockLocation);

	return (
		<Card>
			<CardBody className='space-y-4'>
				<ol
					className='grid grid-cols-1 gap-3 sm:grid-cols-3'
					aria-label='Avance de la recepción'>
					{steps.map((step, index) => (
						<li
							key={step.title}
							aria-current={
								step.state === 'current' || step.state === 'error'
									? 'step'
									: undefined
							}
							className='flex items-center gap-3'>
							<StepCircle
								state={step.state}
								index={index}
								isSpinning={step.state === 'current' && receipt.status === 'queued'}
							/>
							<div className='min-w-0'>
								<p
									className={classNames('font-semibold', {
										'text-zinc-400 dark:text-zinc-500':
											step.state === 'pending',
										'text-zinc-900 dark:text-white': step.state !== 'pending',
									})}>
									{step.title}
									<span className='sr-only'>
										: {STEP_STATE_LABEL[step.state]}
									</span>
								</p>
								<p className='text-xs text-zinc-500 dark:text-zinc-400'>
									{step.hint}
								</p>
							</div>
						</li>
					))}
				</ol>

				{receipt.status === 'draft' && (
					<Alert
						color='blue'
						variant='outline'
						icon='HeroLightBulb'
						title='Siguiente paso'>
						Cuando confirmes que la mercadería está en bodega, pulsa{' '}
						<strong>«Ingresar al stock»</strong>. Mientras sea borrador no suma stock y
						todavía puedes editarla o anularla.
					</Alert>
				)}

				{receipt.status === 'queued' && !isPollingStalled && (
					<Alert
						color='blue'
						variant='outline'
						icon='HeroClock'
						title='Ingresando al stock'>
						Se está procesando en segundo plano. El stock todavía <strong>no</strong>{' '}
						está disponible — esta pantalla se actualiza sola cuando termine.
					</Alert>
				)}

				{receipt.status === 'queued' && isPollingStalled && (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroClock'
						title='Sigue ingresando'
						role='status'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>
								Está tardando más de lo normal y esta pantalla dejó de actualizarse
								sola. Actualiza para ver el estado; el stock todavía{' '}
								<strong>no</strong> está disponible.
							</span>
							{onRefresh && (
								<Button
									size='sm'
									variant='outline'
									color='amber'
									icon='HeroArrowPath'
									onClick={onRefresh}>
									Actualizar
								</Button>
							)}
						</div>
					</Alert>
				)}

				{receipt.status === 'posted' && (
					<Alert
						color='emerald'
						variant='outline'
						icon='HeroCheckCircle'
						title='Ingresada al stock'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>
								{postedMessage(stockLocation)}
								{receipt.posted_at &&
									` desde el ${formatDateTime(receipt.posted_at)}`}
								.
							</span>
							{inventoryLink && (
								<PageLinkButton
									link={inventoryLink}
									size='sm'
									variant='outline'
									color='emerald'
									icon='HeroCube'>
									Ver en inventario
								</PageLinkButton>
							)}
						</div>
					</Alert>
				)}

				{receipt.status === 'failed' && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No se pudo ingresar al stock'>
						<div className='space-y-3'>
							<p>{receipt.failure_message ?? 'El ingreso terminó con un error.'}</p>
							<p>
								Usa <strong>«Editar»</strong> si hay que cambiar algún dato, o{' '}
								<strong>«Reintentar»</strong> si el problema fue pasajero.
							</p>
							<dl className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-3'>
								<div>
									<dt className='text-zinc-500 dark:text-zinc-400'>Intentos</dt>
									<dd className='font-medium'>
										{receipt.processing.attempt_count}
									</dd>
								</div>
								<div>
									<dt className='text-zinc-500 dark:text-zinc-400'>
										Último intento
									</dt>
									<dd className='font-medium'>
										{receipt.processing.last_attempt_at
											? formatDateTime(receipt.processing.last_attempt_at)
											: '—'}
									</dd>
								</div>
								<div>
									<dt className='text-zinc-500 dark:text-zinc-400'>
										Próximo reintento automático
									</dt>
									<dd className='font-medium'>
										{receipt.processing.next_retry_at
											? formatDateTime(receipt.processing.next_retry_at)
											: 'No programado'}
									</dd>
								</div>
							</dl>
						</div>
					</Alert>
				)}
			</CardBody>
		</Card>
	);
};

export default StockReceiptProgressCard;
