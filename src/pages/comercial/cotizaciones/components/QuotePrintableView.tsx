import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import type { IQuote, IQuoteItem } from '@/interface';
import {
	getCompanyInfo,
	getCustomerInfo,
	resolveUnitPrice,
	resolveLineTotal,
	getProductSku,
	getProductName,
	getProductDetail,
	formatCurrency,
	formatDate,
	getPaymentMethodsLabel,
} from './quote-data-mapper';

interface QuotePrintableViewProps {
	quote: IQuote;
}

const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
	const dispatch = useAppDispatch();
	const state = useSelector((state: RootState) => state);

	// Usar helpers centralizados para obtener datos
	const company = getCompanyInfo(quote, state);
	
	// Efecto para cargar datos de la subsidiaria si faltan
	useEffect(() => {
		if (quote.subsidiary_id && (!company.name || company.name === 'EcoTI')) {
			// Si el nombre es genérico o vacío, intentamos cargar el detalle
			// Validamos que no estemos ya cargando para evitar loops (aunque el thunk suele manejarlo)
			if (!state.subEmpresa.loading && state.subEmpresa.detalle?.id !== quote.subsidiary_id) {
				dispatch(fetchSubsidiariaDetail(quote.subsidiary_id));
			}
		}
	}, [quote.subsidiary_id, company.name, dispatch, state.subEmpresa.loading, state.subEmpresa.detalle?.id]);

	const customer = getCustomerInfo((quote as any).customer);
	const items = (quote.items as IQuoteItem[]) || [];

	// Totales desde el quote (NO calcular, vienen del backend)
	const netTotal = Number((quote as any).subtotal || 0);
	const discount = Number((quote as any).discount_amount || 0);
	const tax = Number((quote as any).tax_amount || 0);
	const total = Number((quote as any).total_amount || 0);
	const paymentMethodsLabel = getPaymentMethodsLabel(company.allowedPaymentMethods as string[]);

	return (
		<div 
            className='mx-auto min-h-[229mm] max-w-[216mm] p-10 font-sans text-[9px] leading-snug shadow-lg print:shadow-none'
            style={{ backgroundColor: '#ffffff', color: '#111827' }}
        >
			{/* Header */}
			<div className='mb-5 flex items-start justify-between'>
				<div className='w-[60%]'>
					<div className='mb-2 flex h-[50px] items-center'>
						{company.logoUrl ? (
							<img
								src={company.logoUrl}
								alt='Logo'
								className='h-full object-contain object-left'
								onError={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
						) : (
							<h1 className='text-sm font-bold uppercase text-gray-900' style={{ color: '#111827' }}>
								{company.name}
							</h1>
						)}
					</div>
					{/* {company.logoUrl && (
						<p className='mb-0.5 text-sm font-bold uppercase text-gray-900' style={{ color: '#111827' }}>
							{company.name}
						</p>
					)} */}
					<p className='text-[9px] text-gray-700' style={{ color: '#374151' }}>Giro: {company.activity}</p>
					<p className='text-[9px] text-gray-700' style={{ color: '#374151' }}>
						Dirección: {company.fullAddress || '—'}
					</p>
					<p className='text-[9px] text-gray-700' style={{ color: '#374151' }}>
						Email: {company.email || '—'} • Fono: {company.phone || '—'}
					</p>
					{company.website && (
						<p className='text-[9px] text-gray-700' style={{ color: '#374151' }}>Web: {company.website}</p>
					)}
				</div>

				<div className='flex w-[36%] flex-col items-center'>
					<div className='w-full border-2 border-rose-600 py-2 text-center' style={{ borderColor: '#e11d48' }}>
						<h2 className='text-xs font-bold text-rose-600' style={{ color: '#e11d48' }}>R.U.T.: {company.rut}</h2>
						<div className='my-1 w-full bg-rose-50 py-0.5' style={{ backgroundColor: '#fff1f2' }}>
							<h3 className='text-xs font-bold uppercase text-rose-600' style={{ color: '#e11d48' }}>
								COTIZACIÓN
							</h3>
						</div>
						<h4 className='text-sm font-bold text-gray-900' style={{ color: '#111827' }}>N° {quote.id}</h4>
					</div>
					<p className='mt-1.5 text-[10px] font-bold text-gray-900' style={{ color: '#111827' }}>
						Fecha: {formatDate(quote.quote_date)}
					</p>
				</div>
			</div>

			{/* Cliente */}
			<div className='mb-5 border border-gray-300 bg-gray-50 p-2 text-gray-900' style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#111827' }}>
				<div className='mb-0.5 flex items-baseline'>
					<span className='w-[60px] text-[8px] font-bold'>Señor(es):</span>
					<span className='flex-1 text-[8px] font-bold uppercase'>{customer.name}</span>
					<span className='w-[30px] text-right text-[8px] font-bold'>RUT:</span>
					<span className='w-[120px] text-right text-[8px]'>{customer.rut}</span>
				</div>
				<div className='mb-0.5 flex items-baseline'>
					<span className='w-[60px] text-[8px] font-bold'>Dirección:</span>
					<span className='flex-1 text-[8px]'>{customer.address}</span>
				</div>
				<div className='mb-0.5 flex items-baseline'>
					<span className='w-[60px] text-[8px] font-bold'>Giro:</span>
					<span className='flex-1 text-[8px]'>{customer.giro}</span>
				</div>
				<div className='flex items-baseline'>
					<span className='w-[60px] text-[8px] font-bold'>Contacto:</span>
					<span className='flex-1 text-[8px]'>{customer.contactName}</span>
					<span className='w-[40px] text-right text-[8px] font-bold'>Fono:</span>
					<span className='w-[150px] text-right text-[8px]'>{customer.phone}</span>
				</div>
			</div>

			{/* Tabla */}
			<div className='mb-2.5 text-gray-900' style={{ color: '#111827' }}>
				{/* Header */}
				<div className='flex border-b border-t border-gray-300 bg-gray-100 py-1.5 text-[9px] font-bold text-gray-900' style={{ borderColor: '#d1d5db', backgroundColor: '#f3f4f6', color: '#111827' }}>
					<div className='w-[8%] text-center'>Cant.</div>
					<div className='w-[17%] pl-1'>Código</div>
					<div className='w-[45%] pl-1'>Descripción</div>
					<div className='w-[15%] pr-1 text-right'>P. Neto</div>
					<div className='w-[15%] pr-1 text-right'>Total</div>
				</div>

				{/* Rows */}
				{items.map((item, idx) => {
					const sku = getProductSku(item);
					const name = getProductName(item);
					const detail = getProductDetail(item);
					const quantity = Number((item as any).quantity || 0);
					const unitPrice = resolveUnitPrice(item);
					const lineTotal = resolveLineTotal(item);

					return (
						<div key={idx} className='flex border-b border-gray-200 py-1.5 text-[9px] text-gray-900' style={{ borderColor: '#e5e7eb', color: '#111827' }}>
							<div className='w-[8%] text-center'>{quantity}</div>
							<div className='w-[17%] pl-1'>{sku}</div>
							<div className='w-[45%] pl-1'>
								<p className='font-bold'>{name}</p>
								{detail && (
									<p className='mt-0.5 text-[7px] text-gray-500' style={{ color: '#6b7280' }}>{detail}</p>
								)}
							</div>
							<div className='w-[15%] pr-1 text-right'>
								{formatCurrency(unitPrice)}
							</div>
							<div className='w-[15%] pr-1 text-right font-bold'>
								{formatCurrency(lineTotal)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Totales */}
			<div className='mb-5 flex justify-end text-gray-900' style={{ color: '#111827' }}>
				<div className='w-[180px]'>
					<div className='mb-1 flex justify-between text-[9px]'>
						<span className='font-bold'>Total Neto:</span>
						<span>{formatCurrency(netTotal)}</span>
					</div>
					{discount > 0 && (
						<div className='mb-1 flex justify-between text-[9px]'>
							<span className='font-bold'>Descuento:</span>
							<span>- {formatCurrency(discount)}</span>
						</div>
					)}
					<div className='mb-1 flex justify-between text-[9px]'>
						<span className='font-bold'>I.V.A.:</span>
						<span>{formatCurrency(tax)}</span>
					</div>
					<div className='mt-1 flex justify-between border-t border-black pt-1' style={{ borderColor: '#000' }}>
						<span className='text-[11px] font-bold'>TOTAL:</span>
						<span className='text-[11px] font-bold'>{formatCurrency(total)}</span>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className='border-t border-gray-200 pt-2.5 text-gray-900' style={{ borderColor: '#e5e7eb', color: '#111827' }}>
				<div className='mb-2.5 flex gap-5'>
					<div className='flex-1'>
						<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
							Condiciones Comerciales
						</h3>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Validez Oferta:{' '}
							{company.quoteValidityText ||
								(company.quoteValidityDays
									? `${company.quoteValidityDays} días hábiles`
									: '7 días hábiles')}
						</p>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Forma de Pago: {paymentMethodsLabel}
						</p>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Entrega: {company.deliveryTerm || 'A convenir o retiro en tienda.'}
						</p>
						{company.commercialTerms && (
							<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
								• {company.commercialTerms}
							</p>
						)}

						{quote.notes && (
							<div className='mt-1.5'>
								<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
									Observaciones
								</h3>
								<p className='text-[8px] text-gray-600' style={{ color: '#4b5563' }}>{quote.notes}</p>
							</div>
						)}
					</div>

					<div className='flex-1'>
						{company.bankInfo.length > 0 && (
							<div>
								<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
									Datos Bancarios
								</h3>
								{company.bankInfo.map((info: string, idx: number) => (
									<p key={idx} className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
										{info}
									</p>
								))}
							</div>
						)}
					</div>
				</div>

				<p className='mt-2.5 text-center text-[8px] text-gray-400' style={{ color: '#9ca3af' }}>
					Documento generado electrónicamente por {company.name}
				</p>
			</div>
		</div>
	);
};

export default QuotePrintableView;
