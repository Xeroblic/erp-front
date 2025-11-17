import {
	DOCUMENT_MODULE_OPTIONS,
	DOCUMENT_OUTPUT_FORMATS,
	IDocument,
	TDocumentModule,
} from '../types/documentos.types';

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${parseFloat(value.toFixed(2))} ${units[index]}`;
};

export const formatDateTime = (value: string): string =>
  new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const getFileIcon = (fileType: string): string => {
  const normalized = (fileType || '').toLowerCase();
  if (normalized.includes('pdf')) return 'HeroDocumentText';
  if (normalized.includes('word') || normalized.endsWith('doc') || normalized.endsWith('docx')) {
    return 'HeroDocument';
  }
  if (normalized.includes('excel') || normalized.endsWith('xls') || normalized.endsWith('xlsx')) {
    return 'HeroTableCells';
  }
  if (normalized.includes('powerpoint') || normalized.endsWith('ppt') || normalized.endsWith('pptx')) {
    return 'HeroPresentationChartLine';
  }
  switch (normalized) {
    case 'pdf':
      return 'HeroDocumentText';
    case 'doc':
    case 'docx':
      return 'HeroDocument';
    case 'xls':
    case 'xlsx':
      return 'HeroTableCells';
    case 'ppt':
    case 'pptx':
      return 'HeroPresentationChartLine';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'HeroPhoto';
    case 'zip':
    case 'rar':
      return 'HeroArchiveBox';
    default:
      return 'HeroDocument';
  }
};

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
	contrato: 'blue',
	factura: 'emerald',
	cotización: 'amber',
	cotizacion: 'amber',
	'orden de compra': 'violet',
	'orden de venta': 'indigo',
	certificado: 'sky',
	manual: 'teal',
	política: 'orange',
	politica: 'orange',
	procedimiento: 'pink',
	imagen: 'rose',
};

export const getDocumentTypeColor = (document?: IDocument): string => {
	const name = document?.document_type?.name?.toLowerCase() ?? '';
	const byCode = document?.document_type?.code?.toLowerCase() ?? '';
	return (
		DOCUMENT_TYPE_COLORS[name] ||
		DOCUMENT_TYPE_COLORS[byCode] ||
		(document?.is_active ? 'emerald' : 'gray')
	);
};

export const getDocumentTypeLabel = (document?: IDocument): string =>
	document?.document_type?.name || 'Sin tipo';

export const getFileTypeLabel = (type: string) =>
	DOCUMENT_OUTPUT_FORMATS.find((item) => item.value === type)?.label || type.toUpperCase();

export const getModuleLabel = (module: TDocumentModule | string) =>
	DOCUMENT_MODULE_OPTIONS.find((item) => item.value === module)?.label || module;
