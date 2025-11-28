import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { IQuote, IQuoteItem, ISubempresa } from '@/interface'; // Ajusta imports según tu estructura

interface QuotePrintableViewProps {
    quote: IQuote;
}

// --- 1. Helpers ---
const parseNumber = (val: any) => Number(val) || 0;
const formatCurrency = (val: any) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseNumber(val));
const formatDate = (val?: string) => val ? new Date(val).toLocaleDateString('es-CL') : '—';

// --- 2. Hook de Datos (Cerebro) ---
const useQuoteData = (quote: IQuote) => {
    // Selectores de Redux
    const subsidiaries = useSelector((state: RootState) => state.subEmpresa?.lista || []);
    const detail = useSelector((state: RootState) => state.subEmpresa?.detalle);
    const mainCompany = useSelector((state: RootState) => state.empresa?.miEmpresa);

    // Encontrar Subsidiaria Activa
    const activeSub = (detail && Number(detail.id) === Number(quote.subsidiary_id)
        ? detail
        : subsidiaries.find(s => Number(s.id) === Number(quote.subsidiary_id))) as ISubempresa | undefined;
    
    // Fallback manual (para que no falle si Redux no ha cargado)
    const fallbackName = mainCompany?.company_name || 'EcoTI';
    
    // Mapeo seguro usando tu estructura JSON nueva
    const data = {
        name: activeSub?.subsidiary_name || fallbackName,
        rut: activeSub?.subsidiary_rut || mainCompany?.company_rut || '',
        // Giro no venía en tu JSON de subsidiaria, usamos fallback
        activity: 'Venta de Equipos Computacionales', 
        
        // Composición de dirección: Calle + Comuna.name
        address: activeSub?.subsidiary_address 
            ? `${activeSub.subsidiary_address}${activeSub.commune?.name ? `, ${activeSub.commune.name}` : ''}`
            : (mainCompany?.company_address || ''),
            
        phone: activeSub?.subsidiary_phone || mainCompany?.company_phone || '',
        email: activeSub?.subsidiary_email || mainCompany?.contact_email || '',
        website: activeSub?.subsidiary_website || mainCompany?.company_website || '',
        // Logo
        logo: (activeSub as any)?.logo_url || (mainCompany as any)?.company_logo
    };

    return data;
};

// --- 3. Componente Visual ---
const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
    const company = useQuoteData(quote);
    const customer = quote.customer as any || {};
    const items = quote.items || [];

    // Totales
    const netTotal = items.reduce((acc, item) => acc + (parseNumber(item.quantity) * parseNumber(item.unit_price)), 0);
    const tax = parseNumber(quote.tax_amount || quote.total_tax);
    const total = parseNumber(quote.total_amount);

    return (
        <div className="bg-white p-3 min-h-[229mm] max-w-[201mm] mx-auto text-xs text-gray-800 font-sans shadow-lg">
            
            {/* HEADER */}
            <div className="flex justify-between items-start mb-8">
                {/* Lado Izquierdo: Info Empresa */}
                <div className="w-3/5">
                    <div className="mb-4">
                        {company.logo ? (
                            <img src={company.logo} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <h1 className="text-2xl font-bold uppercase text-gray-800">{company.name}</h1>
                        )}
                    </div>
                    <div className="text-[11px] leading-tight space-y-1 text-gray-600">
                        <p className="font-bold text-gray-900 uppercase text-sm">{company.name}</p>
                        <p><span className="font-semibold">Giro:</span> {company.activity}</p>
                        <p><span className="font-semibold">Dirección:</span> {company.address}</p>
                        <p><span className="font-semibold">Email:</span> {company.email}</p>
                        <p><span className="font-semibold">Fono:</span> {company.phone}</p>
                        {company.website && <p><span className="font-semibold">Web:</span> {company.website}</p>}
                    </div>
                </div>

                {/* Lado Derecho: Cuadro RUT (Estilo Formato) */}
                <div className="w-2/5 flex flex-col items-end">
                    <div className="border-2 border-red-600 w-64 text-center py-4">
                        <h2 className="text-lg font-black text-red-600 tracking-wide">R.U.T.: {company.rut}</h2>
                        <div className="bg-red-50 py-1 my-1">
                            <h3 className="text-base font-bold text-red-600 uppercase tracking-widest">COTIZACION</h3>
                        </div>
                        <h4 className="text-lg font-black text-red-600">N° {quote.id}</h4>
                    </div>
                    <p className="mt-2 text-right font-bold text-gray-800">Santiago, {formatDate(quote.quote_date)}</p>
                </div>
            </div>

            {/* INFO CLIENTE */}
            <div className="border border-gray-300 bg-gray-50 p-3 mb-6 rounded-sm">
                <div className="grid grid-cols-[60px_1fr_40px_1fr] gap-y-1 gap-x-2 items-baseline">
                    <div className="font-bold">Señor(es):</div>
                    <div className="uppercase font-bold">{customer.name || customer.razon_social}</div>
                    <div className="font-bold text-right">RUT:</div>
                    <div>{customer.rut}</div>

                    <div className="font-bold">Dirección:</div>
                    <div className="col-span-3">{customer.address}</div>

                    <div className="font-bold">Giro:</div>
                    <div className="col-span-3">{customer.giro}</div>

                    <div className="font-bold">Contacto:</div>
                    <div>{customer.contact_name}</div>
                    <div className="font-bold text-right">Fono:</div>
                    <div>{customer.phone}</div>
                </div>
            </div>

            {/* TABLA ITEMS */}
            <div className="mb-8">
                <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100 text-gray-900 uppercase text-[10px]">
                        <tr>
                            <th className="border border-gray-300 py-2 w-12">Cant.</th>
                            <th className="border border-gray-300 py-2 text-left px-2 w-24">Código</th>
                            <th className="border border-gray-300 py-2 text-left px-2">Descripción</th>
                            <th className="border border-gray-300 py-2 text-right px-2 w-24">Precio Neto</th>
                            <th className="border border-gray-300 py-2 text-right px-2 w-24">Total Neto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="border-l border-r border-gray-300 py-2 text-center align-top">{item.quantity}</td>
                                <td className="border-r border-gray-300 py-2 px-2 align-top text-gray-600">{item.product?.sku}</td>
                                <td className="border-r border-gray-300 py-2 px-2 align-top">
                                    <p className="font-bold">{item.product?.name}</p>
                                    {item.description && <p className="text-gray-500 text-[10px] mt-1 whitespace-pre-wrap">{item.description}</p>}
                                </td>
                                <td className="border-r border-gray-300 py-2 px-2 text-right align-top">{formatCurrency(item.unit_price)}</td>
                                <td className="border-r border-gray-300 py-2 px-2 text-right align-top font-bold">
                                    {formatCurrency(parseNumber(item.quantity) * parseNumber(item.unit_price))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FOOTER */}
            <div className="flex gap-8">
                <div className="flex-1 text-[10px] space-y-2">
                    <div className="border-l-2 border-gray-300 pl-2">
                        <h3 className="font-bold uppercase mb-1 underline">Condiciones Comerciales Generales</h3>
                        <p>Validez: 7 días</p>
                        <p>Forma de Pago: A convenir</p>
                        <p>Entrega: A convenir</p>
                    </div>
                    {quote.notes && (
                        <div className="bg-yellow-50 p-2 border border-yellow-100 rounded">
                            <span className="font-bold block">Observaciones:</span>
                            {quote.notes}
                        </div>
                    )}
                </div>

                <div className="w-64">
                    <table className="w-full text-right">
                        <tbody>
                            <tr>
                                <td className="font-bold text-gray-600 pr-4 py-1">Total Neto:</td>
                                <td className="font-bold text-gray-800">{formatCurrency(netTotal)}</td>
                            </tr>
                            <tr>
                                <td className="font-bold text-gray-600 pr-4 py-1">I.V.A. (19%):</td>
                                <td className="font-bold text-gray-800">{formatCurrency(tax)}</td>
                            </tr>
                            <tr className="text-sm">
                                <td className="font-black text-gray-900 pr-4 py-2 border-t border-gray-300">TOTAL:</td>
                                <td className="font-black text-gray-900 py-2 border-t border-gray-300">{formatCurrency(total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuotePrintableView;
