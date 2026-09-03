import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import EquipmentFormRouter from '..';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

// La primera sección de los cinco formularios pide las marcas al store. La navegación a
// «Puertos» pasa por ella, y el catálogo de marcas no tiene nada que ver con lo que esta
// prueba verifica.
vi.mock('@/pages/catalogos/marcas/components/hooks/useMarcas', () => ({
	useMarcas: () => ({ brands: [], loading: false }),
}));

/**
 * El schema de puertos llega del endpoint y tiene que atravesar el router y el formulario
 * completo hasta `PortConditionFields`. La prueba de las secciones no lo cubre: monta cada
 * sección directamente y le inyecta `schemaFields`, así que AIO, docking y monitor pasaban
 * verdes mientras sus formularios descartaban la prop en el flujo real.
 *
 * Los textos del fixture no existen en ninguna constante local: si el formulario pierde el
 * schema, el respaldo local deja los controles en pantalla pero ninguno de estos aparece.
 */
const REMOTE_SCHEMA: ITechnicalReviewSchema = {
	defective_ports_count: {
		type: 'integer',
		label: 'Puertos defectuosos del endpoint',
		hint: 'Hint remoto de puertos defectuosos.',
	},
	defective_port_types: {
		type: 'object',
		label: 'Qué puertos están defectuosos según el endpoint',
		allowed_keys: ['hdmi', 'usb_c'],
		options: [
			{ value: 'hdmi', label: 'HDMI' },
			{ value: 'usb_c', label: 'USB-C' },
		],
	},
	loose_ports_count: {
		type: 'integer',
		label: 'Puertos sueltos del endpoint',
		derived_from: 'loose_port_types',
		hint: 'Hint remoto: el total lo calcula el servidor.',
		warning: 'Advertencia remota de techo de grado.',
	},
	loose_port_types: {
		type: 'object',
		label: 'Qué puertos están sueltos según el endpoint',
		allowed_keys: ['hdmi', 'usb_c'],
		options: [
			{ value: 'hdmi', label: 'HDMI' },
			{ value: 'usb_c', label: 'USB-C' },
		],
	},
};

/** Los dos desgloses abiertos desde el arranque, sin depender de la navegación. */
const OPEN_BREAKDOWNS = {
	all_ports_functional: false,
	defective_port_types: {},
	loose_port_types: { hdmi: 1 },
};

const EQUIPMENT_TYPES = ['notebook', 'desktop', 'aio', 'docking', 'monitor'];

/**
 * La primera sección lee personalización y autorización del store. Nada de eso cambia lo
 * que esta prueba verifica, así que el store es fijo y mínimo: sólo lo que esos hooks
 * necesitan para renderizar.
 */
interface TestState {
	auth: { loading: boolean; user: null };
}

const STORE_STATE: TestState = { auth: { loading: false, user: null } };

const createTestStore = () =>
	configureStore<TestState>({ reducer: (state: TestState = STORE_STATE): TestState => state });

const renderPortsSection = (equipmentType: string, schemaFields?: ITechnicalReviewSchema) =>
	render(
		<Provider store={createTestStore()}>
			<EquipmentFormRouter
				equipmentType={equipmentType}
				defaultValues={OPEN_BREAKDOWNS}
				onSubmit={vi.fn()}
				onBack={vi.fn()}
				initialSectionKey='ports'
				schemaFields={schemaFields}
			/>
		</Provider>,
	);

/**
 * El salto a la sección de puertos ocurre en un efecto y la transición de `FormShell` va
 * envuelta en framer-motion, que deja el contenedor en `opacity: 0` mientras anima. Por eso
 * las aserciones son de presencia: en jsdom la animación no avanza y `toBeVisible()`
 * mediría el efecto visual, no la propagación del schema.
 */
const findText = (text: RegExp, selector?: string) => screen.findByText(text, { selector });

describe('el schema del endpoint llega a los puertos de los cinco formularios', () => {
	EQUIPMENT_TYPES.forEach((equipmentType) => {
		describe(equipmentType, () => {
			it('usa los rótulos de los desgloses que publica el endpoint', async () => {
				renderPortsSection(equipmentType, REMOTE_SCHEMA);

				expect(
					await screen.findByRole('group', {
						name: /Qué puertos están sueltos según el endpoint/,
					}),
				).toBeInTheDocument();
				expect(
					screen.getByRole('group', {
						name: /Qué puertos están defectuosos según el endpoint/,
					}),
				).toBeInTheDocument();
			});

			it('muestra los hints que explican el total derivado', async () => {
				renderPortsSection(equipmentType, REMOTE_SCHEMA);

				expect(
					await findText(/Hint remoto: el total lo calcula el servidor/),
				).toBeInTheDocument();
				expect(screen.getByText(/Hint remoto de puertos defectuosos/)).toBeInTheDocument();
			});

			/** Con `v2` el backend agrega la advertencia de grado; hoy no llegaría. */
			it('muestra la advertencia dinámica del schema', async () => {
				renderPortsSection(equipmentType, REMOTE_SCHEMA);

				expect(await findText(/Advertencia remota de techo de grado/)).toBeInTheDocument();
			});

			it('rotula los totales con el label del endpoint', async () => {
				renderPortsSection(equipmentType, REMOTE_SCHEMA);

				expect(await findText(/Puertos sueltos del endpoint: 1/, 'p')).toBeInTheDocument();
				expect(
					screen.getByText(/Puertos defectuosos del endpoint: 0/, { selector: 'p' }),
				).toBeInTheDocument();
			});
		});
	});

	/** Sin schema el formulario sigue en pie, pero con el catálogo local completo. */
	it('cae al catálogo local cuando el endpoint no publica el schema', async () => {
		renderPortsSection('docking');

		const breakdown = await screen.findByRole('group', {
			name: /Qué puertos están sueltos/,
		});
		expect(
			within(breakdown).getByRole('button', { name: 'Incrementar Puerto de carga' }),
		).toBeInTheDocument();
		expect(screen.queryByText(/Advertencia remota de techo de grado/)).not.toBeInTheDocument();
	});
});
