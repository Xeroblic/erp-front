/**
 * HELPER PARA MAPEO DE DATOS DE COTIZACIONES
 * 
 * Este archivo centraliza toda la lógica de obtención y mapeo de datos
 * para los documentos de cotización (PDF y vista imprimible).
 * 
 * PARA MODIFICAR LOS DATOS QUE SE MUESTRAN:
 * 1. Edita las funciones de mapeo abajo según tus necesidades
 * 2. Los comentarios indican qué campo se usa de cada fuente
 */

import type { IQuote, ISubempresa } from '@/interface';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';

/**
 * Obtiene la sucursal activa para una cotización
 * Prioridad:
 * 1. quote.subsidiary (si viene con la cotización)
 * 2. state.subEmpresa.detalle (si coincide con subsidiary_id)
 * 3. state.subEmpresa.lista (buscar por subsidiary_id)
 * 4. state.personalizacion.current_company.subsidiaries
 */
export const getActiveSubsidiary = (quote: IQuote, state: any): Partial<ISubempresa> | undefined => {
    // 1. Primero intentar obtener desde quote.subsidiary
    let activeSub = (quote as any)?.subsidiary as Partial<ISubempresa> | undefined;

    // 2. Si no viene, buscar en el detalle de sucursal
    if (!activeSub || !activeSub.id) {
        const detail = state.subEmpresa?.detalle;
        if (detail && Number(detail.id) === Number(quote.subsidiary_id)) {
            activeSub = detail;
        }
    }

    // 3. Buscar en la lista de sucursales
    if (!activeSub || !activeSub.id) {
        const subsidiaries = (state.subEmpresa?.lista || []) as ISubempresa[];
        activeSub = subsidiaries.find((s) => Number(s.id) === Number(quote.subsidiary_id));
    }

    // 4. Último recurso: current_company.subsidiaries
    if (!activeSub || !activeSub.id) {
        const currentCompanySubs = state.personalizacion?.current_company?.subsidiaries;
        if (Array.isArray(currentCompanySubs)) {
            activeSub = currentCompanySubs.find((sub: any) => Number(sub.id) === Number(quote.subsidiary_id));
        }
    }

    return activeSub;
};/**
 * Obtiene la información de la empresa/sucursal para mostrar en el documento
 * 
 * CAMPOS QUE SE PUEDEN MODIFICAR:
 * - name: Nombre de la empresa
 * - rut: RUT de la empresa
 * - activity: Giro o actividad comercial
 * - fullAddress: Dirección completa con comuna
 * - email: Email de contacto
 * - phone: Teléfono
 * - website: Sitio web
 * - logoUrl: URL o base64 del logo
 * - bankInfo: Array con información bancaria
 * - allowedPaymentMethods: Métodos de pago permitidos
 * - deliveryTerm: Términos de entrega
 * - quoteValidityText: Texto de validez de cotización
 * - quoteValidityDays: Días de validez
 * - commercialTerms: Términos comerciales adicionales
 */
export const getCompanyInfo = (quote: IQuote, state: any) => {
    const mainCompany = state.empresa?.miEmpresa;
    const activeSub = getActiveSubsidiary(quote, state);
    const meta = (quote as any)?.metadata?.company || {};

    // LOGO - Prioridad: metadata > subsidiary > mainCompany
    const logoRaw =
        meta.logo_base_64 ||
        meta.logo_url ||
        meta.logo ||
        (activeSub as any)?.logo_base_64 ||
        (activeSub as any)?.logo_url ||
        (mainCompany as any)?.company_logo;

    const logoUrl =
        logoRaw && String(logoRaw).startsWith('data:')
            ? logoRaw
            : ensureAbsoluteUrl(logoRaw || undefined) || logoRaw || null;

    // NOMBRE - Prioridad: metadata > subsidiary > mainCompany
    const name = meta.name || activeSub?.subsidiary_name || mainCompany?.company_name || 'EcoTI';

    // RUT - Prioridad: metadata > subsidiary > mainCompany
    const rut = meta.rut || activeSub?.subsidiary_rut || mainCompany?.company_rut || '—';

    // GIRO/ACTIVIDAD - Prioridad: metadata > subsidiary > mainCompany
    const activity =
        meta.activity ||
        activeSub?.subsidiary_giro ||
        mainCompany?.business_activity ||
        'Venta de artículos computacionales';    // DIRECCIÓN - Construir dirección completa con comuna
    const addressBase =
        meta.address ||
        (activeSub as any)?.subsidiary_address ||
        mainCompany?.company_address ||
        '';
    const communeName =
        meta.commune ||
        (activeSub as any)?.commune?.name ||
        (activeSub as any)?.commune_name ||
        '';
    const fullAddress =
        communeName && addressBase && !addressBase.includes(communeName)
            ? `${addressBase}, ${communeName}`
            : addressBase || communeName;

    // CONTACTO
    const email = meta.email || activeSub?.subsidiary_email || mainCompany?.contact_email || '';
    const phone = meta.phone || activeSub?.subsidiary_phone || mainCompany?.company_phone || '';
    const website = meta.website || activeSub?.subsidiary_website || mainCompany?.company_website || '';

    // DATOS BANCARIOS - Convertir a array si es necesario
    const bankData =
        (meta.bank_info as any) ?? (activeSub as any)?.bank_info ?? (mainCompany as any)?.bank_info;
    const bankInfo = Array.isArray(bankData)
        ? bankData.map(String)
        : bankData
            ? [String(bankData)]
            : [];
    const extraBank = meta.bank_details || (activeSub as any)?.subsidiary_bank_details;
    if (extraBank) bankInfo.push(String(extraBank));

    // TÉRMINOS COMERCIALES
    const allowedPaymentMethods =
        meta.allowed_payment_methods ||
        (activeSub as any)?.subsidiary_allowed_payment_methods ||
        meta.payment_methods ||
        [];
    const deliveryTerm = meta.delivery_term || (activeSub as any)?.subsidiary_delivery_term;
    const quoteValidityText =
        meta.quote_validity_text || (activeSub as any)?.subsidiary_quote_validity_text || '';
    const quoteValidityDays =
        meta.quote_validity_days || (activeSub as any)?.subsidiary_quote_validity_days || null;
    const commercialTerms =
        meta.commercial_terms || (activeSub as any)?.subsidiary_commercial_terms || '';

    return {
        name,
        rut,
        activity,
        fullAddress,
        email,
        phone,
        website,
        logoUrl,
        bankInfo,
        allowedPaymentMethods,
        deliveryTerm,
        quoteValidityText,
        quoteValidityDays,
        commercialTerms,
    };
};

/**
 * Mapea los datos del cliente desde la estructura de la API
 * 
 * CAMPOS DISPONIBLES EN customer:
 * - name / razon_social: Nombre o razón social
 * - rut: RUT del cliente
 * - direccion / address: Dirección
 * - giro: Giro comercial
 * - contact_name / contacto: Nombre de contacto
 * - telefono / phone: Teléfono
 * - email: Email
 * - comuna: Comuna
 */
export const getCustomerInfo = (customer: any) => {
    return {
        name: customer?.razon_social || customer?.name || 'Cliente General',
        rut: customer?.rut || '—',
        address: customer?.direccion || customer?.address || '—',
        giro: customer?.giro || '—',
        contactName: customer?.contact_name || customer?.contacto || '—',
        phone: customer?.telefono || customer?.phone || '—',
        email: customer?.email || '—',
        comuna: customer?.comuna || '',
    };
};/**
 * Resuelve el precio unitario de un item
 * Campo del API: unit_price
 */
export const resolveUnitPrice = (item: any): number => {
    return Number(item.unit_price ?? 0);
};

/**
 * Resuelve el total de línea de un item
 * Campo del API: subtotal
 */
export const resolveLineTotal = (item: any): number => {
    return Number(item.subtotal ?? 0);
};

/**
 * Obtiene el SKU del producto
 * Campo del API: customer_sku
 */
export const getProductSku = (item: any): string => {
    return item?.customer_sku || '—';
};

/**
 * Obtiene el nombre del producto
 * Campo del API: name
 */
export const getProductName = (item: any): string => {
    return item?.name || 'Producto sin nombre';
};

/**
 * Obtiene los detalles del producto (descripción adicional)
 * Campo del API: product_detail
 */
export const getProductDetail = (item: any): string | null => {
    return item?.product_detail || null;
};

/**
 * Formatea un valor numérico como moneda chilena
 */
export const formatCurrency = (val: unknown): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(Number(val) || 0);
};

/**
 * Formatea una fecha en formato chileno
 */
export const formatDate = (val?: string | null): string => {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('es-CL');
};

/**
 * Genera el label de métodos de pago permitidos
 */
export const getPaymentMethodsLabel = (allowedPaymentMethods: string[]): string => {
    if (Array.isArray(allowedPaymentMethods) && allowedPaymentMethods.length > 0) {
        return allowedPaymentMethods.join(' / ');
    }
    return 'Contado / Transferencia / WebPay';
};
