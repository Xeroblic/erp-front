import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/** Lo que se usa del documento de `pdfmake`: desde la 0.3 cada salida devuelve una promesa. */
export interface IPdfMakeDocument {
	getBlob: () => Promise<Blob>;
	download: (fileName: string) => Promise<void>;
}

/** Lo que se usa del build del navegador, que no publica tipos para esa ruta. */
export interface IPdfMake {
	addVirtualFileSystem: (vfs: Record<string, string>) => void;
	createPdf: (definition: TDocumentDefinitions) => IPdfMakeDocument;
}

const isPdfMake = (value: unknown): value is IPdfMake =>
	typeof value === 'object' &&
	value !== null &&
	'createPdf' in value &&
	typeof value.createPdf === 'function' &&
	'addVirtualFileSystem' in value &&
	typeof value.addVirtualFileSystem === 'function';

/**
 * Carga `pdfmake` y sus fuentes Roboto bajo demanda, sólo al exportar. Desde la 0.3 el build del
 * navegador no trae las fuentes: sin registrarlas, `createPdf` no encuentra `Roboto-Regular.ttf`.
 */
const loadPdfMake = async (): Promise<IPdfMake> => {
	const [pdfMakeModule, fontsModule] = await Promise.all([
		import('pdfmake/build/pdfmake'),
		import('pdfmake/build/vfs_fonts'),
	]);
	const pdfMake = pdfMakeModule.default;
	if (!isPdfMake(pdfMake)) throw new Error('No se pudo cargar el generador de PDF.');
	pdfMake.addVirtualFileSystem(fontsModule.default);
	return pdfMake;
};

export default loadPdfMake;
