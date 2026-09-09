import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Card, { CardBody } from '@/components/ui/Card';
import {
	AllowedActionsToolbar,
	CostBlock,
	CostInput,
	ProductCard,
	WarehouseLabel,
} from '@/components/procurement';
import { PROCUREMENT_ERROR_DEFINITIONS } from '@/utils/procurementErrors.util';
import {
	PROCUREMENT_PER_PAGE_DEFAULT,
	PROCUREMENT_PER_PAGE_MAX,
} from '@/interface/procurement.interface';
import { inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import { describePageRange } from '@/utils/procurementPagination.util';
import useCatalogoContrato from './hooks/useCatalogoContrato';
import CatalogSection from './components/parts/CatalogSection';
import CatalogSample from './components/parts/CatalogSample';

/**
 * Catálogo de los componentes compartidos del módulo de abastecimiento.
 *
 * Cumple el criterio de cierre de la card 01: cada componente compartido, en
 * cada estado que el contrato admite, en una pantalla navegable. No hay
 * Storybook en el repo, así que el catálogo es la pantalla.
 *
 * No consulta ningún endpoint: los datos vienen de `@/mocks/db/procurement.db`,
 * copiados de los ejemplos del contrato.
 */
const CatalogoContratoView = () => {
	const {
		branchId,
		subsidiaryId,
		costSamples,
		productSamples,
		warehouseSamples,
		actionSamples,
		costForm,
		lastAction,
		handleAction,
	} = useCatalogoContrato();

	const errorEntries = Object.values(PROCUREMENT_ERROR_DEFINITIONS);
	const pageRange = describePageRange(inventoryStockEnvelope.meta);

	return (
		<PageWrapper isProtectedRoute title='Catálogo del contrato de abastecimiento'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroCube' />
					<span>Inventario / Abastecimiento / Catálogo del contrato</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Badge variant='outline' color='amber'>
						Mock · sin backend
					</Badge>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-4'>
					<h1 className='text-2xl font-semibold'>
						Catálogo del contrato de abastecimiento
					</h1>

					<Alert color='amber' icon='HeroExclamationTriangle'>
						Ninguno de los endpoints de este módulo existe todavía. Todo lo que se ve
						acá sale de fixtures locales copiados de los ejemplos del contrato (PR #67
						del backend, <code>frontend-guide.md</code>). Sirve para acordar la
						presentación antes de que haya una línea de implementación.
					</Alert>

					<CatalogSection
						id='catalogo-producto'
						title='Tarjeta de producto'
						summary='Las listas del módulo traen la ficha completa embebida por fila: ninguna pantalla pide un producto extra para pintar una tabla.'>
						<div className='flex flex-col gap-3'>
							{productSamples.map((sample) => (
								<CatalogSample
									key={sample.id}
									title={sample.title}
									description={sample.description}>
									<ProductCard product={sample.product} />
								</CatalogSample>
							))}

							<CatalogSample
								title='Densidad compacta'
								description='Variante para celdas de tabla: sin descripción, categorías ni precios.'>
								<ProductCard
									product={productSamples[0].product}
									density='compact'
								/>
							</CatalogSample>
						</div>
					</CatalogSection>

					<CatalogSection
						id='catalogo-costo'
						title='Bloque de costo (lectura)'
						summary='Monto ingresado con su base, desglose neto / IVA / bruto, costo efectivo con su base, y las etiquetas de origen y cálculo. Siempre el resultado del servidor.'>
						<div className='grid gap-3 md:grid-cols-2'>
							{costSamples.map((sample) => (
								<CatalogSample
									key={sample.id}
									title={sample.title}
									description={sample.description}>
									<CostBlock cost={sample.cost} />
								</CatalogSample>
							))}
						</div>
					</CatalogSection>

					<CatalogSection
						id='catalogo-costo-entrada'
						title='Input de costo (escritura)'
						summary='Monto y selector neto / bruto, y nada más. El IVA, el neto derivado, el bruto derivado y el costo efectivo no se digitan ni se envían.'>
						<form onSubmit={costForm.handleSubmit} noValidate>
							<CostInput
								amountName='unit_cost'
								basisName='unit_cost_basis'
								amountValue={costForm.values.unit_cost}
								basisValue={costForm.values.unit_cost_basis}
								onChange={costForm.handleChange}
								onBlur={costForm.handleBlur}
								amountError={
									costForm.touched.unit_cost
										? costForm.errors.unit_cost
										: undefined
								}
								basisError={
									costForm.touched.unit_cost_basis
										? costForm.errors.unit_cost_basis
										: undefined
								}
							/>
							<p className='mt-3 text-xs text-zinc-500 dark:text-zinc-400'>
								Escribe un monto inválido para ver la validación, o cambia la base
								para ver cómo se invierte el cálculo. Al enviar se muestra el
								payload exacto que iría al backend: dos campos.
							</p>
						</form>
					</CatalogSection>

					<CatalogSection
						id='catalogo-ubicacion'
						title='Etiqueta de ubicación'
						summary='Todo warehouse_id null se lee «Sin ubicación» en las ocho cards, con el mismo texto y el mismo tratamiento visual.'>
						<div className='flex flex-col gap-3'>
							{warehouseSamples.map((sample) => (
								<CatalogSample
									key={sample.id}
									title={sample.title}
									description={sample.description}>
									<WarehouseLabel warehouse={sample.warehouse} />
								</CatalogSample>
							))}
						</div>
					</CatalogSection>

					<CatalogSection
						id='catalogo-acciones'
						title='Botonera de allowed_actions'
						summary='El backend decide qué ofrecer según estado y permiso; cada botón igual pasa por su guard con el contexto de sucursal. La lista no sustituye la autorización.'>
						<div className='flex flex-col gap-3'>
							{actionSamples.map((sample) => (
								<CatalogSample
									key={sample.id}
									title={sample.title}
									description={sample.description}>
									<AllowedActionsToolbar
										allowedActions={sample.allowedActions}
										resource={sample.resource}
										branchId={branchId}
										subsidiaryId={subsidiaryId}
										scope='access'
										onAction={handleAction}
									/>
								</CatalogSample>
							))}
							<p
								aria-live='polite'
								className='text-xs text-zinc-500 dark:text-zinc-400'>
								{lastAction === null
									? 'Ninguna acción ejecutada todavía.'
									: `Última acción solicitada: ${lastAction}`}
							</p>
						</div>
					</CatalogSection>

					<CatalogSection
						id='catalogo-envoltorio'
						title='Envoltorio y paginación'
						summary={`page / per_page, defecto ${PROCUREMENT_PER_PAGE_DEFAULT} y máximo ${PROCUREMENT_PER_PAGE_MAX}. Los totales son de toda la consulta autorizada, no de la página visible.`}>
						<div className='grid gap-3 md:grid-cols-2'>
							<CatalogSample
								title='context al mismo nivel que data'
								description='El alcance de la consulta viaja fuera de data: acá, «Sin ubicación» en la sucursal 4.'>
								<dl className='space-y-1 text-sm'>
									<div className='flex justify-between gap-4'>
										<dt className='text-zinc-500 dark:text-zinc-400'>scope</dt>
										<dd className='font-mono'>
											{inventoryStockEnvelope.context?.scope}
										</dd>
									</div>
									<div className='flex justify-between gap-4'>
										<dt className='text-zinc-500 dark:text-zinc-400'>
											branch_id
										</dt>
										<dd className='font-mono'>
											{inventoryStockEnvelope.context?.branch_id}
										</dd>
									</div>
									<div className='flex justify-between gap-4'>
										<dt className='text-zinc-500 dark:text-zinc-400'>
											warehouse
										</dt>
										<dd>
											<WarehouseLabel
												warehouse={
													inventoryStockEnvelope.context?.warehouse ??
													null
												}
												withIcon={false}
											/>
										</dd>
									</div>
								</dl>
							</CatalogSample>

							<CatalogSample
								title='meta cuenta la consulta completa'
								description='meta.total de un listado de stock cuenta productos, no unidades, y no se deriva sumando la página.'>
								<p className='text-sm'>
									{pageRange ?? 'Sin resultados'}
									<span className='ml-2 text-xs text-zinc-500 dark:text-zinc-400'>
										(per_page {inventoryStockEnvelope.meta.per_page})
									</span>
								</p>
							</CatalogSample>
						</div>
					</CatalogSection>

					<CatalogSection
						id='catalogo-errores'
						title='Mapa de errores'
						summary='Códigos estables de la sección 16 del contrato. El texto del backend manda; el mapa aporta la acción que corresponde ofrecer y un respaldo si no viene mensaje.'>
						<Card className='overflow-x-auto'>
							<CardBody>
								<table className='w-full min-w-[40rem] text-left text-sm'>
									<caption className='sr-only'>
										Códigos de error del módulo de abastecimiento, su estado
										HTTP y la acción que corresponde
									</caption>
									<thead>
										<tr className='border-b border-zinc-200 dark:border-zinc-700'>
											<th scope='col' className='py-2 pr-3 font-semibold'>
												HTTP
											</th>
											<th scope='col' className='py-2 pr-3 font-semibold'>
												Código
											</th>
											<th scope='col' className='py-2 pr-3 font-semibold'>
												Acción
											</th>
											<th scope='col' className='py-2 font-semibold'>
												Mensaje de respaldo
											</th>
										</tr>
									</thead>
									<tbody>
										{errorEntries.map((definition) => (
											<tr
												key={definition.code}
												className='border-b border-zinc-100 last:border-0 dark:border-zinc-800'>
												<td className='py-2 pr-3 tabular-nums'>
													{definition.status}
												</td>
												<td className='py-2 pr-3 font-mono text-xs'>
													{definition.code}
												</td>
												<td className='py-2 pr-3 font-mono text-xs'>
													{definition.action}
												</td>
												<td className='py-2 text-zinc-600 dark:text-zinc-300'>
													{definition.fallbackMessage}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</CardBody>
						</Card>
					</CatalogSection>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default CatalogoContratoView;
