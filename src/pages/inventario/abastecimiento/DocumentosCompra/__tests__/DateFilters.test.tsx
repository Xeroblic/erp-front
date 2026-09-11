import { useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DocumentosCompraFilters from '@/pages/inventario/abastecimiento/DocumentosCompra/components/filters/DocumentosCompraFilters';
import RecepcionesFilters from '@/pages/inventario/abastecimiento/Recepciones/components/filters/RecepcionesFilters';

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));

const noop = () => undefined;

const FiltersHarness = ({
	kind,
	onCommit,
}: {
	kind: 'documents' | 'receipts';
	onCommit: (value: string) => void;
}) => {
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const common = {
		search: '',
		onSearchChange: noop,
		status: 'all' as const,
		statusOptions: [],
		onStatusChange: noop,
		onClearFilters: () => {
			setFrom('');
			setTo('');
		},
	};
	const changeFrom = (value: string) => {
		onCommit(value);
		setFrom(value);
	};
	const changeTo = (value: string) => {
		onCommit(value);
		setTo(value);
	};
	return kind === 'documents' ? (
		<DocumentosCompraFilters
			search={common.search}
			onSearchChange={common.onSearchChange}
			status={common.status}
			statusOptions={common.statusOptions}
			onStatusChange={common.onStatusChange}
			onClearFilters={common.onClearFilters}
			documentType='all'
			documentTypeOptions={[]}
			onDocumentTypeChange={noop}
			receptionStatus='all'
			receptionStatusOptions={[]}
			onReceptionStatusChange={noop}
			issuedFrom={from}
			onIssuedFromChange={changeFrom}
			issuedTo={to}
			onIssuedToChange={changeTo}
		/>
	) : (
		<RecepcionesFilters
			search={common.search}
			onSearchChange={common.onSearchChange}
			status={common.status}
			statusOptions={common.statusOptions}
			onStatusChange={common.onStatusChange}
			onClearFilters={common.onClearFilters}
			warehouseId=''
			onWarehouseIdChange={noop}
			receivedFrom={from}
			onReceivedFromChange={changeFrom}
			receivedTo={to}
			onReceivedToChange={changeTo}
		/>
	);
};

const cases = [
	{ kind: 'documents', label: 'Emisión desde' },
	{ kind: 'documents', label: 'Emisión hasta' },
	{ kind: 'receipts', label: 'Recepción desde' },
	{ kind: 'receipts', label: 'Recepción hasta' },
] as const;

describe('Fechas de filtros de abastecimiento', () => {
	it.each(cases)(
		'$label sólo aplica una fecha completa válida o el borrado',
		({ kind, label }) => {
			const onCommit = vi.fn();
			const store = configureStore({
				reducer: { auth: () => ({ loading: false, user: null }) },
			});
			render(
				<Provider store={store}>
					<FiltersHarness kind={kind} onCommit={onCommit} />
				</Provider>,
			);
			const input = screen.getByRole('textbox', { name: label });
			['1', '11', '110', '1109', '11092', '110920', '1109202'].forEach((draft) => {
				fireEvent.change(input, { target: { value: draft } });
				expect(onCommit).not.toHaveBeenCalled();
			});
			expect(input).toHaveValue('11-09-202');
			fireEvent.change(input, { target: { value: '11092026' } });
			expect(onCommit).toHaveBeenLastCalledWith('2026-09-11');
			expect(onCommit).toHaveBeenCalledTimes(1);
			expect(input).toHaveValue('11-09-2026');

			['1', '31-02-2026'].forEach((draft) => {
				fireEvent.change(input, { target: { value: draft } });
				expect(onCommit).toHaveBeenCalledTimes(1);
				fireEvent.blur(input);
				expect(input).toHaveValue('11-09-2026');
			});
			fireEvent.change(input, { target: { value: '29-02-2024' } });
			expect(onCommit).toHaveBeenLastCalledWith('2024-02-29');
			fireEvent.change(input, { target: { value: '' } });
			expect(onCommit).toHaveBeenLastCalledWith('');
			expect(input).toHaveValue('');

			fireEvent.change(input, { target: { value: '11-09-2026' } });
			fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
			expect(input).toHaveValue('');
			const committedCount = onCommit.mock.calls.length;
			fireEvent.change(input, { target: { value: '1' } });
			fireEvent.blur(input);
			expect(input).toHaveValue('');
			expect(onCommit).toHaveBeenCalledTimes(committedCount);
		},
	);
});
