/**
 * HELPER PARA MAPEO DE DATOS DE COTIZACIONES
 * 
 * Este archivo centraliza toda la lógica de obtención y mapeo de datos
 * para los documentos de cotización (PDF y vista imprimible).
 */

import type { IQuote, ISubempresa, IEmpresa } from '@/interface';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

/**
 * Obtiene la sucursal activa para una cotización
 * Prioridad:
 * 1. quote.subsidiary (si viene hidratado en el objeto quote)
 * 2. Buscar en state.subEmpresa.lista usando quote.subsidiary_id
 * 3. Buscar en state.personalizacion.current_company.subsidiaries
 */
export const getActiveSubsidiary = (quote: IQuote, state: any): Partial<ISubempresa> | undefined => {
    // 1. Intentar obtener desde quote.subsidiary (si existe)
    const quoteSub = (quote as any)?.subsidiary;
    if (quoteSub && typeof quoteSub === 'object') {
        return quoteSub;
    }

    const subId = Number(quote.subsidiary_id);
    if (!subId) return undefined;

    // 2. Buscar en el detalle de sucursal (si está cargado y coincide)
    const detail = state.subEmpresa?.detalle;
    if (detail && Number(detail.id) === subId) {
        return detail;
    }

    // 3. Buscar en la lista global de sucursales del estado
    const subsidiariesList = (state.subEmpresa?.lista || []) as ISubempresa[];
    const foundInList = subsidiariesList.find((s) => Number(s.id) === subId);
    if (foundInList) return foundInList;

    // 4. Buscar en current_company (si aplica)
    const currentCompanySubs = state.personalizacion?.current_company?.subsidiaries;
    if (Array.isArray(currentCompanySubs)) {
        return currentCompanySubs.find((sub: any) => Number(sub.id) === subId);
    }

    return undefined;
};

/**
 * Obtiene la información de la empresa/sucursal para mostrar en el documento
 */
export const getCompanyInfo = (quote: IQuote, state: any) => {
    // ELIMINADO: const mainCompany = state.empresa?.miEmpresa as IEmpresa | undefined;
    // El usuario indica que NO se deben usar datos de la empresa principal, solo subsidiarias.

    const activeSub = getActiveSubsidiary(quote, state);

    // Metadata específica de la cotización (si existe)
    const meta = (quote as any)?.metadata?.company || {};

    // Helper para obtener valor con prioridad: Metadata > Sucursal
    // Se eliminó el fallback a mainCompany
    const getVal = (metaKey: string, subKey: keyof ISubempresa, fallback: any = '') => {
        return meta[metaKey] || (activeSub as any)?.[subKey] || fallback;
    };

    // LOGO
    const logoRaw =
        meta.logo_base_64 ||
        meta.logo_url ||
        activeSub?.logo_url;

    const logoUrl = logoRaw && String(logoRaw).startsWith('data:')
        ? logoRaw
        : ensureAbsoluteUrl(logoRaw || undefined) || logoRaw || null;

    // DATOS BANCARIOS
    const bankData = (meta.bank_info as any) ?? (activeSub as any)?.bank_info;
    const bankInfo = Array.isArray(bankData)
        ? bankData.map(String)
        : bankData
            ? [String(bankData)]
            : [];

    // Agregar detalle bancario extra si existe
    const extraBank = meta.bank_details || activeSub?.subsidiary_bank_details;
    if (extraBank) bankInfo.push(String(extraBank));

    // TÉRMINOS COMERCIALES
    const allowedPaymentMethods =
        meta.allowed_payment_methods ||
        activeSub?.subsidiary_allowed_payment_methods ||
        meta.payment_methods ||
        [];

    return {
        name: getVal('name', 'subsidiary_name', ''),
        rut: getVal('rut', 'subsidiary_rut', '—'),
        activity: getVal('activity', 'subsidiary_giro', ''),

        // Dirección compuesta
        fullAddress: (() => {
            const addr = getVal('address', 'subsidiary_address', '');
            const comm = meta.commune || activeSub?.commune?.name || activeSub?.commune_name || '';
            if (comm && addr && !addr.includes(comm)) return `${addr}, ${comm}`;
            return addr || comm || '—';
        })(),

        email: getVal('email', 'subsidiary_email', '—'),
        phone: getVal('phone', 'subsidiary_phone', '—'),
        website: getVal('website', 'subsidiary_website', ''),

        logoUrl,
        bankInfo,
        allowedPaymentMethods,

        deliveryTerm: meta.delivery_term || activeSub?.subsidiary_delivery_term || 'A convenir o retiro en tienda.',
        quoteValidityText: meta.quote_validity_text || activeSub?.subsidiary_quote_validity_text || '',
        quoteValidityDays: meta.quote_validity_days || activeSub?.subsidiary_quote_validity_days || null,
        commercialTerms: meta.commercial_terms || activeSub?.subsidiary_commercial_terms || '',
    };
};

/**
 * Mapea los datos del cliente
 */
export const getCustomerInfo = (customer: any) => {
    if (!customer) return {
        name: 'Cliente General',
        rut: '—',
        address: '—',
        giro: '—',
        contactName: '—',
        phone: '—',
        email: '—',
        comuna: ''
    };

    return {
        name: customer.razon_social || customer.name || 'Cliente General',
        rut: customer.rut || '—',
        address: customer.direccion || customer.address || '—',
        giro: customer.giro || '—',
        contactName: customer.contact_name || customer.contacto || '—',
        phone: customer.telefono || customer.phone || '—',
        email: customer.email || '—',
        comuna: customer.comuna || '',
    };
};

export const resolveUnitPrice = (item: any): number => Number(item.unit_price ?? 0);
export const resolveLineTotal = (item: any): number => Number(item.subtotal ?? 0);
export const getProductSku = (item: any): string => item?.product?.sku || '—';
export const getProductName = (item: any): string => item?.product?.name || 'Producto sin nombre';
export const getProductDetail = (item: any): string | null => item?.product_detail || null;

export const formatCurrency = (val: unknown): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(Number(val) || 0);
};

export const formatDate = (val?: string | null): string => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('es-CL');
};

export const getPaymentMethodsLabel = (allowedPaymentMethods: string[]): string => {
    if (Array.isArray(allowedPaymentMethods) && allowedPaymentMethods.length > 0) {
        return allowedPaymentMethods.join(' / ');
    }
    return 'Contado / Transferencia / WebPay';
};
