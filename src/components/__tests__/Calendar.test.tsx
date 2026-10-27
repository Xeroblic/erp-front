import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Calendar from '../Calendar';

/**
 * FullCalendar 7 cambió los imports, pasó el tema a un plugin y dejó de traer `core`.
 * La prueba monta el calendario como lo usa Feriados: vista de mes, un evento y el
 * idioma de la app, que antes no tenía locale cargado y caía en inglés.
 */

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { language: 'es' } }),
}));

describe('Calendar', () => {
	it('muestra el evento del mes con los días en español', async () => {
		render(
			<Calendar
				initialDate='2026-09-01'
				events={[{ title: 'Fiestas Patrias', date: '2026-09-18', allDay: true }]}
			/>,
		);

		expect(await screen.findByText('Fiestas Patrias')).toBeInTheDocument();
		expect(screen.getAllByText(/^lun/i).length).toBeGreaterThan(0);
	});

	it('agrega los plugins del llamador sin reemplazar los de serie', async () => {
		const extraPlugin = { name: 'zentria-extra' };

		render(
			<Calendar
				initialDate='2026-09-01'
				plugins={[extraPlugin]}
				events={[{ title: 'Feriado', date: '2026-09-19', allDay: true }]}
			/>,
		);

		expect(await screen.findByText('Feriado')).toBeInTheDocument();
	});
});
