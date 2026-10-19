import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentAttachmentsCard from '../DocumentAttachmentsCard';

const authorizationCalls = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const authorizationState = vi.hoisted(() => ({ hasAccess: false }));
const addFiles = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: (input: Record<string, unknown>) => {
			authorizationCalls.push(input);
			return authorizationState.hasAccess;
		},
	}),
}));

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
}));

vi.mock('../../../hooks/useDocumentAttachments', () => ({
	default: () => ({
		attachments: [],
		meta: null,
		page: 1,
		onPageChange: vi.fn(),
		loading: false,
		listError: null,
		uploadError: null,
		clearUploadError: vi.fn(),
		uploadQueue: [],
		isUploading: false,
		deletingId: null,
		downloadingId: null,
		isQuotaReached: false,
		addFiles,
		retryUpload: vi.fn(),
		retryAllFailedUploads: vi.fn(),
		dismissUpload: vi.fn(),
		removeAttachment: vi.fn(),
		downloadAttachment: vi.fn(),
	}),
}));

describe('DocumentAttachmentsCard — permiso de adjuntos', () => {
	beforeEach(() => {
		authorizationCalls.length = 0;
		authorizationState.hasAccess = false;
		addFiles.mockClear();
	});

	it('no entrega archivos soltados al callback cuando falta edit-purchase-document en el scope activo', () => {
		render(
			<DocumentAttachmentsCard
				documentId={42}
				documentStatus='draft'
				subsidiaryId={4}
				branchId={7}
				onChanged={vi.fn()}
			/>,
		);

		const file = new File(['contenido'], 'respaldo.pdf', { type: 'application/pdf' });
		fireEvent.drop(screen.getByTestId('attachments-drop-zone'), {
			dataTransfer: { types: ['Files'], files: [file] },
		});

		expect(addFiles).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Seleccionar archivos adjuntos')).toBeDisabled();
		expect(authorizationCalls).toContainEqual({
			permission: 'edit-purchase-document',
			branchId: 7,
			subsidiaryId: 4,
			scope: 'access',
		});
	});
});
