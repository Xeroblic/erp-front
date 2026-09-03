import { describe, expect, it } from 'vitest';
import { HINGE_CONDITION_OPTIONS } from '@/pages/refactor-technical-review/components/constants/notebook/notebook.options';
import type { EquipmentType } from '@/interface/technicalReviews.interface';
import { getFieldsForType, translateField, translateValue } from '../reviewTranslations';

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

	/**
	 * ZF-99. `missing_key` y `locked` sólo existen en el candado del docking: no están en el
	 * mapa plano, así que sin rótulo propio el resumen los mostraba en inglés. Y `ok` y
	 * `worn` sí están, pero describiendo otra cosa.
	 */
	it('traduce los cuatro estados del candado del docking', () => {
		expect(translateValue('ok', 'lock_area_condition')).toBe('Sin observaciones');
		expect(translateValue('missing_key', 'lock_area_condition')).toBe('Sin llave');
		expect(translateValue('worn', 'lock_area_condition')).toBe('Sector con desgaste');
		expect(translateValue('locked', 'lock_area_condition')).toBe('Candado puesto');
	});

	/** Sin campo, o con uno sin mapa propio, sigue mandando el mapa plano. */
	it('cae al mapa común cuando el valor no depende del campo', () => {
		expect(translateValue('cracked')).toBe('Trizada');
		expect(translateValue(true)).toBe('Sí');
		expect(translateValue('keyboard_marks', 'screen_condition')).toBe('Marcas del teclado');
	});
});

/**
 * El resumen lateral filtra los detalles con `getFieldsForType`: un campo que no está en
 * el mapa de rótulos de su tipo de equipo no se muestra ni entra en «Copiar Información»,
 * aunque el backend lo haya guardado. Los campos de ZF-98 quedaron fuera de los cinco.
 */
describe('campos del resumen por tipo de equipo', () => {
	const EQUIPMENT_TYPES: EquipmentType[] = ['notebook', 'desktop', 'aio', 'monitor', 'docking'];
	const PORT_FIELDS = ['loose_ports_count', 'loose_port_types', 'defective_port_types'];

	EQUIPMENT_TYPES.forEach((equipmentType) => {
		it(`incluye el desglose de puertos en ${equipmentType}`, () => {
			const fields = getFieldsForType(equipmentType);

			PORT_FIELDS.forEach((field) => {
				expect(fields?.has(field)).toBe(true);
				expect(translateField(field, equipmentType)).not.toBe(field);
			});
		});
	});

	/** La cubierta del teclado sólo existe en notebook, y también quedó sin rótulo. */
	it('incluye la condición del cobertor del teclado en notebook', () => {
		expect(getFieldsForType('notebook')?.has('keyboard_cover_condition')).toBe(true);
		expect(translateField('keyboard_cover_condition', 'notebook')).not.toBe(
			'keyboard_cover_condition',
		);
	});

	/** El sector del candado sólo existe en docking, y sin rótulo no llega al resumen. */
	it('incluye el estado del candado en docking', () => {
		expect(getFieldsForType('docking')?.has('lock_area_condition')).toBe(true);
		expect(translateField('lock_area_condition', 'docking')).not.toBe('lock_area_condition');
	});

	/** El mapa tiene que leerse como puertos y cantidades, no como «[object Object]». */
	it('muestra el desglose por tipo de puerto', () => {
		expect(translateValue({ hdmi: 2, usb_c: 1 }, 'defective_port_types')).toBe(
			'HDMI (2), USB-C (1)',
		);
		expect(translateValue({}, 'loose_port_types')).toBe('Ninguno');
	});
});
