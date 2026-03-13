import ExcelJS from 'exceljs';
import JsBarcode from 'jsbarcode';
import { toast } from 'react-toastify';
import {
	CONDITION_VALUES_ES,
	EQUIPMENT_TYPE_LABELS,
	EXCEL_COLUMNS,
	EXCEL_GROUPS,
	ExcelGroupDef,
} from './excel.constants';
import { IItem } from '@/interface/technicalReviews.interface';
import { resolveEquipmentTypeMeta } from '@/pages/refactor-technical-review/components/utils/utilsItems';

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
	} catch (error) {
		console.error('Error generating barcode:', error);
		return null;
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

export const normalizeDetailValue = (value: unknown): string => {
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
		if (value && 'label' in value) return String((value as any).label);
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
			if (g && typeof g === 'object' && 'label' in (g as any))
				return (g as any).label;
			return normalizeDetailValue(g);
		}
		case '__customer':
			return (item as any).customer_supplier?.name ?? '';
		case '__supplier':
			return (item as any).supplier?.name ?? '';
		case '__barcode':
			return item.serial_number ? `*${item.serial_number}*` : '';
		case '__created_by':
			return (item as any).created_by?.name ?? '';
		case '__reviewed_by':
			return (item as any).reviewed_by?.name ?? '';
		case '__battery_status': {
			const details = item.details || {};
			const extra = item.extra_attributes || {};
			const st = details.battery_status || extra.battery_status;
			const pt = details.battery_percentage ?? extra.battery_percentage;

			const brandStr = String((item as any).brand || details.brand || extra.brand || '').toLowerCase();
			const isDell = brandStr.includes('dell');

			if (isDell) {
				const parts = [];
				if (st && st !== 'no_battery') parts.push(normalizeDetailValue(st));
				else if (st === 'no_battery') return 'Sin Batería';

				if (pt !== undefined && pt !== null) parts.push(`(${pt}%)`);
				return parts.length > 0 ? parts.join(' ') : '';
			} else {
				if (pt !== undefined && pt !== null) return `${pt}%`;
				if (st) return normalizeDetailValue(st);
			}
			return '';
		}
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
			ext: { width: 220, height: 120 },
		});
	}
	
	const logoRow = sheet.addRow([]);
	logoRow.height = 60;

	const formattedSheetTitle = sheetTitle.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
	const titleRow = sheet.addRow([formattedSheetTitle]);
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
	let revisionLabel =
	revisionName || (sheetTitle.includes('Revisión') ? sheetTitle.split('-')[0].trim() : sheetTitle);
	
	// Format YYYY-MM-DD dates to DD-MM-YYYY anywhere in the string
	revisionLabel = revisionLabel.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');
	
	revisionNameCell.value = revisionLabel;
	revisionNameCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '1F4E78' } };
	revisionNameCell.alignment = { horizontal: 'center', vertical: 'middle' };
	
	const today = new Date();
	const rDate = batchDate ? new Date(batchDate + 'T00:00:00') : today;
	const fDate = reviewDate ? new Date(reviewDate + 'T00:00:00') : today;
	
	const dateLabelStyle = {
		font: { name: 'Arial', size: 10, bold: true },
		alignment: { horizontal: 'left' },
	};
	const dateValueStyle = {
		font: { name: 'Arial', size: 10, bold: false },
		alignment: { horizontal: 'left' },
	};
	
	const cellI2 = sheet.getCell('I2');
	cellI2.value = 'Fecha Recepción:';
	cellI2.font = dateLabelStyle.font as Partial<ExcelJS.Font>;
	cellI2.alignment = dateLabelStyle.alignment as Partial<ExcelJS.Alignment>;


	const formatDateToDDMMYYYY = (d: Date) => {
		const dd = String(d.getDate()).padStart(2, '0');
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const yyyy = d.getFullYear();
		return `${dd}-${mm}-${yyyy}`;
	};

	const receptionDateStr = formatDateToDDMMYYYY(rDate);
	const finalReviewDateStr = formatDateToDDMMYYYY(fDate);

	const cellJ2 = sheet.getCell('J2');
	cellJ2.value = receptionDateStr;
	cellJ2.font = dateValueStyle.font as Partial<ExcelJS.Font>;
	cellJ2.alignment = dateValueStyle.alignment as Partial<ExcelJS.Alignment>;

	const cellI3 = sheet.getCell('I3');
	cellI3.value = 'Fecha Revisión:';
	cellI3.font = dateLabelStyle.font as Partial<ExcelJS.Font>;
	cellI3.alignment = dateLabelStyle.alignment as Partial<ExcelJS.Alignment>;

	const cellJ3 = sheet.getCell('J3');
	cellJ3.value = finalReviewDateStr;
	cellJ3.font = dateValueStyle.font as Partial<ExcelJS.Font>;
	cellJ3.alignment = dateValueStyle.alignment as Partial<ExcelJS.Alignment>;

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
	rawExportFileName: string,
	onExportFetchAll?: (includeDetails?: boolean) => Promise<IItem[]>,
	batchDate?: string,
	customerName?: string,
) => {
	// Force YYYY-MM-DD to DD-MM-YYYY format in the filename from the start
	const exportFileName = rawExportFileName.replace(/(\d{4})-(\d{2})-(\d{2})/g, '$3-$2-$1');

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
				.map((i) => i.reviewed_at)
				.filter((d) => d)
				.map((d) => d!.split('T')[0]);
			const minReviewDate = dates.length > 0 ? dates.sort()[0] : undefined;

			applyHeader(
				sheet,
				headers,
				`Listado de Series - ${exportFileName}`,
				undefined,
				logoImageId,
				batchDate,
				minReviewDate,
				customerName,
				exportFileName,
			);
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
			const groups = sourceItems.reduce<Record<string, { label: string; list: IItem[] }>>(
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

			const typeOrder = ['notebook', 'desktop', 'aio', 'docking', 'monitor'];
			const finalEntries: Array<[string, { label: string; list: IItem[] }]> = [];
			typeOrder.forEach((typeKey) => {
				if ((groups as any)[typeKey]) {
					finalEntries.push([typeKey, groups[typeKey]!]);
					delete groups[typeKey];
				}
			});

			Object.entries(groups).forEach(([key, payload]) => finalEntries.push([key, payload]));

			if (!finalEntries.length) {
				finalEntries.push(['general', { label: 'General', list: items }]);
			}

			finalEntries.forEach(([key, payload], index) => {
				const sheetNameBase = payload.label || EQUIPMENT_TYPE_LABELS[key] || key || 'General';
				const sheetName =
					sheetNameBase.length > 28 ? `${sheetNameBase.slice(0, 28)}_${index + 1}` : sheetNameBase;
				const sheet = workbook.addWorksheet(sheetName);

				const columnDefs = EXCEL_COLUMNS[key];

				if (columnDefs) {
					const headers = ['Nº', ...columnDefs.map((c) => c.header)];
					const dates = payload.list
						.map((i) => i.reviewed_at)
						.filter((d) => d)
						.map((d) => d!.split('T')[0]);
					const minReviewDate = dates.length > 0 ? dates.sort()[0] : undefined;

					applyHeader(
						sheet,
						headers,
						`Revisión de Equipos - ${sheetNameBase}`,
						EXCEL_GROUPS[key],
						logoImageId,
						batchDate,
						minReviewDate,
						customerName,
						exportFileName,
					);

					const barcodeColIdx = columnDefs.findIndex((c) => c.key === '__barcode');

					if (!payload.list.length) {
						sheet.addRow(headers.map(() => ''));
					} else {
						payload.list.forEach((item, idx) => {
							const rowValues = [
								idx + 1,
								...columnDefs.map((col) => {
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
							const rowValues = [
								idx + 1,
								item.serial_number || '',
								...orderedKeys.map((k) => resolveColumnValue(item, k)),
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
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		
		// Use dynamically imported file-saver to avoid SSR issues or top-level typing conflicts
		const FileSaver = await import('file-saver');
		FileSaver.default.saveAs(blob, `${exportFileName}.xlsx`);
		
		toast.success('Excel exportado exitosamente');
	} catch (error) {
		console.error('Error exporting to Excel:', error);
		toast.error('Ocurrió un error al exportar el archivo Excel');
	}
};
