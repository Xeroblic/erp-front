import { describe, expect, it } from 'vitest';
import { HINGE_CONDITION_OPTIONS } from '@/pages/refactor-technical-review/components/constants/notebook/notebook.options';
import { translateValue } from '../reviewTranslations';

describe('translateValue', () => {
	/**
	 * El contrato de bisagras pasó a `ok, worn, cracked, loose, broken`, pero el mapa de
	 * rótulos del resumen quedó en el anterior: el técnico elegía «Trizada» en la tarjeta y
	 * el panel de resumen —y el texto de «Copiar info»— le mostraban `cracked` en crudo.
	 */
	it('traduce todas las condiciones de bisagra que ofrece el formulario', () => {
		HINGE_CONDITION_OPTIONS.forEach(({ value, label }) => {
			expect(translateValue(value, 'hinge_condition')).toBe(label);
		});
	});

	/**
	 * `ok`, `worn` y `broken` los comparten casi todas las condiciones y el mapa plano deja
	 * ganar al último: un solo rótulo describía la bisagra, la tapa y el teclado a la vez,
	 * con el género de uno solo de ellos.
	 */
	it('usa el rótulo del campo y no uno compartido entre todos', () => {
		expect(translateValue('broken', 'hinge_condition')).toBe('Rota');
		expect(translateValue('broken', 'keyboard_condition')).toBe('Roto');
		expect(translateValue('worn', 'hinge_condition')).toBe('Con Desgaste');
		expect(translateValue('worn', 'screen_condition')).toBe('Con Líneas / Desgaste Visible');
	});

	/** La cubierta del teclado también usa `cracked`, sin el techo de grado de su tarjeta. */
	it('traduce la cubierta del teclado sin anunciar el grado', () => {
		expect(translateValue('cracked', 'keyboard_cover_condition')).toBe('Trizada');
	});

	/** Sin campo, o con uno sin mapa propio, sigue mandando el mapa plano. */
	it('cae al mapa común cuando el valor no depende del campo', () => {
		expect(translateValue('cracked')).toBe('Trizada');
		expect(translateValue(true)).toBe('Sí');
		expect(translateValue('keyboard_marks', 'screen_condition')).toBe('Marcas del teclado');
	});
});
