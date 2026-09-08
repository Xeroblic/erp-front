import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Step2FullReview from '../Step2FullReview';

/**
 * B2: el autosave ya aceptaba el contexto de subsidiaría, pero `handleFormSubmit`
 * seguía exigiendo `branchId` y no lo propagaba al thunk. Un técnico con subsidiaría
 * y sin sucursal activa guardaba borradores pero no podía cerrar la revisión.
 */
const { dispatch, updateItemDetails, currentBranch, formRouterState, toastError } = vi.hoisted(
	() => ({
		dispatch: vi.fn(),
		updateItemDetails: vi.fn(),
		currentBranch: {
			value: { branchId: null as number | null, subsidiaryId: 42 as number | null },
		},
		formRouterState: {
			onSubmit: undefined as undefined | ((data: Record<string, unknown>) => Promise<void>),
		},
		toastError: vi.fn(),
	}),
);

vi.mock('@/store', () => ({ useAppDispatch: () => dispatch }));
vi.mock('@/store/slices/technicalReviews', () => ({ updateItemDetails }));
vi.mock('react-toastify', () => ({
	toast: { error: toastError, info: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => currentBranch.value,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));
vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<button type='button'>{children}</button>
	),
}));
vi.mock('../../../../hooks/useAutoSave', () => ({
	default: () => ({
		saveNow: vi.fn(),
		isSaving: false,
		lastSavedAt: null,
		showIdleSaveModal: false,
		dismissIdleSaveModal: vi.fn(),
	}),
}));
vi.mock('../../../../hooks/useReviewValidationSchema', () => ({
	default: () => ({ schema: null, isLoading: false, error: null, retry: vi.fn() }),
}));
vi.mock('../../../../components/modals/AutoSaveConfirmModal', () => ({ default: () => null }));
vi.mock('../../../../components/modals/PrefillReviewModal', () => ({ default: () => null }));
vi.mock('../../../../components/forms/shared/gallery/ReviewPhotosContext', () => ({
	ReviewPhotosProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../../../components/forms', () => ({
	default: ({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => Promise<void> }) => {
		formRouterState.onSubmit = onSubmit;
		return null;
	},
}));

const renderReview = () =>
	render(
		<Step2FullReview
			equipmentType='notebook'
			serialNumber='SN-1'
			initialData={{ id: 7, details: {} }}
			onBack={() => undefined}
			onComplete={() => Promise.resolve()}
		/>,
	);

describe('Step2FullReview final submit', () => {
	beforeEach(() => {
		dispatch.mockReset().mockReturnValue({ unwrap: () => Promise.resolve({}) });
		updateItemDetails.mockReset().mockImplementation((payload: unknown) => payload);
		toastError.mockReset();
		formRouterState.onSubmit = undefined;
		currentBranch.value = { branchId: null, subsidiaryId: 42 };
	});

	it('closes the review with the subsidiary context when there is no active branch', async () => {
		renderReview();

		await act(async () => {
			await formRouterState.onSubmit?.({ brand: 'Lenovo' });
		});

		expect(toastError).not.toHaveBeenCalled();
		expect(updateItemDetails).toHaveBeenCalledWith(
			expect.objectContaining({
				branchId: null,
				subsidiaryId: 42,
				itemId: 7,
			}),
		);
	});

	it('propagates the branch context when it is the one available', async () => {
		currentBranch.value = { branchId: 5, subsidiaryId: null };
		renderReview();

		await act(async () => {
			await formRouterState.onSubmit?.({ brand: 'Lenovo' });
		});

		expect(updateItemDetails).toHaveBeenCalledWith(
			expect.objectContaining({ branchId: 5, subsidiaryId: null, itemId: 7 }),
		);
	});

	it('still refuses to save without any organizational context', async () => {
		currentBranch.value = { branchId: null, subsidiaryId: null };
		renderReview();

		await act(async () => {
			await formRouterState.onSubmit?.({ brand: 'Lenovo' });
		});

		expect(updateItemDetails).not.toHaveBeenCalled();
		expect(toastError).toHaveBeenCalledWith('No se pudo identificar el item para guardar');
	});
});
