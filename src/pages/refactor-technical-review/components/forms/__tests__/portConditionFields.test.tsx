import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { MAX_PORT_TYPE_COUNT, MAX_PORTS_TOTAL } from '../../validation/constants/ports.rules';
import type { FormSectionProps } from '../shared/types';
import { AioPortsSection } from '../aio/sections/AioPortsSection';
import DesktopPortsSection from '../desktop/sections/DesktopPortsSection';
import { DockingPortsSection } from '../docking/sections/DockingPortsSection';
import { MonitorPortsSection } from '../monitor/sections/MonitorPortsSection';
import PortsSection from '../notebook/sections/PortsSection';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

/**
 * Los tres campos de puertos existen en los cinco tipos de equipo, así que las aserciones
 * corren sobre los cinco: el trabajo nació porque «puerto suelto» resultó ser el predictor
 * más limpio del dataset de producción y no había dónde registrarlo.
 *
 * El desglose es un mapa `{tipo: cantidad}`: un contador por tipo, igual que la grilla de
 * puertos del equipo. El total de sueltos lo calcula el servidor y no se envía.
 */
const REMOTE_SCHEMA: ITechnicalReviewSchema = {
	defective_ports_count: {
		type: 'integer',
		label: 'Puertos defectuosos',
		hint: 'IMPORTANTE: Solo 1 puerto dañado = Máximo Grado C.',
	},
	loose_ports_count: {
		type: 'integer',
		label: 'Puertos sueltos',
		derived_from: 'loose_port_types',
		hint: 'Total derivado: no lo envíes, lo calcula el servidor.',
		warning: 'Con 2 o más puertos sueltos el equipo será categoría M',
	},
	loose_port_types: {
		type: 'object',
		label: 'Qué puertos están sueltos',
		allowed_keys: ['hdmi', 'usb_c'],
		value_type: 'integer',
		value_min: 1,
		value_max: 4,
		options: [
			{ value: 'hdmi', label: 'HDMI' },
			{ value: 'usb_c', label: 'USB-C' },
		],
	},
	defective_port_types: {
		type: 'object',
		label: 'Qué puertos están defectuosos',
		allowed_keys: ['hdmi', 'usb_c'],
		value_type: 'integer',
		value_min: 1,
		value_max: 4,
		options: [
			{ value: 'hdmi', label: 'HDMI' },
			{ value: 'usb_c', label: 'USB-C' },
		],
	},
};

/** En monitor el campo no puntúa, así que el backend no publica `warning`. */
const MONITOR_SCHEMA: ITechnicalReviewSchema = {
	...REMOTE_SCHEMA,
	loose_ports_count: {
		type: 'integer',
		label: 'Puertos sueltos',
		derived_from: 'loose_port_types',
		hint: 'Se registra para seguimiento; hoy no modifica el grado.',
	},
};

type AnySection = React.ComponentType<FormSectionProps<FieldValues>>;

const asSection = (section: unknown): AnySection => section as AnySection;

interface RenderOptions {
	schemaFields?: ITechnicalReviewSchema;
	readOnly?: boolean;
	defaultValues?: FieldValues;
}

const renderSection = (Section: AnySection, options: RenderOptions = {}) => {
	let form: UseFormReturn<FieldValues> | undefined;

	const Harness = () => {
		const hookForm = useForm<FieldValues>({ defaultValues: options.defaultValues ?? {} });
		form = hookForm;
		return (
			<Section
				control={hookForm.control}
				errors={hookForm.formState.errors}
				readOnly={options.readOnly ?? false}
				watch={hookForm.watch}
				setValue={hookForm.setValue}
				schemaFields={'schemaFields' in options ? options.schemaFields : REMOTE_SCHEMA}
			/>
		);
	};

	render(<Harness />);
	return () => form as UseFormReturn<FieldValues>;
};

const question = (name: RegExp) => screen.getByText(name).parentElement as HTMLElement;

const answer = (name: RegExp, value: 'Sí' | 'No') => {
	fireEvent.click(within(question(name)).getByRole('radio', { name: value }));
};

const looseBreakdown = () => screen.getByRole('group', { name: /Qué puertos están sueltos/ });
const defectiveBreakdown = () =>
	screen.getByRole('group', { name: /Qué puertos están defectuosos/ });

/** Sube el contador de un tipo dentro de un desglose concreto. */
const increment = (group: HTMLElement, portLabel: string, times = 1) => {
	for (let step = 0; step < times; step += 1) {
		fireEvent.click(within(group).getByRole('button', { name: `Incrementar ${portLabel}` }));
	}
};

/** Ancestro más cercano del desglose que además incluye su propia pregunta. */
const columnOf = (container: HTMLElement, questionText: RegExp): HTMLElement | null => {
	let node: HTMLElement | null = container;
	while (node && !questionText.test(node.textContent ?? '')) {
		node = node.parentElement;
	}
	return node;
};

const SECTIONS: Array<[string, AnySection]> = [
	['notebook', asSection(PortsSection)],
	['desktop', asSection(DesktopPortsSection)],
	['aio', asSection(AioPortsSection)],
	['docking', asSection(DockingPortsSection)],
	['monitor', asSection(MonitorPortsSection)],
];

describe('port condition questions', () => {
	SECTIONS.forEach(([name, Section]) => {
		describe(name, () => {
			it('asks separately for defective and loose ports', () => {
				renderSection(Section);

				expect(screen.getByText(/¿Hay puertos defectuosos\?/)).toBeVisible();
				expect(screen.getByText(/¿Hay puertos sueltos\?/)).toBeVisible();
				expect(screen.queryByText(/Todos los Puertos Funcionan/)).not.toBeInTheDocument();
			});

			it('opens only the loose breakdown, leaving the defective one closed', () => {
				renderSection(Section);

				answer(/¿Hay puertos sueltos\?/, 'Sí');

				expect(looseBreakdown()).toBeVisible();
				expect(
					screen.queryByRole('group', { name: /Qué puertos están defectuosos/ }),
				).not.toBeInTheDocument();
			});

			/**
			 * Con los contenedores en su propia grilla, activar sólo «sueltos» lo dejaba en la
			 * primera columna, debajo de la pregunta por los defectuosos, y se leía como si le
			 * perteneciera. Cada desglose tiene que quedar bajo su propia pregunta.
			 */
			it('keeps each breakdown under its own question', () => {
				renderSection(Section, { defaultValues: { loose_port_types: { hdmi: 1 } } });

				const column = columnOf(looseBreakdown(), /¿Hay puertos sueltos\?/);

				expect(column).not.toBeNull();
				expect(column?.textContent).not.toMatch(/¿Hay puertos defectuosos\?/);
			});

			/**
			 * Registrar un puerto suelto no debe obligar a declarar puertos defectuosos: el
			 * puerto suelto funciona. Antes eso era imposible, porque el único detalle colgaba
			 * de responder que no todos los puertos funcionan.
			 */
			it('records loose ports without touching all_ports_functional', () => {
				const getForm = renderSection(Section);

				answer(/¿Hay puertos sueltos\?/, 'Sí');
				increment(looseBreakdown(), 'HDMI');

				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 1 });
				expect(getForm().getValues('all_ports_functional')).toBeUndefined();
			});

			/** Un `{}` ya guardado es «se midió, ninguno»: la respuesta es «no» y no se abre. */
			it('reads a stored empty breakdown as a no', () => {
				renderSection(Section, { defaultValues: { loose_port_types: {} } });

				expect(
					within(question(/¿Hay puertos sueltos\?/)).getByRole('radio', { name: 'No' }),
				).toHaveAttribute('aria-checked', 'true');
				expect(
					screen.queryByRole('group', { name: /Qué puertos están sueltos/ }),
				).not.toBeInTheDocument();
			});

			/** «Sí» sin marcar nada todavía es `{}`: «se midió», no un puerto inventado. */
			it('does not invent a port when the question is answered yes', () => {
				const getForm = renderSection(Section);

				answer(/¿Hay puertos sueltos\?/, 'Sí');

				expect(getForm().getValues('loose_port_types')).toEqual({});
			});

			it('counts each port type separately, like the equipment port grid', () => {
				const getForm = renderSection(Section);

				answer(/¿Hay puertos sueltos\?/, 'Sí');
				const group = looseBreakdown();
				increment(group, 'HDMI', 2);
				increment(group, 'USB-C');

				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 2, usb_c: 1 });
			});

			/** Un tipo en cero se omite del mapa: el backend rechaza las cantidades menores a 1. */
			it('drops a port type instead of storing it as zero', () => {
				const getForm = renderSection(Section, {
					defaultValues: { loose_port_types: { hdmi: 1, usb_c: 2 } },
				});

				fireEvent.click(
					within(looseBreakdown()).getByRole('button', { name: 'Decrementar HDMI' }),
				);

				expect(getForm().getValues('loose_port_types')).toEqual({ usb_c: 2 });
			});

			/**
			 * El backend todavía publica `value_max: 10` (cuatro en este schema de prueba),
			 * pero esa validación está por retirarse y el tope lo fija el formulario: si el
			 * schema mandara, el técnico no podría registrar los puertos que sí tiene.
			 */
			it('keeps its own ceiling over the lower one the schema still publishes', () => {
				const getForm = renderSection(Section, {
					defaultValues: { loose_port_types: { hdmi: 4 } },
				});

				increment(looseBreakdown(), 'HDMI');

				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 5 });
			});

			it('caps each type at the ceiling the form defines', () => {
				renderSection(Section, {
					defaultValues: { loose_port_types: { hdmi: MAX_PORT_TYPE_COUNT } },
				});

				expect(
					within(looseBreakdown()).getByRole('button', { name: 'Incrementar HDMI' }),
				).toBeDisabled();
			});

			it('derives the defective total from its breakdown', () => {
				const getForm = renderSection(Section, {
					defaultValues: { all_ports_functional: false, defective_port_types: {} },
				});

				const group = defectiveBreakdown();
				increment(group, 'HDMI', 2);
				increment(group, 'USB-C');

				expect(getForm().getValues('defective_port_types')).toEqual({ hdmi: 2, usb_c: 1 });
				expect(getForm().getValues('defective_ports_count')).toBe(3);
			});

			it('clears the breakdown when the answer goes back to no', () => {
				const getForm = renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_ports_count: 3,
						defective_port_types: { hdmi: 3 },
						loose_port_types: { usb_c: 2 },
					},
				});

				answer(/¿Hay puertos defectuosos\?/, 'No');
				expect(getForm().getValues('all_ports_functional')).toBe(true);
				expect(getForm().getValues('defective_port_types')).toEqual({});
				expect(getForm().getValues('defective_ports_count')).toBe(0);

				answer(/¿Hay puertos sueltos\?/, 'No');
				expect(getForm().getValues('loose_port_types')).toEqual({});
			});

			it('falls back to the local port catalog when the backend publishes no schema', () => {
				renderSection(Section, {
					schemaFields: undefined,
					defaultValues: { all_ports_functional: false },
				});

				answer(/¿Hay puertos sueltos\?/, 'Sí');

				[looseBreakdown(), defectiveBreakdown()].forEach((group) => {
					expect(
						within(group).getAllByRole('button', { name: /^Incrementar / }),
					).toHaveLength(8);
					expect(
						within(group).getByRole('button', { name: 'Incrementar Puerto de carga' }),
					).toBeVisible();
				});
			});

			/**
			 * El backend sigue publicando DVI en `options` para otros clientes, pero esta
			 * operación dejó de manejar ese tipo de puerto: ofrecerlo sólo agrega ruido a
			 * una grilla que ya tiene ocho contadores por desglose.
			 */
			it('does not offer a port type the catalog no longer handles', () => {
				const withDvi: ITechnicalReviewSchema = {
					...REMOTE_SCHEMA,
					loose_port_types: {
						...REMOTE_SCHEMA.loose_port_types,
						options: [
							{ value: 'hdmi', label: 'HDMI' },
							{ value: 'dvi', label: 'DVI' },
						],
					},
				};

				renderSection(Section, {
					schemaFields: withDvi,
					defaultValues: { loose_port_types: { hdmi: 1 } },
				});

				expect(
					within(looseBreakdown()).queryByRole('button', { name: 'Incrementar DVI' }),
				).toBeNull();
				expect(
					within(looseBreakdown()).getByRole('button', { name: 'Incrementar HDMI' }),
				).toBeVisible();
			});

			/**
			 * El schema acota cada tipo pero no la suma, y el backend valida
			 * `defective_ports_count` con `max:10`: un desglose de once puertos hacía
			 * fallar el autoguardado con 422 sin que ningún contador se viera fuera de rango.
			 */
			it('keeps the breakdown within the total the backend accepts', () => {
				const getForm = renderSection(Section, {
					schemaFields: undefined,
					defaultValues: {
						all_ports_functional: false,
						defective_port_types: { hdmi: MAX_PORTS_TOTAL - 1, usb_c: 1 },
					},
				});

				const breakdown = defectiveBreakdown();
				expect(
					within(breakdown).getByRole('button', { name: 'Incrementar USB-A' }),
				).toBeDisabled();

				increment(breakdown, 'USB-A');
				expect(getForm().getValues('defective_port_types')).toEqual({
					hdmi: MAX_PORTS_TOTAL - 1,
					usb_c: 1,
				});

				// Bajar un puerto libera el presupuesto: el tope es del total, no del tipo.
				fireEvent.click(
					within(breakdown).getByRole('button', { name: 'Decrementar HDMI' }),
				);
				expect(
					within(defectiveBreakdown()).getByRole('button', { name: 'Incrementar USB-A' }),
				).toBeEnabled();
			});

			/**
			 * La grilla base llegaba a doce (dieciséis en aio, docking y monitor) y el
			 * desglose sólo a diez: se podían declarar más puertos buenos de los que
			 * después se podían marcar como malos. El techo lo fija el backend
			 * (`defective_ports_count` con `max:10`), así que ambos comparten ese número.
			 */
			it('offers the same ceiling for working and faulty ports', () => {
				renderSection(Section, {
					schemaFields: undefined,
					defaultValues: {
						all_ports_functional: false,
						hdmi_ports: MAX_PORT_TYPE_COUNT,
						defective_port_types: { hdmi: MAX_PORT_TYPE_COUNT },
					},
				});

				expect(
					within(defectiveBreakdown()).getByRole('button', { name: 'Incrementar HDMI' }),
				).toBeDisabled();

				const baseCounter = screen
					.getAllByRole('button', { name: /^Incrementar (HDMI|Puertos HDMI)$/ })
					.filter((button) => !defectiveBreakdown().contains(button));

				expect(baseCounter).toHaveLength(1);
				expect(baseCounter[0]).toBeDisabled();
			});

			it('does not change anything in read-only mode', () => {
				const getForm = renderSection(Section, {
					readOnly: true,
					defaultValues: { loose_port_types: { hdmi: 1 } },
				});

				increment(looseBreakdown(), 'HDMI');
				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 1 });

				answer(/¿Hay puertos defectuosos\?/, 'Sí');
				expect(getForm().getValues('all_ports_functional')).toBeUndefined();
			});
		});
	});

	/**
	 * En monitor el campo se guarda pero no tiene regla de scoring y el backend no manda
	 * `warning`. Anunciar ahí un techo de grado sería mentirle al técnico.
	 */
	it('announces the grade ceiling only where the backend publishes the warning', () => {
		renderSection(asSection(PortsSection), {
			defaultValues: { loose_port_types: { hdmi: 2 } },
		});

		expect(screen.getByText(/Con 2 o más puertos sueltos/)).toBeVisible();
	});

	it('does not announce a grade ceiling on monitor', () => {
		renderSection(asSection(MonitorPortsSection), {
			schemaFields: MONITOR_SCHEMA,
			defaultValues: { loose_port_types: { hdmi: 2 } },
		});

		expect(screen.queryByText(/Con 2 o más puertos sueltos/)).not.toBeInTheDocument();
		expect(screen.getByText(/no modifica el grado/)).toBeVisible();
	});
});
