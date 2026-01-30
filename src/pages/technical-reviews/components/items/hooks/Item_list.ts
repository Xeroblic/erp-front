import { deleteItem } from "@/store/slices/technicalReviews";
import { toast } from "react-toastify";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DETAIL_FIELDS_TEMPLATE } from '../../../constants';
import { resolveEquipmentTypeMeta } from '../../utils/utilsItems';
import { IItem } from '@/interface/technicalReviews.interface';

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
    notebook: 'Notebook',
    desktop: 'Desktop',
    aio: 'All-in-One',
    docking: 'Docking',
    monitor: 'Monitor',
};


const FIELD_LABELS_ES: Record<string, string> = {
    // Información básica
    brand: 'Marca',
    model: 'Modelo',
    line: 'Línea',
    processor: 'Procesador',

    // Memoria y almacenamiento
    ram_size: 'RAM',
    ram_slots: 'Slots RAM',
    ram_type: 'Tipo RAM',
    storage_size: 'Capacidad Almacenamiento',
    storage_technology: 'Tecnología Almacenamiento',

    // Cargador y energía
    includes_charger: 'Incluye Cargador',
    includes_power_adapter: 'Incluye Cargador',
    charger_watts: 'Watts Cargador',
    charger_status: 'Estado Cargador',
    power_cable_status: 'Estado Cargador',
    includes_power_cable: 'Incluye Cable Poder',
    includes_charger_docking: 'Incluye Fuente',

    // Batería
    battery_status: 'Estado Batería',
    battery_health: 'Salud Batería',
    battery_percentage: '% Batería',
    battery_holds_charge: 'Mantiene Carga',
    battery_condition: 'Condición Batería',

    // Puertos
    vga_ports: 'Puertos VGA',
    dvi_ports: 'Puertos DVI',
    hdmi_ports: 'Puertos HDMI',
    displayport_ports: 'Puertos DisplayPort',
    usb_a_ports: 'Puertos USB-A',
    usb_c_ports: 'Puertos USB-C',
    lector_de_tarjetas_sd: 'Lectores SD',
    sd_readers: 'Lectores SD',
    rj45_ports: 'Puertos RJ-45',
    all_ports_functional: 'Puertos Funcionan',
    defective_ports_count: 'Puertos Defectuosos',
    critical_defective_ports_count: 'Puertos Críticos Defectuosos',

    // Conectividad
    has_wifi: 'Wi-Fi',
    has_bluetooth: 'Bluetooth',

    // Pantalla
    screen_inches: 'Pulgadas Pantalla',
    screen_resolution: 'Resolución Pantalla',
    screen_condition: 'Condición Pantalla',
    is_touchscreen: 'Pantalla Táctil',
    resolution: 'Resolución',

    // Teclado
    keyboard_condition: 'Condición Teclado',
    keyboard_layout: 'Layout Teclado',
    has_numeric_keypad: 'Teclado Numérico',
    has_backlit_keyboard: 'Teclado Iluminado',

    // Touchpad
    touchpad_condition: 'Condición Touchpad',

    // Condiciones físicas
    general_condition: 'Condición General',
    cover_condition: 'Condición Tapa',
    frame_condition: 'Condición Marco',
    hinge_condition: 'Bisagras',
    bottom_condition: 'Base',
    bottom_cover_condition: 'Cubierta Inferior',
    stand_condition: 'Base/Soporte',

    // Sistema y unidades
    operating_system: 'Sistema Operativo',
    has_cd_drive: 'Unidad CD/DVD',

    // Accesorios y extras
    other_includes: 'Incluye Otros',
    includes_video_cable: 'Incluye Cable Video',
    includes_stand: 'Incluye Base',
    other_includes_monitor: 'Otros (Monitor)',
    has_usb_hub: 'USB Hub',
    usb_hub_ports: 'Puertos Hub USB',

    // Observaciones
    obervations: 'Observaciones',
    observations: 'Observaciones',
};

const CONDITION_VALUES_ES: Record<string, string> = {
    // Estados de condición general
    like_new: 'Como Nuevo',
    good_shape: 'Buen Estado',
    visible_wear: 'Desgaste Visible',
    noticeable_wear: 'Desgaste Notable',
    worn: 'Desgastado',
    missing_pieces: 'Piezas Faltantes',
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Regular',
    poor: 'Malo',
    damaged: 'Dañado',
    needs_repair: 'Necesita Reparación',
    broken: 'Roto',
    scratches: 'Rayones',
    dents: 'Abolladuras',
    cracks: 'Grietas',

    // Condiciones de pantalla
    dead_pixels: 'Píxeles Muertos',
    screen_burn: 'Quemadura de Pantalla',
    flickering: 'Parpadeo',

    // Estados funcionales
    working: 'Funcionando',
    not_working: 'No Funciona',
    partially_working: 'Funciona Parcialmente',
    functional: 'Funcional',
    non_functional: 'No Funcional',

    // Estados de cargador/batería
    ok: 'OK',
    es: 'SI',
    original: 'Original',
    generic: 'Genérico',
    missing: 'Faltante',

    // Estados de review
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    in_review: 'En Revisión',
    reviewed: 'Revisado',
    completed: 'Completado',
    approved: 'Aprobado',
    rejected: 'Rechazado',

    // Estados comerciales/trazabilidad
    received: 'Ingresado',
    available_for_sale: 'Disponible para Venta',
    in_quotation: 'En Cotización',
    reserved: 'Reservado',
    sold: 'Vendido',
    in_repair: 'En Reparación',
    scrapped: 'Dado de Baja',
    returned: 'Devuelto',

    // Layouts de teclado
    spanish: 'Español',
    english: 'Inglés',
    latin_american: 'Latinoamericano',
    us: 'Estados Unidos',
    international: 'Internacional',

    // Grados
    a: 'A',
    b: 'B',
    c: 'C',
    m: 'M',

    // Otros valores comunes
    yes: 'SI',
    no: 'NO',
    na: 'N/A',
    none: 'Ninguno',
    unknown: 'Desconocido',
    new: 'Nuevo',
    used: 'Usado',
    refurbished: 'Reacondicionado',
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


export 	const formatAttributeLabel = (key: string) => {
		if (!key) return 'Atributo';
		const normalized = key.toLowerCase();
		if (FIELD_LABELS_ES[normalized]) {
			return FIELD_LABELS_ES[normalized];
		}
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
                // Intentar traducir valores comunes
                const normalized = value.toLowerCase().trim();
                if (CONDITION_VALUES_ES[normalized]) {
                    return CONDITION_VALUES_ES[normalized];
                }
                return value;
            }
            return JSON.stringify(value);
        };
    



export const applyHeader = (sheet: ExcelJS.Worksheet, headers: string[], sheetTitle: string) => {
        sheet.addRow([]);
        const titleRow = sheet.addRow([sheetTitle]);
        titleRow.font = { bold: true, size: 16, color: { argb: '1F4E78' } };
        titleRow.alignment = { horizontal: 'center' };
        const maxMerge = Math.min(Math.max(headers.length, 2), 8);
        sheet.mergeCells(2, 1, 2, maxMerge);
        const today = new Date().toLocaleDateString('es-CL');
        sheet.getCell('I2').value = `Fecha Recepción: ${today}`;
        sheet.getCell('I2').alignment = { horizontal: 'left' };
        sheet.getCell('I3').value = `Fecha Revisión: ${today}`;
        sheet.getCell('I3').alignment = { horizontal: 'left' };
        sheet.addRow([]);
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
        let maxLength = header.length + 2;
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
    onExportFetchAll?: (includeDetails?: boolean) => Promise<IItem[]>
) => {
    if (!items.length) {
        toast.info('No hay datos para exportar');
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
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
            applyHeader(sheet, headers, `Listado de Series - ${exportFileName}`);
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
            const detailedItems = sourceItems;
            const groups = detailedItems.reduce<
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

            const finalEntries: Array<[string, { label: string; list: IItem[] }]> = [];
            Object.keys(DETAIL_FIELDS_TEMPLATE).forEach((typeKey) => {
                if (groups[typeKey]) {
                    finalEntries.push([typeKey, groups[typeKey]]);
                    delete groups[typeKey];
                } else {
                    finalEntries.push([
                        typeKey,
                        {
                            label: EQUIPMENT_TYPE_LABELS[typeKey] || typeKey,
                            list: [],
                        },
                    ]);
                }
            });
            Object.entries(groups).forEach(([key, payload]) =>
                finalEntries.push([key, payload]),
            );
            if (!finalEntries.length) {
                finalEntries.push(['general', { label: 'General', list: items }]);
            }

            finalEntries.forEach(([key, payload], index) => {
                const sheetNameBase = payload.label || key || 'General';
                const sheetName =
                    sheetNameBase.length > 28
                        ? `${sheetNameBase.slice(0, 28)}_${index + 1}`
                        : sheetNameBase;
                const sheet = workbook.addWorksheet(sheetName);
                const templateFields = DETAIL_FIELDS_TEMPLATE[key as keyof typeof DETAIL_FIELDS_TEMPLATE] ?? [];
                
                // Collect all keys from all items in this group
                const detailKeySet = new Set<string>();
                // Add template fields first to preserve order
                templateFields.forEach(field => detailKeySet.add(field));
                
                payload.list.forEach((item) => {
                    const detailSource = {
                        ...(item.details || {}),
                        ...(item.extra_attributes || {}),
                    };
                    Object.keys(detailSource).forEach((k) => detailKeySet.add(k));
                });
                
                const orderedKeys = Array.from(detailKeySet);

                const headers = [
                    'N°',
                    'Serie',
                    ...orderedKeys.map((k) => formatAttributeLabel(k)),
                ];
                applyHeader(sheet, headers, `Revisión de Equipos - ${payload.label}`);

                if (!payload.list.length) {
                    const emptyRow = headers.map(() => '');
                    sheet.addRow(emptyRow);
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
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer]),
            `Revision_${exportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        );
        toast.success('Archivo Excel exportado con formato compacto');
    } catch (error) {
        console.error(error);
        toast.error('No se pudo generar el archivo Excel');
    }
};