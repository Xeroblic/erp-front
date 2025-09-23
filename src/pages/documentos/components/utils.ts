import { DOCUMENT_TYPES, FILE_TYPES, RELATED_MODULES, TDocumentType, TFileType, TRelatedModule } from '../types/documentos.types';

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

export const getFileIcon = (fileType: TFileType): string => {
  switch (fileType) {
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

export const getDocumentTypeColor = (type: TDocumentType): string => {
  switch (type) {
    case 'contrato':
      return 'blue';
    case 'factura':
      return 'emerald';
    case 'cotizacion':
      return 'amber';
    case 'orden_compra':
      return 'violet';
    case 'orden_venta':
      return 'indigo';
    case 'certificado':
      return 'emerald';
    case 'manual':
      return 'sky';
    case 'politica':
      return 'orange';
    case 'procedimiento':
      return 'teal';
    case 'imagen':
      return 'pink';
    default:
      return 'gray';
  }
};

export const getDocumentTypeLabel = (type: TDocumentType): string =>
  DOCUMENT_TYPES.find((item) => item.value === type)?.label || type;

export const getFileTypeLabel = (type: TFileType) => FILE_TYPES.find((item) => item.value === type)?.label || type.toUpperCase();

export const getModuleLabel = (module: TRelatedModule) =>
  RELATED_MODULES.find((item) => item.value === module)?.label || module;
