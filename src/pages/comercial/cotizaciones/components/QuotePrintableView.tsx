import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { IQuote, IQuoteItem } from '../../../../interface/quotes.interface';
import type { ISubempresa, IEmpresa } from '@/interface/empresas.interface';

interface QuotePrintableViewProps {
    quote: IQuote;
}

// --- 1. Funciones de Formato y Ayuda ---

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const parseNumber = (value: any): number => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};

const formatCurrency = (value: any) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
        parseNumber(value)
    );

const computeItemTotal = (item: IQuoteItem) => {
    const quantity = parseNumber(item.quantity || 0);
    const unit = parseNumber(item.unit_price || 0);
    const discount = parseNumber((item as any).discount_amount ?? 0);
    return (quantity * unit) - discount;
};

const normalizeText = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : undefined;
};

// --- 2. Lógica de Extracción de Datos (La parte "Inteligente") ---

interface CompanyInfo {
    name: string;
    rut: string;
    activity: string; // Giro
    address: string;
    commune?: string;
    email: string;
    phone: string;
    website?: string;
    logoUrl?: string;
    bankInfo: string[];
}

const fallbackCompany: CompanyInfo = {
    name: 'SU EMPRESA LTDA.',
    rut: '77.000.000-0',
    activity: 'Venta de Artículos Computacionales',
    address: 'Av. Principal 1234',
    commune: 'Santiago',
    email: 'contacto@suempresa.cl',
    phone: '+56 9 1234 5678',
    bankInfo: [],
};

// Hook personalizado para extraer la info correcta
const useQuoteIssuer = (quote: IQuote): CompanyInfo => {
	// Obtenemos todas las posibles fuentes de datos del Store
	const subsidiaries = useSelector((state: RootState) => state.subEmpresa?.lista || []);
	const mainCompany = useSelector((state: RootState) => state.empresa?.miEmpresa);
    
    // 1. Intentar encontrar la subsidiaria específica de la cotización
    const activeSub = subsidiaries.find(s => Number(s.id) === Number(quote.subsidiary_id));
    
	// 2. Si no hay subsidiaria, usar la empresa principal
	const source: ISubempresa | IEmpresa | undefined = activeSub || mainCompany || undefined;
    
    // 3. Extraer metadatos guardados en la cotización (si existen, tienen prioridad visual a veces)
    const meta = (quote.metadata as any)?.company || {};

    // Helpers de extracción segura
    const getVal = (...candidates: any[]) => candidates.find(c => normalizeText(c)) || undefined;

	// Helpers para leer campos según tipo de fuente
	const asSub = (src: ISubempresa | IEmpresa | undefined): ISubempresa | undefined =>
		src && 'company_name' in src === false ? src : undefined;
	const asMain = (src: ISubempresa | IEmpresa | undefined): IEmpresa | undefined =>
		src && 'company_name' in src ? src : undefined;

	const name = getVal(
		meta.name,
		asSub(source)?.name,
		asSub(source)?.subsidiary_name,
		asMain(source)?.company_name,
		asMain(source)?.legal_name,
		fallbackCompany.name,
	);
	const rut = getVal(
		meta.rut,
		asSub(source)?.rut,
		asSub(source)?.subsidiary_rut,
		asMain(source)?.company_rut,
		fallbackCompany.rut,
	);
	const activity = getVal(
		meta.activity,
		asSub(source)?.manager_name, // sin campo directo; usamos algo identificable
		asMain(source)?.business_activity,
		fallbackCompany.activity,
	);

	// Dirección: Intentar construirla completa
	let address = getVal(
		meta.address,
		asSub(source)?.address,
		asSub(source)?.subsidiary_address,
		asMain(source)?.company_address,
		fallbackCompany.address,
	);
	const commune = getVal(
		meta.commune,
		asSub(source)?.commune_name,
		asSub(source)?.subsidiary_address, // compatibilidad básica
		asMain(source)?.company_address,
	);
	if (commune && address && !address.includes(commune)) {
		address = `${address}, ${commune}`;
	}

	const email = getVal(
		meta.email,
		asSub(source)?.email,
		asSub(source)?.subsidiary_email,
		asMain(source)?.contact_email,
		fallbackCompany.email,
	);
	const phone = getVal(
		meta.phone,
		asSub(source)?.phone,
		asSub(source)?.subsidiary_phone,
		asMain(source)?.company_phone,
		fallbackCompany.phone,
	);
	const website = getVal(
		meta.website,
		asSub(source)?.website,
		asSub(source)?.subsidiary_website,
		asMain(source)?.company_website,
	);

	// Logo: Buscar en varios niveles de anidación típicos de Laravel/API
	const logoUrl = getVal(
		meta.logo_url,
		asSub(source)?.logo_url,
		(asSub(source) as any)?.logo?.url,
		(asSub(source) as any)?.logo,
		asMain(source)?.company_logo,
		(asMain(source) as any)?.logo?.url,
	);

	// Datos Bancarios (si alguna fuente los trae)
	const bankData =
		(meta.bank_info as any) ??
		(asSub(source) as any)?.bank_info ??
		(asMain(source) as any)?.bank_info;
	const bankInfo = Array.isArray(bankData) ? bankData.map(String) : bankData ? [String(bankData)] : [];

	return { name, rut, activity, address, commune, email, phone, website, logoUrl, bankInfo };
};


// --- 3. Componente Visual ---

const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
    const company = useQuoteIssuer(quote);
    
    // Datos del Cliente
    const customer = quote.customer as any || {};
    const customerName = customer.razon_social || customer.billing_company || customer.name || 'Cliente Mostrador';
    const customerRut = customer.rut || customer.tax_number || '—';
    const customerGiro = customer.business_activity || customer.giro || '—';
    const customerAddress = customer.billing_address || customer.address || '—';
    const customerContact = customer.contact_name || '—';
    const customerEmail = customer.email || '—';
    const customerPhone = customer.phone || customer.mobile_phone || '—';

    // Totales
    const items = quote.items ?? [];
    const totalNeto = parseNumber(quote.total_net ?? quote.subtotal ?? quote.totals?.total_net ?? 0);
    const descuento = parseNumber(quote.discount_amount ?? 0);
    const iva = parseNumber(quote.total_tax ?? quote.tax_amount ?? quote.totals?.tax_amount ?? 0);
    const totalFinal = parseNumber(quote.total_amount ?? quote.totals?.grand_total ?? 0);

    // Condiciones
    const formaPago = quote.payment_method || 'Transferencia / Contado';
    const validez = quote.expiry_date ? formatDate(quote.expiry_date) : '7 días';
    const entrega = (quote.metadata as any)?.delivery_terms || 'A convenir en local';

    return (
        <div className="bg-white p-8 mx-auto max-w-[216mm] text-xs font-sans text-gray-800 leading-tight">
            
            {/* --- HEADER: Logo & Datos Empresa vs Cuadro RUT --- */}
            <div className="flex justify-between items-start mb-6 gap-4">
                {/* IZQUIERDA: Datos de tu Empresa (Subsidiaria) */}
                <div className="w-3/5">
                    <div className="mb-3 h-16 flex items-center justify-start">
                        {company.logoUrl ? (
                            <img src={company.logoUrl} alt="Logo" className="h-full object-contain max-w-[180px]" />
                        ) : (
                            <h1 className="text-2xl font-extrabold uppercase text-gray-800 tracking-tighter">
                                {company.name}
                            </h1>
                        )}
                    </div>
                    <div className="space-y-0.5 text-[11px] text-gray-600">
                        <p className="font-bold text-gray-900 uppercase text-sm">{company.name}</p>
                        <p><span className="font-semibold">Giro:</span> {company.activity}</p>
                        <p><span className="font-semibold">Dirección:</span> {company.address}</p>
                        <p><span className="font-semibold">Email:</span> {company.email}</p>
                        <p><span className="font-semibold">Fono:</span> {company.phone}</p>
                        {company.website && <p><span className="font-semibold">Web:</span> {company.website}</p>}
                    </div>
                </div>

                {/* DERECHA: Cuadro RUT (Estilo SII Clásico) */}
                <div className="w-2/5 flex flex-col items-end">
                    <div className="border-[3px] border-red-600 w-full max-w-[260px] text-center py-3">
                        <h2 className="text-xl font-black text-red-600 tracking-wide">R.U.T.: {company.rut}</h2>
                        <div className="bg-red-50 py-1 my-1">
                            <h3 className="text-lg font-bold text-red-600 uppercase tracking-widest">Cotización</h3>
                        </div>
                        <h4 className="text-xl font-black text-red-600">N° {quote.id}</h4>
                    </div>
                    <div className="mt-2 text-right text-sm">
                        <p className="font-bold text-gray-700">Santiago, {formatDate(quote.quote_date)}</p>
                    </div>
                </div>
            </div>

            {/* --- CLIENTE: Franja de Datos --- */}
            <div className="border border-gray-300 rounded-sm p-3 mb-6 bg-gray-50/30 text-[11px]">
                <div className="grid grid-cols-[70px_1fr_40px_1fr] gap-y-1 gap-x-2 items-baseline">
                    <div className="font-bold text-gray-900">Señor(es):</div>
                    <div className="uppercase font-bold text-gray-800">{customerName}</div>
                    
                    <div className="font-bold text-gray-900 text-right">RUT:</div>
                    <div className="font-medium">{customerRut}</div>

                    <div className="font-bold text-gray-900">Giro:</div>
                    <div className="col-span-3 text-gray-700">{customerGiro}</div>

                    <div className="font-bold text-gray-900">Dirección:</div>
                    <div className="col-span-3 text-gray-700">{customerAddress}</div>

                    <div className="font-bold text-gray-900">Contacto:</div>
                    <div className="text-gray-700">{customerContact}</div>

                    <div className="font-bold text-gray-900 text-right">Fono:</div>
                    <div className="text-gray-700">{customerPhone}</div>
                    
                    <div className="font-bold text-gray-900">Correo:</div>
                    <div className="col-span-3 text-gray-700">{customerEmail}</div>
                </div>
            </div>

            {/* --- TABLA DE ÍTEMS --- */}
            <div className="mb-6 min-h-[300px]">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-gray-100 border-t border-b border-gray-300 text-gray-700 uppercase">
                            <th className="py-2 px-2 text-center w-12 font-bold border-l border-gray-300">Cant.</th>
                            <th className="py-2 px-2 text-left w-28 font-bold border-l border-gray-300">Código</th>
                            <th className="py-2 px-2 text-left font-bold border-l border-gray-300">Descripción</th>
                            <th className="py-2 px-2 text-right w-24 font-bold border-l border-gray-300">P. Unitario</th>
                            <th className="py-2 px-2 text-right w-24 font-bold border-l border-r border-gray-300">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-2 px-2 text-center align-top border-l border-gray-300 font-medium">
                                    {item.quantity}
                                </td>
                                <td className="py-2 px-2 text-left align-top border-l border-gray-300 text-gray-600">
                                    {item.customer_sku || item.product?.sku || '—'}
                                </td>
                                <td className="py-2 px-2 text-left align-top border-l border-gray-300">
                                    <p className="font-bold text-gray-800 text-xs">
                                        {item.customer_name || item.product?.name || 'Ítem sin nombre'}
                                    </p>
                                    {item.description && (
                                        <p className="text-[10px] text-gray-500 whitespace-pre-line mt-0.5">
                                            {item.description}
                                        </p>
                                    )}
                                    {/* Garantía integrada en descripción como subtítulo */}
                                    {(item.metadata as any)?.warranty && (
                                        <p className="text-[10px] text-blue-600 italic mt-1">
                                            Garantía: {(item.metadata as any).warranty}
                                        </p>
                                    )}
                                </td>
                                <td className="py-2 px-2 text-right align-top border-l border-gray-300 font-medium text-gray-700">
                                    {formatCurrency(item.unit_price)}
                                </td>
                                <td className="py-2 px-2 text-right align-top border-l border-r border-gray-300 font-bold text-gray-900">
                                    {formatCurrency(item.total_net || computeItemTotal(item))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- FOOTER: Condiciones y Totales --- */}
            <div className="flex gap-8 items-start">
                
                {/* Izquierda: Notas, Banco, Condiciones */}
                <div className="flex-1 space-y-5">
                    
                    {/* Condiciones Comerciales */}
                    <div className="border-l-2 border-gray-300 pl-3">
                        <h3 className="font-bold text-gray-900 uppercase text-[11px] mb-2">Condiciones Comerciales</h3>
                        <div className="text-[10px] space-y-1 text-gray-600">
                            <p><span className="font-semibold text-gray-800">Validez Oferta:</span> {validez}</p>
                            <p><span className="font-semibold text-gray-800">Forma de Pago:</span> {formaPago}</p>
                            <p><span className="font-semibold text-gray-800">Entrega:</span> {entrega}</p>
                        </div>
                    </div>

                    {/* Datos Bancarios y Notas */}
                    {(company.bankInfo.length > 0 || quote.notes) && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-[10px]">
                            {quote.notes && (
                                <div className="mb-3">
                                    <span className="font-bold block mb-1">Observaciones:</span>
                                    <p className="whitespace-pre-wrap text-gray-600">{quote.notes}</p>
                                </div>
                            )}
                            {company.bankInfo.length > 0 && (
                                <div>
                                    <span className="font-bold block mb-1">Datos Bancarios:</span>
                                    {company.bankInfo.map((info, i) => (
                                        <p key={i} className="text-gray-700 font-medium">{info}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Derecha: Totales Compactos */}
                <div className="w-64">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="py-2 pr-4 text-right text-gray-600 font-semibold border-b border-gray-200">Neto</td>
                                <td className="py-2 pl-4 text-right font-bold text-gray-800 border-b border-gray-200">
                                    {formatCurrency(totalNeto)}
                                </td>
                            </tr>
                            {descuento > 0 && (
                                <tr>
                                    <td className="py-2 pr-4 text-right text-red-500 font-semibold border-b border-gray-200">Descuento</td>
                                    <td className="py-2 pl-4 text-right font-bold text-red-500 border-b border-gray-200">
                                        - {formatCurrency(descuento)}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td className="py-2 pr-4 text-right text-gray-600 font-semibold border-b border-gray-200">I.V.A. (19%)</td>
                                <td className="py-2 pl-4 text-right font-bold text-gray-800 border-b border-gray-200">
                                    {formatCurrency(iva)}
                                </td>
                            </tr>
                            <tr className="text-base">
                                <td className="py-3 pr-4 text-right font-bold text-gray-900 bg-gray-100 rounded-l">Total</td>
                                <td className="py-3 pl-4 text-right font-extrabold text-gray-900 bg-gray-100 rounded-r">
                                    {formatCurrency(totalFinal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-400 uppercase tracking-wider">
                Documento generado electrónicamente por {company.name} - {new Date().getFullYear()}
            </div>
        </div>
    );
};

export default QuotePrintableView;
