import { beforeEach, describe, expect, it, vi } from 'vitest';
import loadPdfMake from '../pdfMake.util';

/** Desde la 0.3 el build no trae fuentes: si no se registran, ningún PDF se puede generar. */

const pdfMakeModule = vi.hoisted(() => ({
	default: {
		createPdf: vi.fn(),
		addVirtualFileSystem: vi.fn(),
	} as unknown,
}));
const FONTS_VFS = vi.hoisted(() => ({ 'Roboto-Regular.ttf': 'AAEAAA==' }));

vi.mock('pdfmake/build/pdfmake', () => pdfMakeModule);
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: FONTS_VFS }));

const validPdfMake = {
	createPdf: vi.fn(),
	addVirtualFileSystem: vi.fn(),
};

describe('pdfMake.util', () => {
	beforeEach(() => {
		validPdfMake.addVirtualFileSystem.mockClear();
		pdfMakeModule.default = validPdfMake;
	});

	it('registra las fuentes Roboto antes de entregar pdfmake', async () => {
		const pdfMake = await loadPdfMake();

		expect(pdfMake).toBe(validPdfMake);
		expect(validPdfMake.addVirtualFileSystem).toHaveBeenCalledWith(FONTS_VFS);
	});

	it('falla con un mensaje claro si el módulo no tiene la forma esperada', async () => {
		pdfMakeModule.default = { createPdf: vi.fn() };

		await expect(loadPdfMake()).rejects.toThrow('No se pudo cargar el generador de PDF.');
	});
});
