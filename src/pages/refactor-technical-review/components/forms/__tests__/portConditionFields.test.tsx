import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
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
	fireEvent.click(within(question(name)).getByRole('button', { name: value }));
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
			/**
			 * Los nueve tipos del catálogo se cuentan en los cinco formularios. El backend
			 * genera los contadores desde un solo mapa para que el desglose de sueltos y
			 * defectuosos no vuelva a ofrecer un puerto que el equipo no declara.
			 */
			it('counts the nine port types of the catalog', () => {
				renderSection(Section);

				// Con los dos desgloses cerrados, los únicos contadores son los de la grilla.
				// El nueve es el del contrato, no `PORT_COUNTER_FIELDS.length`: comparar el
				// catálogo consigo mismo no detectaría que le falte un tipo.
				expect(screen.getAllByRole('button', { name: /^Incrementar / })).toHaveLength(9);
			});

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
				// Sigue en el «No» con que arranca la otra pregunta, no pasa a `false`.
				expect(getForm().getValues('all_ports_functional')).toBe(true);
			});

			/**
			 * Las dos preguntas arrancan en «No», y respondidas de verdad: sin valor en el
			 * formulario los campos no viajan en el PATCH, el servidor conserva lo que
			 * tuviera y el técnico se lleva la impresión contraria a lo que ve en pantalla.
			 */
			it('starts both questions answered as no', () => {
				const getForm = renderSection(Section);

				[/¿Hay puertos defectuosos\?/, /¿Hay puertos sueltos\?/].forEach((asked) => {
					expect(
						within(question(asked)).getByRole('button', { name: 'No' }),
					).toHaveAttribute('aria-pressed', 'true');
				});

				expect(getForm().getValues('all_ports_functional')).toBe(true);
				expect(getForm().getValues('loose_port_types')).toEqual({});
			});

			/** Una revisión ya respondida conserva lo suyo: el arranque no la pisa. */
			it('does not overwrite an answer the review already has', () => {
				const getForm = renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_port_types: { hdmi: 1 },
						loose_port_types: { usb_c: 2 },
					},
				});

				expect(getForm().getValues('all_ports_functional')).toBe(false);
				expect(getForm().getValues('loose_port_types')).toEqual({ usb_c: 2 });
			});

			/** Un `{}` ya guardado es «se midió, ninguno»: la respuesta es «no» y no se abre. */
			it('reads a stored empty breakdown as a no', () => {
				renderSection(Section, { defaultValues: { loose_port_types: {} } });

				expect(
					within(question(/¿Hay puertos sueltos\?/)).getByRole('button', { name: 'No' }),
				).toHaveAttribute('aria-pressed', 'true');
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
			 * El backend dejó de acotar el desglose y ya no publica `value_max`; un schema
			 * viejo en caché todavía puede traerlo (cuatro en este fixture) y el formulario
			 * lo ignora: si mandara, el técnico no podría registrar los puertos que sí tiene.
			 */
			it('ignores the ceiling an outdated schema still publishes', () => {
				const getForm = renderSection(Section, {
					defaultValues: { loose_port_types: { hdmi: 4 } },
				});

				increment(looseBreakdown(), 'HDMI');

				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 5 });
			});

			/**
			 * El `max:10` del backend rechazaba una docking con doce USB-A. Ya no existe, y
			 * el formulario tampoco puede reponerlo por su cuenta.
			 */
			it('records more ports than the ceiling the backend used to impose', () => {
				const getForm = renderSection(Section, {
					defaultValues: { loose_port_types: { hdmi: 12 } },
				});

				const incrementHdmi = within(looseBreakdown()).getByRole('button', {
					name: 'Incrementar HDMI',
				});
				expect(incrementHdmi).toBeEnabled();

				fireEvent.click(incrementHdmi);
				expect(getForm().getValues('loose_port_types')).toEqual({ hdmi: 13 });
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

			/**
			 * La migración que agregó `defective_port_types` no rellenó las revisiones
			 * anteriores: en producción hay 587 revisiones con `defective_ports_count > 0`
			 * y el mapa en `null`, y `TechnicalReviewItemResource` las publica tal cual,
			 * sin sintetizar el desglose. Derivar el total del mapa vacío ponía «0» al
			 * lado del «Sí» de la misma pregunta.
			 */
			it('shows the persisted total while the breakdown does not exist', () => {
				const getForm = renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_ports_count: 3,
						defective_port_types: null,
					},
				});

				expect(screen.getByText(/Puertos defectuosos: 3/, { selector: 'p' })).toBeVisible();
				// Abrir la revisión no puede reescribir el conteo que trajo el endpoint.
				expect(getForm().getValues('defective_ports_count')).toBe(3);
			});

			/** El desglose que falta no se puede repartir por tipo: se avisa, no se inventa. */
			it('says the historic review stored no breakdown', () => {
				renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_ports_count: 3,
						defective_port_types: null,
					},
				});

				expect(screen.getByText(/guardó el total sin el desglose por tipo/)).toBeVisible();
			});

			/** Con el mapa ya medido manda su suma, que es lo que el técnico marcó. */
			it('derives the total from the breakdown once it exists', () => {
				renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_ports_count: 3,
						defective_port_types: { hdmi: 1 },
					},
				});

				expect(screen.getByText(/Puertos defectuosos: 1/, { selector: 'p' })).toBeVisible();
				expect(
					screen.queryByText(/guardó el total sin el desglose por tipo/),
				).not.toBeInTheDocument();
			});

			/** Un `{}` guardado es «se midió, ninguno»: cero de verdad, y sin el aviso. */
			it('reads a stored empty defective breakdown as a real zero', () => {
				renderSection(Section, {
					defaultValues: {
						all_ports_functional: false,
						defective_ports_count: 0,
						defective_port_types: {},
					},
				});

				expect(screen.getByText(/Puertos defectuosos: 0/, { selector: 'p' })).toBeVisible();
				expect(
					screen.queryByText(/guardó el total sin el desglose por tipo/),
				).not.toBeInTheDocument();
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
					).toHaveLength(9);
					expect(
						within(group).getByRole('button', { name: 'Incrementar Puerto de carga' }),
					).toBeVisible();
					expect(
						within(group).getByRole('button', { name: 'Incrementar DVI' }),
					).toBeVisible();
				});
			});

			/**
			 * El catálogo del formulario es hoy el mismo que publica el backend, pero el
			 * filtro sigue siendo la guarda ante un tipo que esta pantalla no sabe mostrar.
			 */
			it('does not offer a port type outside the catalog', () => {
				const withUnknownType: ITechnicalReviewSchema = {
					...REMOTE_SCHEMA,
					loose_port_types: {
						...REMOTE_SCHEMA.loose_port_types,
						options: [
							{ value: 'hdmi', label: 'HDMI' },
							{ value: 'thunderbolt', label: 'Thunderbolt' },
						],
					},
				};

				renderSection(Section, {
					schemaFields: withUnknownType,
					defaultValues: { loose_port_types: { hdmi: 1 } },
				});

				expect(
					within(looseBreakdown()).queryByRole('button', {
						name: 'Incrementar Thunderbolt',
					}),
				).toBeNull();
				expect(
					within(looseBreakdown()).getByRole('button', { name: 'Incrementar HDMI' }),
				).toBeVisible();
			});

			/**
			 * La grilla base y el desglose tienen que aceptar lo mismo: declarar puertos
			 * buenos que después no se pueden marcar como malos era la contradicción que
			 * dejaba el techo de diez del backend, ya retirado.
			 */
			it('offers no ceiling for working nor for faulty ports', () => {
				const getForm = renderSection(Section, {
					schemaFields: undefined,
					defaultValues: {
						all_ports_functional: false,
						hdmi_ports: 12,
						defective_port_types: { hdmi: 12 },
					},
				});

				const breakdown = defectiveBreakdown();
				increment(breakdown, 'HDMI');
				expect(getForm().getValues('defective_port_types')).toEqual({ hdmi: 13 });

				const baseCounter = screen
					.getAllByRole('button', { name: /^Incrementar (HDMI|Puertos HDMI)$/ })
					.filter((button) => !defectiveBreakdown().contains(button));

				expect(baseCounter).toHaveLength(1);
				expect(baseCounter[0]).toBeEnabled();

				fireEvent.click(baseCounter[0]);
				expect(getForm().getValues('hdmi_ports')).toBe(13);
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

	/**
	 * `usb_hub_ports` y `type_c_ports` pasaron a llamarse `usb_a_ports` y `usb_c_ports`. La
	 * API ignora los nombres viejos en silencio —responde 200 y deja el contador en cero—,
	 * así que el técnico creería estar registrando puertos que no se guardan.
	 */
	it('writes the renamed monitor counters', () => {
		const getForm = renderSection(asSection(MonitorPortsSection), {
			schemaFields: MONITOR_SCHEMA,
		});

		fireEvent.click(screen.getByRole('button', { name: 'Incrementar Puertos USB-A' }));
		fireEvent.click(screen.getByRole('button', { name: 'Incrementar Puertos USB-C' }));

		expect(getForm().getValues('usb_a_ports')).toBe(1);
		expect(getForm().getValues('usb_c_ports')).toBe(1);
		expect(screen.queryByRole('button', { name: /Tipo C|USB Hub/ })).toBeNull();
	});

	/** Los dos contadores que el catálogo agregó: carga en los cinco tipos, DVI en cuatro. */
	it('writes the counters the catalog added', () => {
		const getForm = renderSection(asSection(PortsSection));

		fireEvent.click(screen.getByRole('button', { name: 'Incrementar DVI' }));
		fireEvent.click(screen.getByRole('button', { name: 'Incrementar Carga' }));

		expect(getForm().getValues('dvi_ports')).toBe(1);
		expect(getForm().getValues('charging_ports')).toBe(1);
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
