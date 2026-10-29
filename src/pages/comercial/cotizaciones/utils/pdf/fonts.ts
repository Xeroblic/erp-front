// import * as pdfFonts from "pdfmake/build/vfs_fonts";

// export const pdfFontsVfs = pdfFonts.vfs;

// export const pdfFontsConfig = {
//     Roboto: {
//         normal: "Roboto-Regular.ttf",
//         bold: "Roboto-Bold.ttf",
//         italics: "Roboto-Italic.ttf",
//         bolditalics: "Roboto-BoldItalic.ttf",
//     }
// };

// utils/pdf/fonts.ts
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

interface PdfMakeInstance {
	vfs?: Record<string, string>;
	[key: string]: unknown;
}

export const loadPdfFonts = (pdfMake: PdfMakeInstance): void => {
	if (!pdfFonts?.vfs) {
		return;
	}
	pdfMake.vfs = pdfFonts.vfs;
};
