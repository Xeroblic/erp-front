import { deleteItem } from "@/store/slices/technicalReviews";
import { toast } from "react-toastify";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import JsBarcode from 'jsbarcode';
import { resolveEquipmentTypeMeta } from '../../utils/utilsItems';
import { IItem } from '@/interface/technicalReviews.interface';

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
    notebook: 'Notebook',
    desktop: 'Desktop',
    aio: 'All-in-One',
    docking: 'Docking',
    monitor: 'Monitor',
};

// ─── Traducción de valores de condición ───────────────────────────────────
// Extraídos de las reglas de validación del backend por tipo de equipo
const CONDITION_VALUES_ES: Record<string, string> = {
    // ── Condición general ──
    like_new: 'Como Nuevo',
    good_condition: 'Buen Estado',
    good_shape: 'Buen Estado',
    visible_wear: 'Desgaste Visible',
    noticeable_wear: 'Desgaste Notable',
    needs_repair: 'Requiere Reparación',
    scrap: 'Solo Repuestos',
    ok: 'Buen Estado',
    minor_wear: 'Detalles Leves',
    worn: 'Desgastado',
    missing_pieces: 'Piezas Faltantes',
    scratched: 'Rayado',
    broken: 'Roto',
    damaged: 'Dañado',

    // ── Pantalla ──
    dead_pixels: 'Píxeles Muertos',
    screen_burn: 'Quemadura de Pantalla',
    flickering: 'Parpadeo',
    spots: 'Manchas',

    // ── Cargador / energía ──
    buen_estado: 'Buen Estado',
    cable_en_mal_estado: 'Cable en Mal Estado',
    damaged_cable: 'Cable en Mal Estado',
    no_corresponde_a_equipo: 'No Corresponde al Equipo',
    not_matching_equipment: 'No Corresponde al Equipo',
    no_incluye: 'No Incluye',
    not_included: 'No Incluye',
    broken_charger: 'Cargador Roto',
    broken_port: 'Entrada Rota',
    broken_ports: 'Puertos Rotos',

    // ── Carcasa ──
    light_scratches: 'Rayas Leves',
    no_stand: 'Sin Base',

    // ── Batería ──
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Aceptable',
    poor: 'Pobre',
    no_battery: 'Sin Batería',

    // ── Tecnología almacenamiento ──
    hdd: 'HDD',
    ssd: 'SSD',
    m2: 'M.2',
    nvme: 'NVMe',
    hybrid: 'Híbrido',

    // ── Layout teclado ──
    es: 'ES',
    us: 'US',
    latam: 'Latinoamericano',
    spanish: 'ES',
    english: 'US',
    latin_american: 'ES',
    international: 'US',

    // ── Estados funcionales ──
    working: 'Funcionando',
    not_working: 'No Funciona',
    partially_working: 'Funciona Parcialmente',
    functional: 'Funcional',
    non_functional: 'No Funcional',
    original: 'Original',
    generic: 'Genérico',
    missing: 'Faltante',

    // ── Estados de review ──
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    reviewed: 'Revisado',
    completed: 'Completado',
    approved: 'Aprobado',
    rejected: 'Rechazado',

    // ── Estados comerciales ──
    received: 'Ingresado',
    available_for_sale: 'Disponible para Venta',
    in_quotation: 'En Cotización',
    reserved: 'Reservado',
    sold: 'Vendido',
    in_repair: 'En Reparación',
    scrapped: 'Dado de Baja',
    returned: 'Devuelto',

    // ── Grados ──
    a: 'A',
    b: 'B',
    c: 'C',
    m: 'M',

    // ── Booleanos y genéricos ──
    yes: 'SI',
    no: 'NO',
    na: 'N/A',
    none: 'Ninguno',
    unknown: 'Desconocido',
    new: 'Nuevo',
    used: 'Usado',
    refurbished: 'Reacondicionado',

    // ── Otros (se irán agregando con cada tipo de equipo) ──
    scratches: 'Rayones',
    dents: 'Abolladuras',
    cracks: 'Grietas',
};

// ─── Definición de columnas por tipo de equipo ────────────────────────────
// Cada columna tiene: header (nombre visible en Excel) y key (campo en details/extra_attributes)
// Claves especiales con prefijo "__" se resuelven desde el item directamente

type ExcelColDef = { header: string; key: string };

const EXCEL_COLUMNS: Record<string, ExcelColDef[]> = {
    notebook: [
        { header: 'Marca',             key: 'brand' },
        { header: 'Modelo',            key: 'model' },
        { header: 'Linea',             key: 'line' },
        { header: 'Serial Number',     key: '__serial' },
        { header: 'Procesador',        key: 'processor' },
        { header: 'RAM',               key: 'ram_size' },
        { header: 'Slot Ram',          key: 'ram_slots' },
        { header: 'Tipo RAM',          key: 'ram_type' },
        { header: 'HDD',               key: 'storage_size' },
        { header: 'Tec. HDD',          key: 'storage_technology' },
        { header: 'Incluye',           key: 'includes_charger' },
        { header: 'Estado',            key: 'charger_status' },
        { header: 'VGA',               key: 'vga_ports' },
        { header: 'HDMI',              key: 'hdmi_ports' },
        { header: 'Displayport',       key: 'displayport_ports' },
        { header: 'USB',               key: 'usb_a_ports' },
        { header: 'USB Tipo C',        key: 'usb_c_ports' },
        { header: 'Biometrico',        key: 'has_biometric' },
        { header: 'SD',                key: 'sd_readers' },
        { header: 'WiFi',              key: 'has_wifi' },
        { header: 'RJ-45',             key: 'rj45_ports' },
        { header: 'Bluetooth',         key: 'has_bluetooth' },
        { header: 'Pulgadas Pant.',    key: 'screen_inches' },
        { header: 'Estado Pantalla',   key: 'screen_condition' },
        { header: 'Tactil',            key: 'is_touchscreen' },
        { header: 'Estado Teclado',    key: 'keyboard_condition' },
        { header: 'ES/US',             key: 'keyboard_layout' },
        { header: 'Numerico',          key: 'has_numeric_keypad' },
        { header: 'Retroluminado',     key: 'has_backlit_keyboard' },
        { header: 'Estado Padmouse',   key: 'touchpad_condition' },
        { header: 'Estado Cubierta',   key: 'cover_condition' },
        { header: 'Estado Bisagras',   key: 'hinge_condition' },
        { header: 'Estado Inferior',   key: 'bottom_condition' },
        { header: 'Estado Bateria',    key: 'battery_status' },
        { header: 'Observaciones',     key: 'observations' },
        { header: 'CATEGORIA',         key: '__grade' },
        { header: 'S.O',               key: 'operating_system' },
        { header: 'CLIENTE',           key: '__customer' },
        { header: 'PROVEEDOR',         key: '__supplier' },
        // { header: 'Codigo de Barras',  key: '__barcode' },
        { header: 'Creado por',        key: '__created_by' },
        { header: 'Revisado por',      key: '__reviewed_by' },
    ],
    aio: [
        { header: 'Marca',             key: 'brand' },
        { header: 'Modelo',            key: 'model' },
        { header: 'Linea',             key: 'line' },
        { header: 'Serial Number',     key: '__serial' },
        { header: 'Procesador',        key: 'processor' },
        { header: 'RAM',               key: 'ram_size' },
        { header: 'Slot Ram',          key: 'ram_slots' },
        { header: 'Tipo RAM',          key: 'ram_type' },
        { header: 'HDD',               key: 'storage_size' },
        { header: 'Tec. HDD',          key: 'storage_technology' },
        { header: 'Incluye',           key: 'includes_charger' },
        { header: 'Estado',            key: 'charger_status' },
        { header: 'VGA',               key: 'vga_ports' },
        { header: 'HDMI',              key: 'hdmi_ports' },
        { header: 'Displayport',       key: 'displayport_ports' },
        { header: 'USB',               key: 'usb_a_ports' },
        { header: 'USB Tipo C',        key: 'usb_c_ports' },
        { header: 'SD',                key: 'sd_readers' },
        { header: 'WiFi',              key: 'has_wifi' },
        { header: 'RJ-45',             key: 'rj45_ports' },
        { header: 'Bluetooth',         key: 'has_bluetooth' },
        { header: 'Pulgadas Pant.',    key: 'screen_inches' },
        { header: 'Estado Pantalla',   key: 'screen_condition' },
        { header: 'Estado Cubierta',   key: 'cover_condition' },
        { header: 'Lector CD',         key: 'has_cd_drive' },
        { header: 'S.O',               key: 'operating_system' },
        { header: 'Observaciones',     key: 'observations' },
        { header: 'Cliente',           key: '__customer' },
        { header: 'Proveedor',         key: '__supplier' },
        // { header: 'Codigo de Barras',  key: '__barcode' },
        { header: 'CATEGORIA',         key: '__grade' },
        { header: 'Creado por',        key: '__created_by' },
        { header: 'Revisado por',      key: '__reviewed_by' },
    ],
    desktop: [
        { header: 'Marca',             key: 'brand' },
        { header: 'Modelo',            key: 'model' },
        { header: 'Linea',             key: 'line' },
        { header: 'Serial Number',     key: '__serial' },
        { header: 'Procesador',        key: 'processor' },
        { header: 'RAM',               key: 'ram_size' },
        { header: 'Slot Ram',          key: 'ram_slots' },
        { header: 'Tipo RAM',          key: 'ram_type' },
        { header: 'HDD',               key: 'storage_size' },
        { header: 'Tec. HDD',          key: 'storage_technology' },
        { header: 'VGA',               key: 'vga_ports' },
        { header: 'HDMI',              key: 'hdmi_ports' },
        { header: 'Displayport',       key: 'displayport_ports' },
        { header: 'USB',               key: 'usb_a_ports' },
        { header: 'USB Tipo C',        key: 'usb_c_ports' },
        { header: 'SD',                key: 'sd_readers' },
        { header: 'RJ-45',             key: 'rj45_ports' },
        { header: 'WiFi',              key: 'has_wifi' },
        { header: 'Bluetooth',         key: 'has_bluetooth' },
        { header: 'CD',                key: 'has_cd_drive' },
        { header: 'Incluye',           key: 'includes_charger' },
        { header: 'Estado',            key: 'charger_status' },
        { header: 'S.O',               key: 'operating_system' },
        { header: 'CATEGORIA',         key: '__grade' },
        { header: 'Observaciones',     key: 'observations' },
        { header: 'Cliente',           key: '__customer' },
        { header: 'Proveedor',         key: '__supplier' },
        // { header: 'Codigo de Barras',  key: '__barcode' },
        { header: 'Creado por',        key: '__created_by' },
        { header: 'Revisado por',      key: '__reviewed_by' },
    ],
    docking: [
        { header: 'Marca',             key: 'brand' },
        { header: 'Modelo',            key: 'model' },
        { header: 'Serial Number',     key: '__serial' },
        { header: 'Incluye',           key: 'includes_charger' },
        { header: 'Estado',            key: 'charger_status' },
        { header: 'HDMI',              key: 'hdmi_ports' },
        { header: 'Displayport',       key: 'displayport_ports' },
        { header: 'USB',               key: 'usb_a_ports' },
        { header: 'RJ-45',             key: 'rj45_ports' },
        { header: 'USB Tipo C',        key: 'usb_c_ports' },
        { header: 'Creado por',        key: '__created_by' },
        { header: 'Revisado por',      key: '__reviewed_by' },
    ],
    monitor: [
        { header: 'Marca',             key: 'brand' },
        { header: 'Modelo',            key: 'model' },
        { header: 'Serial Number',     key: '__serial' },
        { header: 'Pulgadas Pant.',    key: 'screen_inches' },
        { header: 'Estado Pantalla',   key: 'screen_condition' },
        { header: 'Alimentación',      key: 'includes_power_cable' },
        { header: 'Estado del Cable',  key: 'power_cable_status' },
        { header: 'Observaciones',     key: 'observations' },
        { header: 'Cliente',           key: '__customer' },
        { header: 'Proveedor',         key: '__supplier' },
        // { header: 'Codigo de Barras',  key: '__barcode' },
        { header: 'Creado por',        key: '__created_by' },
        { header: 'Revisado por',      key: '__reviewed_by' },
    ],
};

// ─── Definición de grupos de columnas (header agrupado superior) ──────────
type ExcelGroupDef = { label: string; color: string; span: number };

const EXCEL_GROUPS: Record<string, ExcelGroupDef[]> = {
    notebook: [
        { label: 'Nº',                            color: '305496', span: 1 },
        { label: 'Identificación',                color: '4472C4', span: 4 },
        { label: 'Hardware',                       color: '548235', span: 6 },
        { label: 'Cargador',                       color: 'BF8F00', span: 2 },
        { label: 'Puertos',                        color: '7030A0', span: 10 },
        { label: 'Pantalla',                       color: 'C65911', span: 3 },
        { label: 'Teclado',                        color: '00B050', span: 4 },
        { label: 'Padmouse',                       color: 'FF6600', span: 1 },
        { label: 'Carcasa - Bisagras - Otros',     color: '4BACC6', span: 3 },
        { label: 'Batería',                        color: 'FF4444', span: 1 },
        { label: 'Notas',                          color: '808080', span: 1 },
        { label: 'Clasificación',                  color: 'C00000', span: 5 },
    ],
    aio: [
        { label: 'Nº',                            color: '305496', span: 1 },
        { label: 'Identificación',                color: '4472C4', span: 4 },
        { label: 'Hardware',                       color: '548235', span: 6 },
        { label: 'Cargador',                       color: 'BF8F00', span: 2 },
        { label: 'Puertos',                        color: '7030A0', span: 9 },
        { label: 'Pantalla',                       color: 'C65911', span: 2 },
        { label: 'Carcasa - Otros',                color: '4BACC6', span: 2 },
        { label: 'Software / Notas',               color: '808080', span: 2 },
        { label: 'Clasificación',                  color: 'C00000', span: 4 },
    ],
    desktop: [
        { label: 'Nº',                            color: '305496', span: 1 },
        { label: 'Identificación',                color: '4472C4', span: 4 },
        { label: 'Hardware',                       color: '548235', span: 6 },
        { label: 'Puertos',                        color: '7030A0', span: 9 },
        { label: 'Otros',                          color: '4BACC6', span: 1 },
        { label: 'Cargador',                       color: 'BF8F00', span: 2 },
        { label: 'Software',                       color: '808080', span: 1 },
        { label: 'Clasificación',                  color: 'C00000', span: 5 },
    ],
    docking: [
        { label: 'Nº',                            color: '305496', span: 1 },
        { label: 'Identificación',                color: '4472C4', span: 3 },
        { label: 'Cargador',                       color: 'BF8F00', span: 2 },
        { label: 'Puertos',                        color: '7030A0', span: 5 },
    ],
    monitor: [
        { label: 'Nº',                            color: '305496', span: 1 },
        { label: 'Identificación',                color: '4472C4', span: 3 },
        { label: 'Pantalla',                       color: 'C65911', span: 2 },
        { label: 'Cable',                          color: 'BF8F00', span: 2 },
        { label: 'Notas',                          color: '808080', span: 1 },
        { label: 'Clasificación',                  color: 'C00000', span: 3 },
    ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const generateBarcodeBase64 = (text: string): string | null => {
    try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, text, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 2,
        });
        return canvas.toDataURL('image/png').split(',')[1];
    } catch {
        return null;
    }
};

export const handleDelete = async (itemId: number, branchId: number, dispatch: any, setIsDeleting: any, setDeleteModalOpen: any, setItemToDelete: any, onPageChange: any, meta: any) => {
    if (!branchId) {
        toast.error('No hay sucursal activa para eliminar la revisión');
        return;
    }
    try {
        setIsDeleting(true);
        await dispatch(deleteItem({ branchId, itemId })).unwrap();
        toast.success('Revisión eliminada');
        onPageChange?.(meta.current_page);
    } catch (err: any) {
        toast.error(err?.message || 'No se pudo eliminar la revisión');
    } finally {
        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
    }
};


export const formatAttributeLabel = (key: string) => {
    if (!key) return 'Atributo';
    return key
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
};


export const normalizeDetailValue = (value: any): string => {
    if (value === null || typeof value === 'undefined') return '';
    if (typeof value === 'boolean') return value ? 'SI' : 'NO';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (CONDITION_VALUES_ES[normalized]) {
            return CONDITION_VALUES_ES[normalized];
        }
        return value
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim();
    }
    if (typeof value === 'object') {
        if ('label' in value) return String(value.label);
        return JSON.stringify(value);
    }
    return String(value);
};

const resolveColumnValue = (item: IItem, key: string): string => {
    switch (key) {
        case '__serial':
            return item.serial_number ?? '';
        case '__grade': {
            const g = item.grade;
            if (g && typeof g === 'object' && 'label' in (g as any)) return (g as any).label;
            return normalizeDetailValue(g);
        }
        case '__customer':
            return (item as any).customer_supplier?.name ?? '';
        case '__supplier':
            return (item as any).customer_supplier?.name ?? '';
        case '__barcode':
            return item.serial_number ? `*${item.serial_number}*` : '';
        case '__created_by':
            return (item as any).created_by?.name ?? '';
        case '__reviewed_by':
            return (item as any).reviewed_by?.name ?? '';
        default:
            break;
    }

    const detailSource: Record<string, any> = {
        ...(item.details || {}),
        ...(item.extra_attributes || {}),
    };
    return normalizeDetailValue(detailSource[key]);
};


export const applyHeader = (
    sheet: ExcelJS.Worksheet,
    headers: string[],
    sheetTitle: string,
    groups?: ExcelGroupDef[],
    logoImageId?: number,
    batchDate?: string,
    reviewDate?: string,
    customerName?: string,
    revisionName?: string,
) => {
    if (logoImageId !== undefined) {
        sheet.addImage(logoImageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 200, height: 90 },
        });
    }
    const logoRow = sheet.addRow([]);
    logoRow.height = 60;
    const titleRow = sheet.addRow([sheetTitle]);
    titleRow.font = { bold: true, size: 16, color: { argb: '1F4E78' } };
    titleRow.alignment = { horizontal: 'center' };
    const maxMerge = Math.min(headers.length, 4);
    const finalMerge = Math.max(maxMerge, 4);
    sheet.mergeCells(3, 1, 3, finalMerge);
    sheet.mergeCells(2, 1, 2, 2);
    if (customerName) {
        const clientCell = sheet.getCell('G2');
        clientCell.value = `Cliente: ${customerName}`;
        clientCell.font = { name: 'Arial', size: 10, bold: true };
        clientCell.alignment = { horizontal: 'left', vertical: 'middle' };
    }

    sheet.mergeCells(2, 3, 2, 6);
    const revisionNameCell = sheet.getCell('C2');
    const revisionLabel = revisionName || (sheetTitle.includes('Revisión') ? sheetTitle.split('-')[0].trim() : sheetTitle);
    revisionNameCell.value = revisionLabel; 
    revisionNameCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1F4E78' } };
    revisionNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
    const today = new Date();
    const receptionDate = batchDate ? new Date(batchDate + 'T00:00:00') : today;
    const finalReviewDate = reviewDate ? new Date(reviewDate + 'T00:00:00') : today;

    const dateLabelStyle = { font: { name: 'Arial', size: 10, bold: true }, alignment: { horizontal: 'left' } };
    const dateValueStyle = { font: { name: 'Arial', size: 10, bold: false }, alignment: { horizontal: 'left' }, numFmt: 'dd-mm-yyyy' };

    const cellI2 = sheet.getCell('I2');
    cellI2.value = 'Fecha Recepción:';
    cellI2.font = dateLabelStyle.font;
    cellI2.alignment = dateLabelStyle.alignment as any;

    const cellJ2 = sheet.getCell('J2');
    cellJ2.value = receptionDate;
    cellJ2.font = dateValueStyle.font;
    cellJ2.alignment = dateValueStyle.alignment as any;
    cellJ2.numFmt = dateValueStyle.numFmt;

    const cellI3 = sheet.getCell('I3');
    cellI3.value = 'Fecha Revisión:';
    cellI3.font = dateLabelStyle.font;
    cellI3.alignment = dateLabelStyle.alignment as any;

    const cellJ3 = sheet.getCell('J3');
    cellJ3.value = finalReviewDate;
    cellJ3.font = dateValueStyle.font;
    cellJ3.alignment = dateValueStyle.alignment as any;
    cellJ3.numFmt = dateValueStyle.numFmt;


    sheet.addRow([]);

    if (groups && groups.length > 0) {
        const groupRowNum = sheet.rowCount + 1;
        const groupRow = sheet.addRow([]);
        groupRow.height = 20;

        let colOffset = 1;
        groups.forEach((g) => {
            const startCol = colOffset;
            const endCol = colOffset + g.span - 1;

            const cell = sheet.getCell(groupRowNum, startCol);
            cell.value = g.label;
            cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: g.color },
            };

            if (g.span > 1) {
                sheet.mergeCells(groupRowNum, startCol, groupRowNum, endCol);
            }
            for (let c = startCol; c <= endCol; c++) {
                const gc = sheet.getCell(groupRowNum, c);
                gc.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: g.color },
                };
            }

            colOffset = endCol + 1;
        });
    }

    const headerRow = sheet.addRow(headers);
    headerRow.height = 18;
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '305496' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
};

export const setColumnWidths = (sheet: ExcelJS.Worksheet, headers: string[]) => {
    headers.forEach((header, index) => {
        const column = sheet.getColumn(index + 1);
        let maxLength = header.length + 3;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value;
            const len =
                cellValue == null
                    ? 0
                    : typeof cellValue === 'string'
                        ? cellValue.length
                        : cellValue.toString().length;
            if (len + 2 > maxLength) maxLength = len + 2;
        });
        column.width = Math.min(maxLength, 30);
    });
};

export const exportItemsToExcel = async (
    items: IItem[],
    exportMode: 'serials' | 'details',
    exportFileName: string,
    onExportFetchAll?: (includeDetails?: boolean) => Promise<IItem[]>,
    batchDate?: string,
    customerName?: string,
) => {
    if (!items.length) {
        toast.info('No hay datos para exportar');
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        let logoImageId: number | undefined;
        try {
            const logoResp = await fetch('/logo-ecopc.png');
            if (logoResp.ok) {
                const logoBuffer = await logoResp.arrayBuffer();
                logoImageId = workbook.addImage({
                    buffer: logoBuffer,
                    extension: 'png',
                });
            }
        } catch (error) {
            console.warn('No se pudo cargar el logo para el Excel', error);
        }

        const sourceItems = onExportFetchAll
            ? await onExportFetchAll(exportMode === 'details')
            : items;
        if (!sourceItems.length) {
            toast.info('No hay datos para exportar con los filtros actuales');
            return;
        }

        if (exportMode === 'serials') {
            const sheet = workbook.addWorksheet('Series');
            const headers = ['N°', 'Serie'];
            const dates = sourceItems
                .map(i => i.reviewed_at)
                .filter(d => d)
                .map(d => new Date(d!).toISOString().split('T')[0]);
            const minReviewDate = dates.length > 0 ? dates.sort()[0] : undefined;

            applyHeader(sheet, headers, `Listado de Series - ${exportFileName}`, undefined, logoImageId, batchDate, minReviewDate, customerName, exportFileName);
            sourceItems.forEach((item, idx) => {
                const row = sheet.addRow([idx + 1, item.serial_number ?? '']);
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE1E1E1' } },
                        bottom: { style: 'thin', color: { argb: 'FFE1E1E1' } },
                        left: { style: 'thin', color: { argb: 'FFE1E1E1' } },
                        right: { style: 'thin', color: { argb: 'FFE1E1E1' } },
                    };
                });
            });
            sheet.views = [{ state: 'frozen', ySplit: 5 }];
            setColumnWidths(sheet, headers);
        } else {
            const groups = sourceItems.reduce<
                Record<string, { label: string; list: IItem[] }>
            >((acc, item) => {
                const meta = resolveEquipmentTypeMeta(item.equipment_type);
                const key = meta.value || 'unknown';
                if (!acc[key]) {
                    acc[key] = { label: meta.label || 'General', list: [] };
                }
                acc[key].list.push(item);
                return acc;
            }, {});

            const typeOrder = ['notebook', 'desktop', 'aio', 'docking', 'monitor'];
            const finalEntries: Array<[string, { label: string; list: IItem[] }]> = [];
            typeOrder.forEach((typeKey) => {
                if (groups[typeKey] as any) {
                    finalEntries.push([typeKey, groups[typeKey]!]);
                    delete groups[typeKey];
                }
            });
            Object.entries(groups).forEach(([key, payload]) =>
                finalEntries.push([key, payload]),
            );

            if (!finalEntries.length) {
                finalEntries.push(['general', { label: 'General', list: items }]);
            }

            finalEntries.forEach(([key, payload], index) => {
                const sheetNameBase = payload.label || EQUIPMENT_TYPE_LABELS[key] || key || 'General';
                const sheetName =
                    sheetNameBase.length > 28
                        ? `${sheetNameBase.slice(0, 28)}_${index + 1}`
                        : sheetNameBase;
                const sheet = workbook.addWorksheet(sheetName);

                const columnDefs = EXCEL_COLUMNS[key];
                
                if (columnDefs) {
                    const headers = ['Nº', ...columnDefs.map(c => c.header)];
                    
                    const dates = payload.list
                        .map(i => i.reviewed_at)
                        .filter(d => d)
                        .map(d => new Date(d!).toISOString().split('T')[0]);
                    const minReviewDate = dates.length > 0 ? dates.sort()[0] : undefined;

                    applyHeader(sheet, headers, `Revisión de Equipos - ${sheetNameBase}`, EXCEL_GROUPS[key], logoImageId, batchDate, minReviewDate, customerName, exportFileName);

                    const barcodeColIdx = columnDefs.findIndex(c => c.key === '__barcode');

                    if (!payload.list.length) {
                        sheet.addRow(headers.map(() => ''));
                    } else {
                        payload.list.forEach((item, idx) => {
                            const rowValues = [
                                idx + 1,
                                ...columnDefs.map(col => {
                                    if (col.key === '__barcode') return '';
                                    return resolveColumnValue(item, col.key);
                                }),
                            ];
                            const excelRow = sheet.addRow(rowValues);
                            const isEven = idx % 2 === 0;
                            excelRow.eachCell((cell) => {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF2F2F2' },
                                };
                                cell.border = {
                                    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                };
                            });

                            if (barcodeColIdx >= 0 && item.serial_number) {
                                const b64 = generateBarcodeBase64(item.serial_number);
                                if (b64) {
                                    const imageId = workbook.addImage({
                                        base64: b64,
                                        extension: 'png',
                                    });
                                    const col = barcodeColIdx + 1;
                                    const row = excelRow.number - 1;
                                    sheet.addImage(imageId, {
                                        tl: { col, row },
                                        ext: { width: 120, height: 25 },
                                    });
                                    excelRow.height = 25;
                                }
                            }
                        });
                    }

                    sheet.views = [{ state: 'frozen', ySplit: EXCEL_GROUPS[key] ? 6 : 5 }];
                    setColumnWidths(sheet, headers);
                } else {
                    const detailKeySet = new Set<string>();
                    payload.list.forEach((item) => {
                        const detailSource = {
                            ...(item.details || {}),
                            ...(item.extra_attributes || {}),
                        };
                        Object.keys(detailSource).forEach((k) => detailKeySet.add(k));
                    });

                    const orderedKeys = Array.from(detailKeySet);
                    const obsIdx = orderedKeys.indexOf('observations');
                    if (obsIdx > -1) {
                        orderedKeys.splice(obsIdx, 1);
                        orderedKeys.push('observations');
                    }

                    const headers = [
                        'Nº',
                        'Serial Number',
                        ...orderedKeys.map((k) => formatAttributeLabel(k)),
                    ];
                    applyHeader(sheet, headers, `Revisión de Equipos - ${sheetNameBase}`);

                    if (!payload.list.length) {
                        sheet.addRow(headers.map(() => ''));
                    } else {
                        payload.list.forEach((item, idx) => {
                            const detailSource = {
                                ...(item.details || {}),
                                ...(item.extra_attributes || {}),
                            };
                            const rowValues = [
                                idx + 1,
                                item.serial_number ?? '',
                                ...orderedKeys.map((k) => normalizeDetailValue(detailSource[k])),
                            ];
                            const excelRow = sheet.addRow(rowValues);
                            const isEven = idx % 2 === 0;
                            excelRow.eachCell((cell) => {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF2F2F2' },
                                };
                                cell.border = {
                                    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                    right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                                };
                            });
                        });
                    }

                    sheet.views = [{ state: 'frozen', ySplit: 5 }];
                    setColumnWidths(sheet, headers);
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer]),
            `Revision_${exportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
        toast.success('Archivo Excel exportado correctamente');
    } catch (error) {
        console.error(error);
        toast.error('No se pudo generar el archivo Excel');
    }
};
