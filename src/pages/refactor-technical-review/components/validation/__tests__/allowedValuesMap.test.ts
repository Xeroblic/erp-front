import { describe, expect, it } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import {
	buildRemoteAllowedValuesMap,
	sanitizeByAllowedValues,
} from '../constants/allowedValuesMap';

/**
 * B3: ZF-48 abrió `keyboard_condition`, `hinge_condition` y `touchpad_condition` a
 * valores dinámicos del backend, pero `NOTEBOOK_ALLOWED` seguía filtrándolos contra
 * las constantes locales. En el reintento del autosave eso borraba el valor elegido
 * por el técnico y el badge mostraba «Guardado» igual.
 */
const REMOTE_SCHEMA: ITechnicalReviewSchema = {
	hinge_condition: {
		type: 'string',
		label: 'Bisagras',
		allowed_values: ['ok', 'loose', 'broken'],
		options: [{ value: 'loose', label: 'Suelta' }],
	},
	speakers_condition: {
		type: 'string',
		label: 'Parlantes',
		allowed_values: ['ok', 'broken'],
	},
	touchpad_condition: {
		type: 'string',
		label: 'Touchpad',
		allowed_values: ['ok', 'worn', 'missing_pieces', 'scratched', 'broken'],
	},
	powers_on: { type: 'boolean', label: '¿Enciende?' },
};

describe('buildRemoteAllowedValuesMap', () => {
	it('only maps the fields that publish allowed_values', () => {
		expect(buildRemoteAllowedValuesMap(REMOTE_SCHEMA)).toEqual({
			hinge_condition: ['ok', 'loose', 'broken'],
			speakers_condition: ['ok', 'broken'],
			touchpad_condition: ['ok', 'worn', 'missing_pieces', 'scratched', 'broken'],
		});
	});

	it('returns undefined when there is no remote schema', () => {
		expect(buildRemoteAllowedValuesMap(null)).toBeUndefined();
		expect(buildRemoteAllowedValuesMap({})).toBeUndefined();
	});

	it('normalizes numeric allowed values to strings', () => {
		expect(
			buildRemoteAllowedValuesMap({ ram_slots: { type: 'integer', allowed_values: [2, 4] } }),
		).toEqual({ ram_slots: ['2', '4'] });
	});
});

describe('sanitizeByAllowedValues', () => {
	it('drops a dynamic value when only the local map is available', () => {
		const result = sanitizeByAllowedValues({ touchpad_condition: 'scratched' }, 'notebook');

		expect(result).not.toHaveProperty('touchpad_condition');
	});

	it('keeps a dynamic value published by the backend', () => {
		const result = sanitizeByAllowedValues(
			{ touchpad_condition: 'scratched' },
			'notebook',
			buildRemoteAllowedValuesMap(REMOTE_SCHEMA),
		);

		expect(result.touchpad_condition).toBe('scratched');
	});

	/**
	 * B1-bis: el respaldo local de bisagras estaba congelado en el contrato de
	 * componente genérico. Ofrecía `missing_pieces`, que `CONDITION_HINGE` rechaza, y
	 * escondía los dos estados que limitan a grado C.
	 */
	it('matches the hinge contract of the backend without a remote schema', () => {
		expect(sanitizeByAllowedValues({ hinge_condition: 'cracked' }, 'notebook')).toEqual({
			hinge_condition: 'cracked',
		});
		expect(sanitizeByAllowedValues({ hinge_condition: 'loose' }, 'notebook')).toEqual({
			hinge_condition: 'loose',
		});
		expect(
			sanitizeByAllowedValues({ hinge_condition: 'missing_pieces' }, 'notebook'),
		).not.toHaveProperty('hinge_condition');
	});

	it('still strips a value the backend does not accept', () => {
		const result = sanitizeByAllowedValues(
			{ hinge_condition: 'inventado' },
			'notebook',
			buildRemoteAllowedValuesMap(REMOTE_SCHEMA),
		);

		expect(result).not.toHaveProperty('hinge_condition');
	});

	it('keeps the notebook keyboard cover contract without a remote schema', () => {
		expect(
			sanitizeByAllowedValues({ keyboard_cover_condition: 'cracked' }, 'notebook'),
		).toEqual({ keyboard_cover_condition: 'cracked' });
		expect(
			sanitizeByAllowedValues({ keyboard_cover_condition: 'missing_pieces' }, 'notebook'),
		).not.toHaveProperty('keyboard_cover_condition');
	});

	it('leaves fields governed by the local map untouched', () => {
		const result = sanitizeByAllowedValues(
			{ keyboard_layout: 'es', hinge_condition: 'loose' },
			'notebook',
			buildRemoteAllowedValuesMap(REMOTE_SCHEMA),
		);

		expect(result.keyboard_layout).toBe('es');
	});
});
