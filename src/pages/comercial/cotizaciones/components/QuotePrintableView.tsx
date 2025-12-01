import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { IQuote, IQuoteItem, ISubempresa } from '@/interface';

interface QuotePrintableViewProps {
	quote: IQuote;
}

const parseNumber = (val: unknown) => Number(val) || 0;
const formatCurrency = (val: unknown) =>
	new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseNumber(val));
const formatDate = (val?: string) => (val ? new Date(val).toLocaleDateString('es-CL') : '—');

const usePersonalizedSubsidiary = (quote: IQuote) => {
	const quoteSubsidiary = (quote as any)?.subsidiary as ISubempresa | undefined;
	const personalization = useSelector((state: RootState) => state.personalizacion?.personalizacionUsuario);
	const currentCompanySubs = useSelector(
		(state: RootState) => (state.personalizacion as any)?.current_company?.subsidiaries,
	);
	const subsidiaries = useSelector((state: RootState) => state.subEmpresa?.lista || []);
	const detail = useSelector((state: RootState) => state.subEmpresa?.detalle);
	const mainCompany = useSelector((state: RootState) => state.empresa?.miEmpresa);

	const personalizationSubId = personalization?.subsidiary_id;

	if (Array.isArray(currentCompanySubs) && personalizationSubId) {
		const match = currentCompanySubs.find(
			(sub: any) => Number(sub.id) === Number(personalizationSubId),
		);
		if (match) return match as ISubempresa;
	}

	if (detail && Number(detail.id) === Number(quote.subsidiary_id)) return detail as ISubempresa;

	if (quoteSubsidiary && Number(quoteSubsidiary.id) === Number(quote.subsidiary_id)) {
		return quoteSubsidiary;
	}

	const byQuote = subsidiaries.find((s) => Number(s.id) === Number(quote.subsidiary_id));
	if (byQuote) return byQuote as ISubempresa;

	return mainCompany as unknown as ISubempresa | undefined;
};

const useQuoteData = (quote: IQuote) => {
	const activeSub = usePersonalizedSubsidiary(quote);
	const mainCompany = useSelector((state: RootState) => state.empresa?.miEmpresa);

	const name = activeSub?.subsidiary_name || mainCompany?.company_name || 'EcoTI';
	const rut = activeSub?.subsidiary_rut || mainCompany?.company_rut || '—';
	const activity = activeSub?.subsidiary_giro || 'Venta de equipos computacionales';
	const address = activeSub?.subsidiary_address
		? `${activeSub.subsidiary_address}${
				(activeSub as any)?.commune?.name ? `, ${(activeSub as any).commune.name}` : ''
		  }`
		: mainCompany?.company_address || '';
	const phone = activeSub?.subsidiary_phone || mainCompany?.company_phone || '';
	const email = activeSub?.subsidiary_email || mainCompany?.contact_email || '';
	const website = activeSub?.subsidiary_website || mainCompany?.company_website || '';
	const logo =
		(activeSub as any)?.logo_base_64 ||
		(activeSub as any)?.logo_url ||
		(mainCompany as any)?.company_logo;

	return { name, rut, activity, address, phone, email, website, logo };
};

const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
	const company = useQuoteData(quote);
	const customer = (quote.customer as any) || {};
	const items = (quote.items as IQuoteItem[]) || [];

	const resolveUnitPrice = (item: IQuoteItem) =>
		parseNumber((item as any).unit_price ?? (item as any).price ?? (item as any).unit_price_net);
	const resolveLineTotal = (item: IQuoteItem) =>
		parseNumber(
			(item as any).total ??
				(item as any).line_total ??
				(item as any).subtotal ??
				(item as any).line_net ??
				resolveUnitPrice(item) * parseNumber(item.quantity),
		);

	const netTotal = items.reduce((acc, item) => acc + resolveLineTotal(item), 0);
	const tax = parseNumber((quote as any).tax_amount || (quote as any).total_tax);
	const total = parseNumber((quote as any).total_amount || netTotal + tax);

	return (
		<div className='bg-white p-3 min-h-[229mm] max-w-[201mm] mx-auto text-xs text-gray-800 font-sans shadow-lg'>
			<div className='mb-8 flex items-start justify-between'>
				<div className='w-3/5'>
					<div className='mb-4'>
						{company.logo ? (
							<img src={company.logo} alt='Logo' className='h-12 object-contain' />
						) : (
							<h1 className='text-2xl font-bold uppercase text-gray-800'>{company.name}</h1>
						)}
					</div>
					<div className='space-y-1 text-[11px] leading-tight text-gray-600'>
						<p className='text-sm font-bold uppercase text-gray-900'>{company.name}</p>
						<p>
							<span className='font-semibold'>Giro:</span> {company.activity}
						</p>
						<p>
							<span className='font-semibold'>Dirección:</span> {company.address}
						</p>
						<p>
							<span className='font-semibold'>Email:</span> {company.email}
						</p>
						<p>
							<span className='font-semibold'>Fono:</span> {company.phone}
						</p>
						{company.website && (
							<p>
								<span className='font-semibold'>Web:</span> {company.website}
							</p>
						)}
					</div>
				</div>

				<div className='flex w-2/5 flex-col items-end'>
					<div className='w-64 border-2 border-red-600 py-4 text-center'>
						<h2 className='text-lg font-black tracking-wide text-red-600'>R.U.T.: {company.rut}</h2>
						<div className='my-1 bg-red-50 py-1'>
							<h3 className='text-base font-bold uppercase tracking-widest text-red-600'>
								COTIZACIÓN
							</h3>
						</div>
						<h4 className='text-lg font-black text-red-600'>N° {quote.id}</h4>
					</div>
					<p className='mt-2 text-right font-bold text-gray-800'>
						Santiago, {formatDate(quote.quote_date)}
					</p>
				</div>
			</div>

			<div className='mb-6 rounded-sm border border-gray-300 bg-gray-50 p-3'>
				<div className='grid grid-cols-[60px_1fr_40px_1fr] items-baseline gap-x-2 gap-y-1'>
					<div className='font-bold'>Señor(es):</div>
					<div className='font-bold uppercase'>{customer.name || customer.razon_social}</div>
					<div className='font-bold text-right'>RUT:</div>
					<div>{customer.rut}</div>

					<div className='font-bold'>Dirección:</div>
					<div className='col-span-3'>{customer.address}</div>

					<div className='font-bold'>Giro:</div>
					<div className='col-span-3'>{customer.giro}</div>

					<div className='font-bold'>Contacto:</div>
					<div>{customer.contact_name}</div>
					<div className='font-bold text-right'>Fono:</div>
					<div>{customer.phone}</div>
				</div>
			</div>

			<div className='mb-8'>
				<table className='w-full border-collapse border border-gray-300'>
					<thead className='bg-gray-100 text-[10px] uppercase text-gray-900'>
						<tr>
							<th className='border border-gray-300 py-2 w-12'>Cant.</th>
							<th className='border border-gray-300 px-2 py-2 text-left w-24'>Código</th>
							<th className='border border-gray-300 px-2 py-2 text-left'>Descripción</th>
							<th className='border border-gray-300 px-2 py-2 text-right w-24'>Precio Neto</th>
							<th className='border border-gray-300 px-2 py-2 text-right w-24'>Total Neto</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item, idx) => {
							const sku =
								(item as any)?.product?.sku ||
								(item as any)?.customer_sku ||
								(item as any)?.meta_json?.mapping?.sku ||
								'—';
							const name =
								(item as any)?.product?.name ||
								(item as any)?.customer_name ||
								(item as any)?.name ||
								'Producto sin nombre';
							const unitPrice = resolveUnitPrice(item);
							const lineTotal = resolveLineTotal(item);

							return (
								<tr key={idx} className='border-b border-gray-200'>
									<td className='border-l border-r border-gray-300 py-2 text-center align-top'>
										{item.quantity}
									</td>
									<td className='border-r border-gray-300 px-2 py-2 align-top text-gray-600'>
										{sku}
									</td>
									<td className='border-r border-gray-300 px-2 py-2 align-top'>
										<p className='font-bold'>{name}</p>
										{item.description && (
											<p className='mt-1 whitespace-pre-wrap text-[10px] text-gray-500'>
												{item.description}
											</p>
										)}
									</td>
									<td className='border-r border-gray-300 px-2 py-2 text-right align-top'>
										{formatCurrency(unitPrice)}
									</td>
									<td className='border-r border-gray-300 px-2 py-2 text-right align-top font-bold'>
										{formatCurrency(lineTotal)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<div className='flex gap-8'>
				<div className='flex-1 space-y-2 text-[10px]'>
					<div className='border-l-2 border-gray-300 pl-2'>
						<h3 className='mb-1 underline font-bold uppercase'>Condiciones Comerciales Generales</h3>
						<p>Validez: 7 días</p>
						<p>Forma de Pago: A convenir</p>
						<p>Entrega: A convenir</p>
					</div>
					{quote.notes && (
						<div className='rounded border border-yellow-100 bg-yellow-50 p-2'>
							<span className='font-bold block'>Observaciones:</span>
							{quote.notes}
						</div>
					)}
				</div>

				<div className='w-64'>
					<table className='w-full text-right'>
						<tbody>
							<tr>
								<td className='py-1 pr-4 font-bold text-gray-600'>Total Neto:</td>
								<td className='py-1 font-bold text-gray-800'>{formatCurrency(netTotal)}</td>
							</tr>
							<tr>
								<td className='py-1 pr-4 font-bold text-gray-600'>I.V.A.:</td>
								<td className='py-1 font-bold text-gray-800'>{formatCurrency(tax)}</td>
							</tr>
							<tr className='text-sm'>
								<td className='py-2 pr-4 border-t border-gray-300 font-black text-gray-900'>TOTAL:</td>
								<td className='py-2 border-t border-gray-300 font-black text-gray-900'>
									{formatCurrency(total)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default QuotePrintableView;
