import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import {
	filterTechnicalReviewPayload,
	HARDWARE_NULLABLE_FIELDS,
} from '@/utils/technicalReviewHardware';
import type { DockingFormData } from '../../validation/docking.schema';
import DockingExtrasSection from '../docking/sections/DockingExtrasSection';
import EquipmentFormRouter from '..';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

// La primera sección del formulario pide las marcas al store; el salto a «Extras» pasa por
// ella y el catálogo no tiene nada que ver con lo que estas pruebas verifican.
vi.mock('@/pages/catalogos/marcas/components/hooks/useMarcas', () => ({
	useMarcas: () => ({ brands: [], loading: false }),
}));

// `Textarea` lee el tema desde el store; la sección se prueba sin Provider.
vi.mock('@/components/form/Textarea', () => ({
	default: React.forwardRef<HTMLTextAreaElement, Record<string, unknown>>((props, ref) => (
		<textarea ref={ref} {...props} />
	)),
}));

vi.mock('@/components/form/Checkbox', () => ({
	default: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
		<input type='checkbox' checked={checked} onChange={onChange} />
	),
}));

/**
 * Lo que publica `TechnicalReviewValidationSchemaService` para docking. Las etiquetas y el
 * hint cambian según si las reglas v2 están activas, así que la prueba usa las de v2 para
 * comprobar que el formulario pinta las del backend y no unas locales.
 */
const DOCKING_SCHEMA: ITechnicalReviewSchema = {
	lock_area_condition: {
		type: 'string',
		label: 'Estado del candado',
		group: 'Carcasa',
		allowed_values: ['ok', 'missing_key', 'worn', 'locked'],
		options: [
			{ value: 'ok', label: 'Sin observaciones' },
			{ value: 'missing_key', label: 'Sin llave (no afecta el grado)' },
			{ value: 'worn', label: 'Sector del candado con desgaste (Limita a: Máximo Grado C)' },
			{ value: 'locked', label: 'Candado puesto, equipo bloqueado (Limita a: Grado M)' },
		],
		hint: 'Sin llave a secas es un accesorio faltante y no baja el grado; el desgaste del sector sí',
	},
};

const renderExtras = (schemaFields?: ITechnicalReviewSchema) => {
	const values: { current?: () => DockingFormData } = {};

	const Harness = () => {
		const form = useForm<DockingFormData>({ defaultValues: {} });
		values.current = form.getValues;
		return (
			<DockingExtrasSection
				control={form.control}
				errors={form.formState.errors}
				readOnly={false}
				watch={form.watch}
				setValue={form.setValue}
				schemaFields={schemaFields}
			/>
		);
	};

	render(<Harness />);
	return values;
};

const lockAreaGroup = () => screen.getByRole('radiogroup', { name: /Estado del candado/ });

describe('ZF-99 — estado del candado en docking', () => {
	/**
	 * Los tres casos «malos» se escribían en la misma frase de observaciones y significan
	 * cosas distintas: sin las cuatro opciones separadas el motor no puede distinguirlos.
	 */
	it('ofrece los cuatro estados con las etiquetas que publica el backend', () => {
		renderExtras(DOCKING_SCHEMA);

		const options = within(lockAreaGroup()).getAllByRole('radio');

		expect(options.map((option) => option.dataset.value)).toEqual([
			'ok',
			'missing_key',
			'worn',
			'locked',
		]);
		expect(
			within(lockAreaGroup()).getByRole('radio', { name: 'Sin llave (no afecta el grado)' }),
		).toBeInTheDocument();
		expect(screen.getByText(/no baja el grado/)).toBeInTheDocument();
	});

	it('guarda el estado elegido en el formulario', () => {
		const values = renderExtras(DOCKING_SCHEMA);

		fireEvent.click(
			within(lockAreaGroup()).getByRole('radio', {
				name: 'Candado puesto, equipo bloqueado (Limita a: Grado M)',
			}),
		);

		expect(values.current?.().lock_area_condition).toBe('locked');
	});

	/**
	 * El campo no tiene constante local: inventar los valores produciría un 422. Sin schema
	 * remoto —backend sin la fase F4, endpoint caído o usuario sin sucursal ni subsidiaría—
	 * el bloque no se muestra y el resto de la sección sigue siendo usable.
	 */
	it('no se muestra cuando el backend no lo publica', () => {
		renderExtras();

		expect(screen.queryByRole('radiogroup', { name: /Estado del candado/ })).toBeNull();
		expect(screen.getByText('Condición de Carcasa')).toBeInTheDocument();
	});

	/** Un backend que publique el campo sin `required` no debe pintar el asterisco. */
	it('no lo marca obligatorio mientras el backend no lo exija', () => {
		renderExtras(DOCKING_SCHEMA);

		expect(lockAreaGroup()).toHaveAttribute('aria-required', 'false');
	});
});

/**
 * El formulario completo, no la sección suelta.
 *
 * Montar la sección e inyectarle `schemaFields` es justo lo que dejó pasar el defecto B2
 * del PR #184: AIO, docking y monitor pasaban verdes mientras sus formularios descartaban
 * la prop en el flujo real. Y el autoguardado no lee el resultado de Yup sino `watch()`
 * crudo, así que un valor escrito con `setValue` sobre un campo sin `register` tiene que
 * verificarse por esa vía, no por la del submit.
 */
describe('ZF-99 — el candado en el flujo real del formulario de docking', () => {
	interface TestState {
		auth: { loading: boolean; user: null };
	}

	const STORE_STATE: TestState = { auth: { loading: false, user: null } };

	const createTestStore = () =>
		configureStore<TestState>({
			reducer: (state: TestState = STORE_STATE): TestState => state,
		});

	const renderDockingForm = () => {
		const getters: { current?: () => Record<string, unknown> } = {};

		render(
			<Provider store={createTestStore()}>
				<EquipmentFormRouter
					equipmentType='docking'
					defaultValues={{}}
					onSubmit={vi.fn()}
					onBack={vi.fn()}
					initialSectionKey='extras'
					schemaFields={DOCKING_SCHEMA}
					registerGetFormValues={(getter) => {
						getters.current = getter;
					}}
				/>
			</Provider>,
		);

		return getters;
	};

	it('propaga el schema del endpoint hasta la sección de extras', async () => {
		renderDockingForm();

		expect(
			await screen.findByRole('radiogroup', { name: /Estado del candado/ }),
		).toBeInTheDocument();
	});

	/**
	 * Las dos vías del autoguardado (inactividad y cambio de sección) leen el mismo getter
	 * que `DockingForm` registra, y el payload pasa por `filterTechnicalReviewPayload`
	 * antes del PATCH. Docking no tiene el flujo «No enciende» (`onDirectSubmit`), así que
	 * con el submit final quedan cubiertas sus tres rutas de escritura.
	 */
	it('deja el valor elegido en el payload que envía el autoguardado', async () => {
		const getters = renderDockingForm();

		const group = await screen.findByRole('radiogroup', { name: /Estado del candado/ });
		fireEvent.click(
			within(group).getByRole('radio', {
				name: 'Sector del candado con desgaste (Limita a: Máximo Grado C)',
			}),
		);

		const values = getters.current?.() ?? {};
		expect(values.lock_area_condition).toBe('worn');
		expect(
			filterTechnicalReviewPayload(values, HARDWARE_NULLABLE_FIELDS).lock_area_condition,
		).toBe('worn');
	});
});
