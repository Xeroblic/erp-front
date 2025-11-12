/**
 * ItemList - Tabla reutilizable de series/ítems
 * Usado en: pages/items/index.tsx y BatchTabs.tsx
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import Icon from '@/components/icon/Icon';
import type { IItem, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';
import { useAppDispatch } from '@/store';
import { deleteItem } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { toast } from 'react-toastify';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	OnChangeFn,
	PaginationState,
	useReactTable,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type ExportMode = 'serials' | 'details';

type ExportFetcher = (includeDetails?: boolean) => Promise<IItem[]>;

interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onItemClick?: (itemId: number) => void;
	baseUrl?: string; // URL base para navegación (ej: '/technical-reviews/items' o '/technical-reviews/batches/5')
	emptyMessage?: string;
	variant?: 'batch' | 'global';
	exportFileName?: string;
	onExportFetchAll?: ExportFetcher;
}

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
	notebook: 'Notebook',
	desktop: 'Desktop',
	aio: 'All-in-One',
	docking: 'Docking',
	monitor: 'Monitor',
};

const FIELD_LABELS_ES: Record<string, string> = {
	brand: 'Marca',
	model: 'Modelo',
	line: 'Línea',
	processor: 'Procesador',
	ram_size: 'RAM',
	ram_slots: 'Slots RAM',
	ram_type: 'Tipo RAM',
	storage_size: 'Capacidad Almacenamiento',
	storage_technology: 'Tecnología Almacenamiento',
	includes_charger: 'Incluye Cargador',
	charger_watts: 'Watts Cargador',
	charger_status: 'Estado Cargador',
	other_includes: 'Incluye Otros',
	battery_status: 'Estado Batería',
	battery_health: 'Salud Batería',
	battery_percentage: '% Batería',
	battery_holds_charge: 'Mantiene Carga',
	battery_condition: 'Condición Batería',
	vga_ports: 'Puertos VGA',
	dvi_ports: 'Puertos DVI',
	hdmi_ports: 'Puertos HDMI',
	displayport_ports: 'Puertos DisplayPort',
	usb_a_ports: 'Puertos USB-A',
	usb_c_ports: 'Puertos USB-C',
	lector_de_tarjetas_sd: 'Lectores SD',
	rj45_ports: 'Puertos RJ-45',
	has_wifi: 'Wi-Fi',
	has_bluetooth: 'Bluetooth',
	all_ports_functional: 'Puertos Funcionan',
	defective_ports_count: 'Puertos Defectuosos',
	critical_defective_ports_count: 'Puertos Críticos Defectuosos',
	screen_inches: 'Pulgadas Pantalla',
	screen_resolution: 'Resolución Pantalla',
	screen_condition: 'Condición Pantalla',
	is_touchscreen: 'Pantalla Táctil',
	keyboard_condition: 'Condición Teclado',
	keyboard_layout: 'Layout Teclado',
	has_numeric_keypad: 'Teclado Numérico',
	has_backlit_keyboard: 'Teclado Iluminado',
	touchpad_condition: 'Condición Touchpad',
	general_condition: 'Condición General',
	cover_condition: 'Condición Tapa',
	frame_condition: 'Condición Marco',
	hinge_condition: 'Bisagras',
	bottom_condition: 'Base',
	stand_condition: 'Base/Soporte',
	operating_system: 'Sistema Operativo',
	has_cd_drive: 'Unidad CD/DVD',
	includes_power_cable: 'Incluye Cable Poder',
	includes_video_cable: 'Incluye Cable Video',
	includes_stand: 'Incluye Base',
	other_includes_monitor: 'Otros (Monitor)',
	has_usb_hub: 'USB Hub',
	usb_hub_ports: 'Puertos Hub USB',
	resolution: 'Resolución',
	obervations: 'Observaciones',
	observations: 'Observaciones',
	includes_charger_docking: 'Incluye Fuente',
	bottom_cover_condition: 'Cubierta Inferior',
};

const DETAIL_FIELDS_TEMPLATE: Record<string, string[]> = {
	notebook: [
		'brand',
		'model',
		'line',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'includes_charger',
		'charger_watts',
		'charger_status',
		'other_includes',
		'battery_status',
		'battery_health',
		'battery_percentage',
		'battery_holds_charge',
		'battery_condition',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'lector_de_tarjetas_sd',
		'rj45_ports',
		'has_wifi',
		'has_bluetooth',
		'all_ports_functional',
		'defective_ports_count',
		'screen_inches',
		'screen_condition',
		'is_touchscreen',
		'keyboard_condition',
		'keyboard_layout',
		'has_numeric_keypad',
		'has_backlit_keyboard',
		'touchpad_condition',
		'general_condition',
		'cover_condition',
		'hinge_condition',
		'bottom_condition',
		'operating_system',
		'observations',
	],
	desktop: [
		'brand',
		'model',
		'line',
		'general_condition',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'operating_system',
		'has_cd_drive',
		'cover_condition',
		'has_wifi',
		'has_bluetooth',
		'observations',
	],
	aio: [
		'brand',
		'model',
		'line',
		'general_condition',
		'processor',
		'ram_size',
		'ram_slots',
		'ram_type',
		'storage_size',
		'storage_technology',
		'operating_system',
		'has_cd_drive',
		'screen_inches',
		'screen_condition',
		'is_touchscreen',
		'cover_condition',
		'stand_condition',
		'includes_charger',
		'charger_status',
		'has_wifi',
		'has_bluetooth',
		'observations',
	],
	monitor: [
		'brand',
		'model',
		'line',
		'general_condition',
		'screen_inches',
		'screen_resolution',
		'screen_condition',
		'is_touchscreen',
		'frame_condition',
		'stand_condition',
		'vga_ports',
		'dvi_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'all_ports_functional',
		'critical_defective_ports_count',
		'observations',
	],
	docking: [
		'brand',
		'model',
		'line',
		'general_condition',
		'includes_charger',
		'charger_status',
		'cover_condition',
		'vga_ports',
		'hdmi_ports',
		'displayport_ports',
		'usb_a_ports',
		'usb_c_ports',
		'lector_de_tarjetas_sd',
		'rj45_ports',
		'has_wifi',
		'has_bluetooth',
		'all_ports_functional',
		'defective_ports_count',
		'observations',
	],
};

const ItemList: React.FC<ItemListProps> = ({
	items,
	loading,
	meta,
	onPageChange,
	onLimitChange,
	onItemClick,
	baseUrl = '/technical-reviews/items',
	emptyMessage = 'No hay series para mostrar',
	variant = 'batch',
	exportFileName = 'items-export',
	onExportFetchAll,
}) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [exportMode, setExportMode] = useState<ExportMode>('serials');
	const [isExporting, setIsExporting] = useState(false);

	// Helper para extraer valor de objetos {value, label, description} o devolver el valor directamente
	const extractValue = (value: any): string | null => {
		if (value == null) return null;
		if (typeof value === 'string' || typeof value === 'number') return String(value);
		if (typeof value === 'object' && 'value' in value) return String(value.value);
		return String(value);
	};

	const resolveEquipmentTypeMeta = (
		equipmentType: any,
	): { value: string; label: string; icon: string } => {
		const value = (
			typeof equipmentType === 'object' && equipmentType !== null && 'value' in equipmentType
				? equipmentType.value
				: equipmentType
		) as string | null;

		const normalizedValue = value ?? 'unknown';

		if (
			typeof equipmentType === 'object' &&
			equipmentType !== null &&
			'label' in equipmentType &&
			equipmentType.label
		) {
			return {
				value: normalizedValue,
				label: String(equipmentType.label),
				icon:
					normalizedValue === 'notebook'
						? 'HeroComputerDesktop'
						: normalizedValue === 'desktop'
							? 'HeroServerStack'
							: normalizedValue === 'aio'
								? 'HeroDeviceTablet'
								: normalizedValue === 'docking'
									? 'HeroCpuChip'
									: 'HeroTv',
			};
		}

		const label =
			normalizedValue === 'notebook'
				? 'Notebook'
				: normalizedValue === 'desktop'
					? 'Desktop'
					: normalizedValue === 'aio'
						? 'AIO'
						: normalizedValue === 'docking'
							? 'Docking'
							: normalizedValue === 'monitor'
								? 'Monitor'
								: 'Desconocido';

		const icon =
			normalizedValue === 'notebook'
				? 'HeroComputerDesktop'
				: normalizedValue === 'desktop'
					? 'HeroServerStack'
					: normalizedValue === 'aio'
						? 'HeroDeviceTablet'
						: normalizedValue === 'docking'
							? 'HeroCpuChip'
							: 'HeroTv';

		return { value: normalizedValue, label, icon };
	};

	const formatDateTime = (value?: string | null, fallbackDash = true): string => {
		if (!value) return fallbackDash ? '—' : '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return fallbackDash ? '—' : '';
		return date.toLocaleString('es-CL', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	};

	const formatDateForExport = (value?: string | null): string => {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleString('es-CL', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	};

	const handleItemClick = (itemId: number) => {
		if (onItemClick) {
			onItemClick(itemId);
		} else {
			navigate(`${baseUrl}/${itemId}`);
		}
	};

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<IItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async (itemId: number) => {
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

const formatAttributeLabel = (key: string) => {
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

	const sanitizeFileName = (name: string) =>
		name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'items-export';

	const formatBoolean = (value: any): string => {
		if (typeof value !== 'boolean') return '';
		return value ? 'SI' : 'NO';
	};

	const normalizeDetailValue = (value: any): string => {
		if (value === null || typeof value === 'undefined') return '';
		if (typeof value === 'boolean') return formatBoolean(value);
		if (typeof value === 'number') return String(value);
		if (typeof value === 'string') return value;
		return JSON.stringify(value);
	};

	const applyHeader = (sheet: ExcelJS.Worksheet, headers: string[], sheetTitle: string) => {
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

	const setColumnWidths = (sheet: ExcelJS.Worksheet, headers: string[]) => {
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

	const handleExport = async () => {
		if (!items.length) {
			toast.info('No hay datos para exportar');
			return;
		}

		setIsExporting(true);
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
				const groups = detailedItems.reduce<Record<string, { label: string; list: IItem[] }>>(
					(acc, item) => {
						const meta = resolveEquipmentTypeMeta(item.equipment_type);
						const key = meta.value || 'unknown';
						if (!acc[key]) {
							acc[key] = { label: meta.label || 'General', list: [] };
						}
						acc[key].list.push(item);
						return acc;
					},
					{},
				);

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
				Object.entries(groups).forEach(([key, payload]) => finalEntries.push([key, payload]));
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
					const templateFields = DETAIL_FIELDS_TEMPLATE[key] ?? [];
					const detailKeySet = new Set<string>(templateFields);
					payload.list.forEach((item) => {
						const detailSource = {
							...(item.details || {}),
							...(item.extra_attributes || {}),
						};
						Object.keys(detailSource).forEach((k) => detailKeySet.add(k));
					});
					const orderedKeys = [
						...templateFields,
						...Array.from(detailKeySet).filter((field) => !templateFields.includes(field)),
					];
					const headers = ['N°', 'Serie', ...orderedKeys.map((k) => formatAttributeLabel(k))];
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
		} finally {
			setIsExporting(false);
		}
	};

	// TanStack Table setup (debe ejecutarse SIEMPRE antes de cualquier return condicional)
	const columnHelper = useMemo(() => createColumnHelper<IItem>(), []);

	const columns = useMemo(() => {
		const cols = [
			columnHelper.display({
				id: 'serial_number',
				header: 'Serie',
				cell: (info) => {
					const item = info.row.original;
					return (
						<div className='flex items-center gap-2'>
							<Icon icon='HeroQrCode' className='h-4 w-4 text-gray-400' />
							<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
								{item.serial_number}
							</span>
						</div>
					);
				},
			}),

			// Tipo
			columnHelper.display({
				id: 'equipment_type',
				header: 'Tipo',
				cell: (info) => {
					const item = info.row.original;
					const { label, icon } = resolveEquipmentTypeMeta(item.equipment_type);
					return (
						<span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
							<Icon icon={icon as any} className='h-3 w-3' />
							{label}
						</span>
					);
				},
			}),

			// Estado revisión
			columnHelper.display({
				id: 'review_status',
				header: 'Estado Revisión',
				cell: (info) => (
					<StatusBadge type='review' status={info.row.original.review_status} />
				),
			}),

			// Estado comercial
			columnHelper.display({
				id: 'current_status',
				header: 'Estado Comercial',
				cell: (info) => (
					<StatusBadge type='commercial' status={info.row.original.current_status} />
				),
			}),

			// Grado
			columnHelper.display({
				id: 'grade',
				header: 'Grado',
				cell: (info) => {
					const item = info.row.original;
					return extractValue(item.grade) ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
							<Icon icon='HeroStar' className='h-3 w-3' />
							{extractValue(item.grade)}
							{extractValue(item.suggested_grade) &&
								extractValue(item.grade) !== extractValue(item.suggested_grade) && (
									<span className='text-[10px] text-yellow-600 dark:text-yellow-400'>
										(Sugerido: {extractValue(item.suggested_grade)})
									</span>
								)}
						</span>
					) : extractValue(item.suggested_grade) ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
							<Icon icon='HeroSparkles' className='h-3 w-3' />
							{extractValue(item.suggested_grade)}
						</span>
					) : (
						<span className='text-xs text-gray-400'>Pendiente</span>
					);
				},
			}),
		] as any[];

		if (variant === 'global') {
			cols.splice(
				1,
				0,
				// Producto (solo global)
				columnHelper.display({
					id: 'product_name',
					header: 'Producto',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.product?.name || item?.product_name || 'Sin producto'}
							</span>
						);
					},
				}),
			);

			cols.push(
				// Bodega (solo global)
				columnHelper.display({
					id: 'warehouse_name',
					header: 'Bodega',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.warehouse?.name || item?.warehouse_name || '—'}
							</span>
						);
					},
				}),
				// Última actualización (solo global)
				columnHelper.display({
					id: 'updated_at',
					header: 'Última actualización',
					cell: (info) => (
						<span className='text-sm text-gray-600 dark:text-gray-400'>
							{formatDateTime(
								info.row.original.updated_at || info.row.original.created_at,
							)}
						</span>
					),
				}),
			);
		}

		// Acciones
		cols.push(
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => {
					const item = info.row.original;
					const reviewStatus = (extractValue(item.review_status) || '').toLowerCase();
					const isApproved = reviewStatus === 'approved';
					return (
						<div className='inline-flex w-full justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									handleItemClick(item.id);
								}}>
								<Icon icon='HeroEye' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								color='red'
								isDisable={isApproved}
								onClick={(e) => {
									e.stopPropagation();
									setItemToDelete(item);
									setDeleteModalOpen(true);
								}}
								title={
									isApproved
										? 'No se puede eliminar una revisión aprobada'
										: 'Eliminar revisión'
								}>
								<Icon icon='HeroTrash' className='h-4 w-4' />
							</Button>
						</div>
					);
				},
			}),
		);

		return cols;
	}, [columnHelper, variant]);

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const current: PaginationState = {
			pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
			pageSize: meta?.per_page || 10,
		};
		const next = typeof updater === 'function' ? updater(current) : updater;

		if (next.pageSize !== current.pageSize) {
			onLimitChange?.(next.pageSize);
			return;
		}

		if (next.pageIndex !== current.pageIndex) {
			onPageChange?.(next.pageIndex + 1);
		}
	};

	const table = useReactTable({
		data: items ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination: {
				pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
				pageSize: meta?.per_page || 10,
			},
		},
		onPaginationChange: handlePaginationChange,
		manualPagination: true,
		pageCount: meta?.last_page || 1,
	});

	if (loading) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='flex items-center justify-center'>
						<Icon
							icon='HeroArrowPath'
							className='mr-2 h-6 w-6 animate-spin text-blue-600'
						/>
						<span className='text-gray-600 dark:text-gray-400'>Cargando series...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	if (!items || items.length === 0) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='text-center'>
						<Icon
							icon='HeroInboxStack'
							className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-600'
						/>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>{emptyMessage}</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<div className='space-y-4'>
			<Card>
				<CardBody className='p-0'>
					<div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800'>
						<div>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Mostrando {items.length} de {meta?.total ?? items.length} series
							</p>
						</div>
						<div className='flex flex-wrap items-center gap-2'>
							<Button
								variant='outline'
								size='sm'
								className='flex items-center gap-2'
								isDisable={!items.length}
								onClick={() => setIsExportModalOpen(true)}>
								<Icon icon='HeroArrowDownTray' className='h-4 w-4' />
								Exportar XLSX
							</Button>
						</div>
					</div>
					<div className='overflow-x-auto'>
						<Table className='w-full'>
							<THead className='bg-gray-50 dark:bg-gray-800'>
								{table.getHeaderGroups().map((headerGroup) => (
									<Tr key={headerGroup.id} className='select-none'>
										{headerGroup.headers.map((header) => (
											<Th
												key={header.id}
												className='text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</Th>
										))}
									</Tr>
								))}
							</THead>
							<TBody>
								{table.getRowModel().rows.map((row, index) => (
									<Tr
										key={row.id}
										// className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-zinc-50/30 dark:bg-zinc-800/20'}`}
										onClick={() => handleItemClick(row.original.id)}>
										{row.getVisibleCells().map((cell) => (
											<Td key={cell.id} className='align-middle'>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</Td>
										))}
									</Tr>
								))}
							</TBody>
						</Table>
					</div>

					<div className='mt-4 px-4 pb-4'>
						<TableCardFooterTemplateV2 table={table} />
					</div>
				</CardBody>
			</Card>

			{/* Modal de confirmación de eliminación */}
			<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} size='md'>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon
							icon='HeroExclamationTriangle'
							className='h-5 w-5 text-red-600 dark:text-red-400'
						/>
						<h3 className='text-lg font-semibold'>Confirmar eliminación</h3>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						¿Eliminar la revisión de la serie{' '}
						<strong className='font-mono'>{itemToDelete?.serial_number}</strong>? Esta
						acción no se puede deshacer.
					</p>
				</ModalBody>
				<ModalFooter>
					<div className='flex w-full justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => setDeleteModalOpen(false)}
							isDisable={isDeleting}>
							Cancelar
						</Button>
						<Button
							color='red'
							onClick={() => itemToDelete && handleDelete(itemToDelete.id)}
							isDisable={isDeleting}>
							{isDeleting ? (
								<>
									<Icon
										icon='HeroArrowPath'
										className='mr-2 h-4 w-4 animate-spin'
									/>
									Eliminando...
								</>
							) : (
								<>
									<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
									Eliminar
								</>
							)}
						</Button>
					</div>
				</ModalFooter>
			</Modal>

			<Modal isOpen={isExportModalOpen} setIsOpen={setIsExportModalOpen} size='md' isCentered>
				<ModalHeader>
					<div className='flex items-center gap-2'>
						<Icon
							icon='HeroArrowDownTray'
							className='h-5 w-5 text-blue-600 dark:text-blue-300'
						/>
						<h3 className='text-lg font-semibold'>Exportar a Excel</h3>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-400'>
						Elige si necesitas una lista rápida de series o la planilla completa de
						revisión (con todos los detalles detectados por tipo de equipo).
					</p>
					<div className='mt-4 grid gap-3 sm:grid-cols-2'>
						<button
							type='button'
							onClick={() => setExportMode('serials')}
							className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 ${
								exportMode === 'serials'
									? 'border-green-500 bg-green-50 dark:border-green-400/80 dark:bg-green-900/20'
									: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
							}`}>
							<div className='flex items-center gap-2'>
								<Icon
									icon='HeroQueueList'
									className='h-5 w-5 text-green-600 dark:text-green-300'
								/>
								<p className='font-semibold text-gray-900 dark:text-gray-100'>
									Lista de series
								</p>
							</div>
							<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
								Exporta un listado simple con todas las series visibles.
							</p>
						</button>
						<button
							type='button'
							onClick={() => setExportMode('details')}
							className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 ${
								exportMode === 'details'
									? 'border-blue-500 bg-blue-50 dark:border-blue-400/80 dark:bg-blue-900/20'
									: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
							}`}>
							<div className='flex items-center gap-2'>
								<Icon
									icon='HeroClipboardDocumentList'
									className='h-5 w-5 text-blue-600 dark:text-blue-300'
								/>
								<p className='font-semibold text-gray-900 dark:text-gray-100'>
									Revisión completa
								</p>
							</div>
							<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
								Genera una hoja por tipo con todos los campos del detalle (Marca,
								RAM, Puertos, etc.).
							</p>
						</button>
					</div>
				</ModalBody>
				<ModalFooter className='flex justify-end gap-3'>
					<Button
						variant='outline'
						onClick={() => setIsExportModalOpen(false)}
						isDisable={isExporting}>
						Cancelar
					</Button>
					<Button
						color='blue'
						onClick={handleExport}
						isDisable={isExporting}
						isLoading={isExporting}>
						{isExporting ? 'Generando...' : 'Exportar XLSX'}
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default ItemList;
