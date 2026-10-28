import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { resolveNotebookSchema, type NotebookFormData } from '../../validation/notebook.schema';
import { aioSchema, type AioFormData } from '../../validation/aio.schema';
import { desktopSchema, type DesktopFormData } from '../../validation/desktop.schema';
import AestheticsSection from '../notebook/sections/AestheticsSection';
import HardwareSection from '../notebook/sections/HardwareSection';
import { AioScreenSection } from '../aio/sections/AioScreenSection';
import AioBasicInfoSection from '../aio/sections/AioBasicInfoSection';
import NotebookForm from '../notebook/NotebookForm';
import DesktopAestheticsSection from '../desktop/sections/DesktopAestheticsSection';
import { ReviewFormHarness, type ReviewFormHandle } from './reviewFormHarness';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

/** La galería no participa del formulario y arrastra el store y el contexto de fotos. */
vi.mock('../shared/gallery/GallerySection', () => ({ default: () => <div /> }));

vi.mock('@/components/form/Input', () => ({
	default: React.forwardRef<
		HTMLInputElement,
		React.InputHTMLAttributes<HTMLInputElement> & { invalidFeedback?: string }
	>((props, ref) => <input ref={ref} {...props} />),
}));

vi.mock('@/components/form/Checkbox', () => ({
	default: ({ checked, onChange }: { checked?: boolean; onChange?: () => void }) => (
		<input type='checkbox' checked={checked} onChange={onChange} />
	),
}));

vi.mock('@/components/form/SelectReact', () => ({
	default: () => <select aria-label='select-mock' />,
}));

vi.mock('@/pages/catalogos/marcas/components/hooks/useMarcas', () => ({
	useMarcas: () => ({ brands: [], loading: false }),
}));

vi.mock('@/pages/refactor-technical-review/components/ui/selectors/ProcessorSelector', () => ({
	ProcessorSelector: () => <input aria-label='processor-mock' />,
}));

/** `Button` lee el tema desde el store; en estas pruebas sólo interesa el click. */
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
	}) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const NOTEBOOK_SCHEMA_FIELDS: ITechnicalReviewSchema = {
	powers_on: {
		type: 'boolean',
		label: '¿Enciende?',
		required: true,
		warning: 'Un equipo que no enciende será categoría M',
	},
	speakers_condition: {
		type: 'string',
		label: 'Parlantes',
		required: true,
		options: [
			{ value: 'ok', label: 'Funcionan sin problemas' },
			{ value: 'broken', label: 'Sin audio o audio distorsionado' },
		],
	},
};

/** Notebook completo salvo el campo que cada caso deja fuera a propósito. */
const COMPLETE_NOTEBOOK: Partial<NotebookFormData> = {
	brand: 'Lenovo',
	model: 'ThinkPad T480',
	line: 'ThinkPad',
	general_condition: 'good_shape',
	processor: 'Intel Core i5-8250U',
	has_no_ram: false,
	has_no_storage: false,
	ram_size: '8GB',
	ram_slots: '8x1',
	ram_type: 'DDR4',
	storage_size: '256GB',
	storage_technology: 'SSD',
	screen_condition: 'ok',
	screen_inches: '14"',
	is_touchscreen: false,
	cover_condition: 'ok',
	keyboard_condition: 'ok',
	non_functional_keys_count: 0,
	keyboard_layout: 'es',
	hinge_condition: 'ok',
	touchpad_condition: 'ok',
	bottom_condition: 'ok',
	has_numeric_keypad: false,
	has_backlit_keyboard: false,
	battery_percentage: 80,
	includes_charger: false,
	operating_system: 'Windows 11 Pro',
	has_biometric: false,
	has_wifi: true,
	has_bluetooth: true,
	// El backend exige los parlantes al cerrar: sin ellos «completo» sería un 422.
	speakers_condition: 'ok',
};

/** Desktop completo salvo el encendido, que cada caso decide si responde. */
const COMPLETE_DESKTOP: Partial<DesktopFormData> = {
	brand: 'HP',
	model: 'EliteDesk 800 G5',
	line: 'EliteDesk',
	general_condition: 'good_shape',
	processor: 'Intel Core i5-9500',
	has_no_ram: false,
	has_no_storage: false,
	ram_size: '8GB',
	ram_slots: '8x1',
	ram_type: 'DDR4',
	storage_size: '256GB',
	storage_technology: 'SSD',
	cover_condition: 'ok',
	includes_charger: false,
	operating_system: 'Windows 11 Pro',
	has_wifi: true,
	has_bluetooth: true,
	has_cd_drive: false,
};

const renderNotebookAesthetics = (schemaFields?: ITechnicalReviewSchema) => {
	const handle: { current?: ReviewFormHandle<NotebookFormData> } = {};

	render(
		<ReviewFormHarness<NotebookFormData>
			section={AestheticsSection}
			schemaFields={schemaFields}
			handle={handle}
		/>,
	);
	return () => handle.current?.getValues();
};

const powersOnGroup = () => screen.getByRole('group', { name: /Enciende/i });

describe('ZF-102 · cierre de la revisión de notebook', () => {
	it('deja responder el encendido desde la sección de estética', () => {
		const getValues = renderNotebookAesthetics(NOTEBOOK_SCHEMA_FIELDS);

		// Sin responder, ninguna de las dos tarjetas está marcada: «no respondido» no se
		// confunde con «no enciende».
		const group = powersOnGroup();
		expect(within(group).getByRole('button', { name: 'Sí' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		expect(within(group).getByRole('button', { name: 'No' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		expect(getValues()?.powers_on).toBeUndefined();

		fireEvent.click(within(group).getByRole('button', { name: 'No' }));
		expect(getValues()?.powers_on).toBe(false);
	});

	it('anuncia el encendido como obligatorio', () => {
		renderNotebookAesthetics(NOTEBOOK_SCHEMA_FIELDS);

		expect(powersOnGroup()).toHaveAccessibleName(/^¿Enciende\?\s*\*$/);
	});

	it('usa el rótulo y la advertencia que publica el backend', () => {
		renderNotebookAesthetics(NOTEBOOK_SCHEMA_FIELDS);

		expect(screen.getByText('Un equipo que no enciende será categoría M')).toBeInTheDocument();
	});

	it('muestra el control aunque el backend no publique el campo', () => {
		renderNotebookAesthetics(undefined);

		expect(screen.getByRole('group', { name: /El equipo enciende/i })).toBeInTheDocument();
	});

	/**
	 * El resolver real, no `validateAt`: es el camino que recorre «Finalizar Revisión».
	 * Sin `powers_on` el backend respondía 422 y la revisión quedaba atascada.
	 */
	it('no cierra un notebook completo al que le falta el encendido', async () => {
		const handle: { current?: ReviewFormHandle<NotebookFormData> } = {};

		render(
			<ReviewFormHarness<NotebookFormData>
				section={AestheticsSection}
				schema={resolveNotebookSchema(true)}
				initialValues={COMPLETE_NOTEBOOK}
				schemaFields={NOTEBOOK_SCHEMA_FIELDS}
				handle={handle}
			/>,
		);
		let result: Awaited<ReturnType<ReviewFormHandle<NotebookFormData>['finish']>> | undefined;
		await act(async () => {
			result = await handle.current?.finish();
		});

		expect(result?.isValid).toBe(false);
		await waitFor(() =>
			expect(screen.getByText('Debes indicar si el equipo enciende')).toBeInTheDocument(),
		);
	});

	it('cierra el notebook cuando el encendido se respondió con «no»', async () => {
		const handle: { current?: ReviewFormHandle<NotebookFormData> } = {};

		render(
			<ReviewFormHarness<NotebookFormData>
				section={() => null}
				schema={resolveNotebookSchema(true)}
				initialValues={{ ...COMPLETE_NOTEBOOK, powers_on: false }}
				handle={handle}
			/>,
		);
		let result: Awaited<ReturnType<ReviewFormHandle<NotebookFormData>['finish']>> | undefined;
		await act(async () => {
			result = await handle.current?.finish();
		});

		expect(result).toMatchObject({ isValid: true, data: { powers_on: false } });
	});
});

describe('ZF-102 · contador de teclas de un teclado sano', () => {
	it('nace en 0 en el estado del formulario, sin que nadie toque la casilla', async () => {
		let getFormValues: (() => Record<string, unknown>) | undefined;

		render(
			<NotebookForm
				defaultValues={{ brand: 'Lenovo' }}
				onSubmit={vi.fn()}
				onBack={vi.fn()}
				registerGetFormValues={(getter) => {
					getFormValues = getter;
				}}
			/>,
		);

		await waitFor(() => expect(getFormValues).toBeDefined());
		expect(getFormValues?.().non_functional_keys_count).toBe(0);
	});

	it('respeta el valor persistido de una revisión anterior', async () => {
		let getFormValues: (() => Record<string, unknown>) | undefined;

		render(
			<NotebookForm
				defaultValues={{ non_functional_keys_count: 3 }}
				onSubmit={vi.fn()}
				onBack={vi.fn()}
				registerGetFormValues={(getter) => {
					getFormValues = getter;
				}}
			/>,
		);

		await waitFor(() => expect(getFormValues).toBeDefined());
		expect(getFormValues?.().non_functional_keys_count).toBe(3);
	});
});

describe('ZF-102 · atajo «Equipo NO ENCIENDE»', () => {
	const renderShortcut = (schemaFields?: ITechnicalReviewSchema) => {
		const onDirectSubmit = vi.fn();

		render(
			<ReviewFormHarness<NotebookFormData>
				section={HardwareSection}
				initialValues={{
					processor: 'i5',
					has_no_ram: true,
					has_no_storage: true,
					non_functional_keys_count: 0,
				}}
				onDirectSubmit={onDirectSubmit}
				schemaFields={schemaFields}
			/>,
		);
		act(() => {
			fireEvent.click(screen.getByRole('button', { name: /Equipo NO ENCIENDE/i }));
		});
		act(() => {
			fireEvent.click(screen.getByRole('button', { name: /Confirmar y Enviar/i }));
		});

		return onDirectSubmit;
	};

	it('responde los campos que el backend exige para cerrar', () => {
		const onDirectSubmit = renderShortcut(NOTEBOOK_SCHEMA_FIELDS);

		expect(onDirectSubmit).toHaveBeenCalledTimes(1);
		expect(onDirectSubmit.mock.calls[0][0]).toMatchObject({
			powers_on: false,
			non_functional_keys_count: 0,
			speakers_condition: 'broken',
		});
	});

	/** Inventar un valor de parlantes que el backend no publica produce un 422. */
	it('omite los parlantes cuando el backend no publica el campo', () => {
		const onDirectSubmit = renderShortcut(undefined);

		expect(onDirectSubmit.mock.calls[0][0]).toMatchObject({ powers_on: false });
		expect(onDirectSubmit.mock.calls[0][0]).not.toHaveProperty('speakers_condition');
	});
});

describe('ZF-102 · cierre de la revisión de desktop', () => {
	/**
	 * El control ya existía, pero el schema declaraba `powers_on` nullable: el submit final
	 * pasaba y el 422 aparecía recién en el backend, sin campo señalado.
	 */
	it('no cierra un desktop completo al que le falta el encendido', async () => {
		const handle: { current?: ReviewFormHandle<DesktopFormData> } = {};

		render(
			<ReviewFormHarness<DesktopFormData>
				section={DesktopAestheticsSection}
				schema={desktopSchema}
				initialValues={COMPLETE_DESKTOP}
				handle={handle}
			/>,
		);
		let result: Awaited<ReturnType<ReviewFormHandle<DesktopFormData>['finish']>> | undefined;
		await act(async () => {
			result = await handle.current?.finish();
		});

		expect(result?.isValid).toBe(false);
		// El error se ve junto al control, no sólo en el toast.
		await waitFor(() =>
			expect(screen.getByText('Debes indicar si el equipo enciende')).toBeInTheDocument(),
		);
	});

	it('cierra el desktop cuando el encendido se respondió con «no»', async () => {
		const handle: { current?: ReviewFormHandle<DesktopFormData> } = {};

		render(
			<ReviewFormHarness<DesktopFormData>
				section={() => null}
				schema={desktopSchema}
				initialValues={{ ...COMPLETE_DESKTOP, powers_on: false }}
				handle={handle}
			/>,
		);
		let result: Awaited<ReturnType<ReviewFormHandle<DesktopFormData>['finish']>> | undefined;
		await act(async () => {
			result = await handle.current?.finish();
		});

		expect(result).toMatchObject({ isValid: true, data: { powers_on: false } });
	});

	it('anuncia el encendido como obligatorio y lo bloquea en modo lectura', () => {
		const Harness = ({ readOnly }: { readOnly: boolean }) => (
			<ReviewFormHarness<DesktopFormData>
				section={DesktopAestheticsSection}
				readOnly={readOnly}
			/>
		);

		const { unmount } = render(<Harness readOnly={false} />);
		expect(screen.getByRole('group', { name: /El equipo enciende/i })).toHaveAccessibleName(
			/^¿El equipo enciende\?\s*\*$/,
		);
		unmount();

		render(<Harness readOnly />);
		const group = screen.getByRole('group', { name: /El equipo enciende/i });
		expect(within(group).getByRole('button', { name: 'No' })).toBeDisabled();
	});
});

describe('ZF-102 · AIO', () => {
	const renderAioScreen = (defaultValues: Partial<AioFormData> = {}) => {
		const handle: { current?: ReviewFormHandle<AioFormData> } = {};

		render(
			<ReviewFormHarness<AioFormData>
				section={AioScreenSection}
				schema={aioSchema}
				initialValues={defaultValues}
				handle={handle}
			/>,
		);
		return {
			getValues: () => handle.current?.getValues(),
			validateTouchscreen: async () => {
				let isValid = true;
				await act(async () => {
					isValid =
						(await handle.current?.validate(['is_touchscreen']))?.isValid ?? false;
				});
				return isValid;
			},
		};
	};

	it('no da por respondida la pantalla táctil que nadie tocó', () => {
		const { getValues } = renderAioScreen();
		const group = screen.getByRole('group', { name: /Pantalla táctil/i });

		expect(within(group).getByRole('button', { name: 'Sí' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		expect(within(group).getByRole('button', { name: 'No' })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		expect(getValues()?.is_touchscreen).toBeUndefined();

		fireEvent.click(within(group).getByRole('button', { name: 'No' }));
		expect(getValues()?.is_touchscreen).toBe(false);
	});

	/**
	 * El paso «Pantalla & Base» se trababa sin decir por qué: el switch se veía apagado y
	 * el error del campo no se pintaba en ninguna parte.
	 */
	it('muestra el error de la pantalla táctil junto al control', async () => {
		const { validateTouchscreen } = renderAioScreen();

		expect(await validateTouchscreen()).toBe(false);
		await waitFor(() =>
			expect(screen.getByText('Debes indicar si es touch')).toBeInTheDocument(),
		);
	});

	it('avanza cuando la pantalla táctil está respondida', async () => {
		const { validateTouchscreen } = renderAioScreen({ is_touchscreen: false });

		expect(await validateTouchscreen()).toBe(true);
	});

	const renderAioBasicInfo = (defaultValues: Partial<AioFormData> = {}) => {
		const handle: { current?: ReviewFormHandle<AioFormData> } = {};

		render(
			<ReviewFormHarness<AioFormData>
				section={AioBasicInfoSection}
				schema={aioSchema}
				initialValues={defaultValues}
				handle={handle}
			/>,
		);
		return {
			getValues: () => handle.current?.getValues(),
			validateLine: async () => {
				let isValid = true;
				await act(async () => {
					isValid = (await handle.current?.validate(['line']))?.isValid ?? false;
				});
				return isValid;
			},
		};
	};

	/** El switch anterior sí se deshabilitaba en modo lectura; el selector debe hacerlo igual. */
	it('no deja responder la pantalla táctil en modo lectura', () => {
		const handle: { current?: ReviewFormHandle<AioFormData> } = {};

		render(
			<ReviewFormHarness<AioFormData> section={AioScreenSection} readOnly handle={handle} />,
		);
		const getValues = () => handle.current?.getValues();
		const group = screen.getByRole('group', { name: /Pantalla táctil/i });
		const no = within(group).getByRole('button', { name: 'No' });

		expect(no).toBeDisabled();
		fireEvent.click(no);
		expect(getValues()?.is_touchscreen).toBeUndefined();
	});

	it('captura la línea del equipo', () => {
		const { getValues } = renderAioBasicInfo();

		fireEvent.change(screen.getByPlaceholderText('Ej: OptiPlex, ThinkCentre, IdeaCentre'), {
			target: { value: 'OptiPlex' },
		});

		expect(getValues()?.line).toBe('OptiPlex');
	});

	/** La columna existía en la tabla de AIO y quedaba NULL siempre. */
	it('exige la línea para avanzar de «Info Básica»', async () => {
		const sinLinea = renderAioBasicInfo();
		expect(await sinLinea.validateLine()).toBe(false);
		await waitFor(() =>
			expect(screen.getByText('La línea es obligatoria')).toBeInTheDocument(),
		);
	});

	it('avanza cuando la línea está escrita', async () => {
		const conLinea = renderAioBasicInfo({ line: 'OptiPlex' });
		expect(await conLinea.validateLine()).toBe(true);
	});
});

describe('ZF-102 · el error del encendido se borra al responderlo', () => {
	/**
	 * Un cambio que no revalida dejaba el mensaje rojo en pantalla
	 * después de responder, hasta que el técnico volvía a pulsar Finalizar.
	 */
	it('limpia el mensaje del notebook en cuanto se responde', async () => {
		const handle: { current?: ReviewFormHandle<NotebookFormData> } = {};

		render(
			<ReviewFormHarness<NotebookFormData>
				section={AestheticsSection}
				schema={resolveNotebookSchema(true)}
				initialValues={COMPLETE_NOTEBOOK}
				schemaFields={NOTEBOOK_SCHEMA_FIELDS}
				handle={handle}
			/>,
		);
		await act(async () => {
			await handle.current?.finish();
		});
		await waitFor(() =>
			expect(screen.getByText('Debes indicar si el equipo enciende')).toBeInTheDocument(),
		);

		fireEvent.click(within(powersOnGroup()).getByRole('button', { name: 'Sí' }));

		await waitFor(() =>
			expect(
				screen.queryByText('Debes indicar si el equipo enciende'),
			).not.toBeInTheDocument(),
		);
	});

	it('limpia el mensaje del desktop en cuanto se responde', async () => {
		const handle: { current?: ReviewFormHandle<DesktopFormData> } = {};

		render(
			<ReviewFormHarness<DesktopFormData>
				section={DesktopAestheticsSection}
				schema={desktopSchema}
				initialValues={COMPLETE_DESKTOP}
				handle={handle}
			/>,
		);
		await act(async () => {
			await handle.current?.finish();
		});
		await waitFor(() =>
			expect(screen.getByText('Debes indicar si el equipo enciende')).toBeInTheDocument(),
		);

		const group = screen.getByRole('group', { name: /El equipo enciende/i });
		fireEvent.click(within(group).getByRole('button', { name: 'Sí' }));

		await waitFor(() =>
			expect(
				screen.queryByText('Debes indicar si el equipo enciende'),
			).not.toBeInTheDocument(),
		);
	});
});

describe('ZF-102 · estado de los parlantes', () => {
	const SPEAKERS_ERROR = 'El estado de los parlantes es obligatorio';

	/** Notebook cerrable salvo por los parlantes, que cada caso decide si responde. */
	const NOTEBOOK_SIN_PARLANTES: Partial<NotebookFormData> = {
		...COMPLETE_NOTEBOOK,
		powers_on: true,
		speakers_condition: undefined,
	};

	const renderNotebookForm = (
		defaultValues: Partial<NotebookFormData>,
		schemaFields: ITechnicalReviewSchema | undefined,
		onSubmit: (data: NotebookFormData) => Promise<void>,
		initialSectionKey = 'gallery',
	) =>
		render(
			<NotebookForm
				defaultValues={defaultValues}
				onSubmit={onSubmit}
				onBack={vi.fn()}
				schemaFields={schemaFields}
				initialSectionKey={initialSectionKey}
			/>,
		);

	/**
	 * El camino real de «Finalizar Revisión», con el resolver que arma `NotebookForm`.
	 * Antes el submit pasaba y el 422 llegaba desde `complete-review` sin campo señalado.
	 */
	it('no cierra el notebook cuando el backend publica el campo y nadie lo respondió', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		renderNotebookForm(NOTEBOOK_SIN_PARLANTES, NOTEBOOK_SCHEMA_FIELDS, onSubmit);

		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('cierra el notebook cuando los parlantes están respondidos', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		renderNotebookForm(
			{ ...NOTEBOOK_SIN_PARLANTES, speakers_condition: 'ok' },
			NOTEBOOK_SCHEMA_FIELDS,
			onSubmit,
		);

		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		expect(onSubmit.mock.calls[0][0]).toMatchObject({ speakers_condition: 'ok' });
	});

	/**
	 * Sin schema remoto la tarjeta no se renderiza: exigirlo dejaría la revisión
	 * incerrable, con un error que el técnico no tiene dónde corregir.
	 */
	it('no lo exige cuando el backend no publica el campo', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		renderNotebookForm(NOTEBOOK_SIN_PARLANTES, undefined, onSubmit);

		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
	});

	/** El síntoma que describe ZF-102: saltarse la tarjeta en «Entrada» y avanzar igual. */
	it('bloquea el avance de «Entrada» y muestra el error junto a la tarjeta', async () => {
		renderNotebookForm(NOTEBOOK_SIN_PARLANTES, NOTEBOOK_SCHEMA_FIELDS, vi.fn(), 'input');

		await act(async () => {
			fireEvent.click(await screen.findByText('Siguiente'));
		});

		await waitFor(() => expect(screen.getByText(SPEAKERS_ERROR)).toBeInTheDocument());
		// Sigue en «Entrada»: el paso no avanzó y la tarjeta con el error está a la vista.
		expect(screen.getByRole('group', { name: /Parlantes/i })).toBeInTheDocument();
	});

	it('deja avanzar de «Entrada» con los parlantes respondidos', async () => {
		renderNotebookForm(
			{ ...NOTEBOOK_SIN_PARLANTES, speakers_condition: 'ok' },
			NOTEBOOK_SCHEMA_FIELDS,
			vi.fn(),
			'input',
		);

		await act(async () => {
			fireEvent.click(await screen.findByText('Siguiente'));
		});

		await waitFor(() => expect(screen.queryByText(SPEAKERS_ERROR)).not.toBeInTheDocument());
	});

	/**
	 * El camino real: `EquipmentFormRouter` monta `NotebookForm` con `schemaFields`
	 * undefined mientras el fetch está en curso y lo rerenderiza cuando el schema remoto
	 * llega. Montar directamente con el schema ya presente no prueba esto: un `useMemo`
	 * con dependencias vacías (o cualquier otra forma de capturar el schema al montar)
	 * pasaría igual las pruebas que sólo montan con el schema puesto.
	 */
	it('exige los parlantes cuando el schema remoto llega después del montaje', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const { rerender } = renderNotebookForm(NOTEBOOK_SIN_PARLANTES, undefined, onSubmit);

		rerender(
			<NotebookForm
				defaultValues={NOTEBOOK_SIN_PARLANTES}
				onSubmit={onSubmit}
				onBack={vi.fn()}
				schemaFields={NOTEBOOK_SCHEMA_FIELDS}
				initialSectionKey='gallery'
			/>,
		);

		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});

		expect(onSubmit).not.toHaveBeenCalled();
	});
});
