import React from 'react';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { useReviewAttributes } from '../hooks/useReviewAttributes';
import PortsSection from '../sections/PortsSection';
import type { ReviewData } from '../types';

/**
 * La pestaña de atributos importa una revisión real al spec del producto. Los campos
 * estructurados de ZF-98 no estaban en la lista de importación ni en el editor, así que
 * una revisión con desglose de puertos se copiaba sin él y sin aviso.
 */
const wrapper = ({ children }: { children: React.ReactNode }) => (
	<Formik initialValues={{ product_type: 'notebook', attributes_json: {} }} onSubmit={vi.fn()}>
		{children}
	</Formik>
);

describe('importFromReview', () => {
	it('conserva el desglose de puertos y la cubierta del teclado', async () => {
		const { result } = renderHook(() => useReviewAttributes(), { wrapper });

		act(() => {
			result.current.importFromReview({
				all_ports_functional: false,
				defective_ports_count: 3,
				defective_port_types: { hdmi: 2, usb_c: 1 },
				loose_ports_count: 2,
				loose_port_types: { rj45: 2 },
				keyboard_cover_condition: 'cracked',
			});
		});

		await waitFor(() => {
			expect(result.current.reviewData.defective_port_types).toEqual({ hdmi: 2, usb_c: 1 });
		});
		expect(result.current.reviewData.loose_port_types).toEqual({ rj45: 2 });
		expect(result.current.reviewData.loose_ports_count).toBe(2);
		expect(result.current.reviewData.keyboard_cover_condition).toBe('cracked');
	});

	/** Las revisiones anteriores al contrato guardaron una lista de tipos, no un mapa. */
	it('normaliza el desglose que una revisión vieja guardó como lista', async () => {
		const { result } = renderHook(() => useReviewAttributes(), { wrapper });

		act(() => {
			result.current.importFromReview({
				loose_port_types: ['hdmi', 'hdmi', 'usb_c'],
			});
		});

		await waitFor(() => {
			expect(result.current.reviewData.loose_port_types).toEqual({ hdmi: 2, usb_c: 1 });
		});
	});

	/** `{}` es «se midió, ninguno»: se conserva. `null` es «no se midió»: se omite. */
	it('distingue un desglose medido y vacío de uno que nunca se midió', async () => {
		const { result } = renderHook(() => useReviewAttributes(), { wrapper });

		act(() => {
			result.current.importFromReview({
				loose_port_types: {},
				defective_port_types: null,
			});
		});

		await waitFor(() => {
			expect(result.current.reviewData.loose_port_types).toEqual({});
		});
		expect(result.current.reviewData).not.toHaveProperty('defective_port_types');
	});
});

type TestState = Record<string, never>;

const createTestStore = () =>
	configureStore<TestState>({
		reducer: (state: TestState = {} as TestState): TestState => state,
	});

describe('PortsSection', () => {
	// Los inputs del Design System leen la personalización del store; ningún dato de ese
	// slice cambia lo que esta prueba verifica, así que basta con que el Provider exista.
	const renderSection = (data: ReviewData) => {
		const updateField = vi.fn();
		render(
			<Provider store={createTestStore()}>
				<PortsSection data={data} updateField={updateField} productKind='notebook' />
			</Provider>,
		);
		return updateField;
	};

	const breakdown = (name: RegExp) => screen.getByRole('group', { name });

	it('deriva el total de defectuosos del desglose', () => {
		const updateField = renderSection({
			all_ports_functional: false,
			defective_ports_count: 3,
			defective_port_types: { hdmi: 2 },
		});

		expect(screen.getByText('Puertos defectuosos: 2')).toBeVisible();

		fireEvent.click(
			within(breakdown(/Qué puertos están defectuosos/)).getByRole('button', {
				name: 'Incrementar USB-C',
			}),
		);

		expect(updateField).toHaveBeenCalledWith('defective_port_types', { hdmi: 2, usb_c: 1 });
		expect(updateField).toHaveBeenCalledWith('defective_ports_count', 3);
	});

	/** Sin desglose importado manda el total guardado, y sigue siendo editable a mano. */
	it('usa el total guardado mientras el desglose no exista', () => {
		renderSection({ all_ports_functional: false, defective_ports_count: 3 });

		expect(screen.getByText('Puertos defectuosos: 3')).toBeVisible();
		expect(screen.getByRole('spinbutton', { name: /Puertos defectuosos/ })).toBeVisible();
	});

	/** Con el desglose presente el total deja de escribirse a mano: no puede contradecirlo. */
	it('deja de ofrecer el total a mano cuando el desglose manda', () => {
		renderSection({
			all_ports_functional: false,
			defective_ports_count: 2,
			defective_port_types: { hdmi: 2 },
		});

		expect(
			screen.queryByRole('spinbutton', { name: /Puertos defectuosos/ }),
		).not.toBeInTheDocument();
	});

	it('registra los puertos sueltos aunque todos funcionen', () => {
		const updateField = renderSection({ all_ports_functional: true });

		fireEvent.click(
			within(breakdown(/Qué puertos están sueltos/)).getByRole('button', {
				name: 'Incrementar RJ45',
			}),
		);

		expect(updateField).toHaveBeenCalledWith('loose_port_types', { rj45: 1 });
		expect(updateField).toHaveBeenCalledWith('loose_ports_count', 1);
	});
});
