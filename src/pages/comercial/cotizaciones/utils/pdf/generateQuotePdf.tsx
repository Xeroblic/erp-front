import store from '@/store';
import { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import type { IQuote } from '../../../../../interface/quotes.interface';
import { getCompanyInfo } from '../../components/quote-data-mapper';

// --- helpers para manejar blobs -> base64 / PNG --- //

const blobToDataURL = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});

const blobToPngDataURLViaCanvas = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('No 2D context'));
					return;
				}

				ctx.drawImage(img, 0, 0);

				// Convertimos TODO a PNG, que @react-pdf sí soporta
				const dataUrl = canvas.toDataURL('image/png');
				resolve(dataUrl);
			} catch (e) {
				reject(e);
			}
		};

		img.onerror = (e) => reject(e);
		img.src = URL.createObjectURL(blob);
	});

// --- NUEVA versión de fetchImageAsDataUrl --- //

const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
	try {
		console.log('[generateQuotePdf] Intentando cargar logo:', url);

		let fetchUrl = url;

		// Si la URL contiene /storage/ en cualquier lado, usamos solo la parte relativa
		if (import.meta.env.DEV) {
			const storageMatch = url.match(/\/storage\/.+$/);
			if (storageMatch) {
				fetchUrl = storageMatch[0]; // "/storage/..."
			}
		}

		console.log('[generateQuotePdf] URL procesada:', fetchUrl);

		const response = await fetch(fetchUrl);
		if (!response.ok) {
			console.error(
				'[generateQuotePdf] Error fetching logo:',
				response.status,
				response.statusText,
			);
			return null;
		}

		const blob = await response.blob();
		const mime = blob.type || '';

		console.log('[generateQuotePdf] Logo content-type:', mime);

		if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/jpg') {
			const dataUrl = await blobToDataURL(blob);
			console.log('[generateQuotePdf] Logo PNG/JPEG cargado (len):', dataUrl.length);
			return dataUrl;
		}

		const pngDataUrl = await blobToPngDataURLViaCanvas(blob);
		console.log('[generateQuotePdf] Logo convertido a PNG (len):', pngDataUrl.length);
		return pngDataUrl;
	} catch (err) {
		console.warn('[generateQuotePdf] Excepción al cargar el logo:', err);
		return null;
	}
};

// --- tu lógica principal se mantiene igual --- //

export const generateQuotePdf = async (quote: IQuote, issuer?: any) => {
	const [{ pdf }, { default: QuotePdfDocument }] = await Promise.all([
		import('@react-pdf/renderer'),
		import('../../components/QuotePdfDocument'),
	]);

	// 1. Verificar si necesitamos cargar datos de la subsidiaria
	let state = store.getState();
	let company = getCompanyInfo(quote, state);

	console.log('[generateQuotePdf] company inicial:', {
		name: company.name,
		logoUrl: company.logoUrl,
	});

	if (quote.subsidiary_id && (!company.name || company.name === 'EcoTI')) {
		if (state.subEmpresa.detalle?.id !== quote.subsidiary_id) {
			await store.dispatch(fetchSubsidiariaDetail(quote.subsidiary_id) as any);
			state = store.getState();
			company = getCompanyInfo(quote, state);
			console.log('[generateQuotePdf] company tras fetchSubsidiariaDetail:', {
				name: company.name,
				logoUrl: company.logoUrl,
			});
		}
	}

	// 2. Pre-cargar el logo si existe
	let logoBase64: string | null = null;
	if (company.logoUrl) {
		if (String(company.logoUrl).startsWith('data:')) {
			logoBase64 = company.logoUrl;
			console.log('[generateQuotePdf] usando logo base64 directo (meta/logo_base_64)');
		} else {
			logoBase64 = await fetchImageAsDataUrl(company.logoUrl);
			console.log(
				'[generateQuotePdf] resultado fetchImageAsDataUrl length:',
				logoBase64?.length,
			);
		}
	}

	// 3. Generar PDF
	const blob = await pdf(
		<QuotePdfDocument
			quote={quote}
			company={company}
			logoBase64={logoBase64}
			issuer={issuer}
		/>,
	).toBlob();

	return blob;
};
