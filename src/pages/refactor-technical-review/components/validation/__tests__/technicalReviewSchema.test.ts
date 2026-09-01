import { describe, expect, it } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import {
	getSchemaFieldOptions,
	resolveSchemaField,
	selectTechnicalReviewSchemaFields,
} from '../technicalReviewSchema';

const schema: ITechnicalReviewSchema = {
	speakers_condition: {
		type: 'string',
		label: 'Parlantes',
		options: [
			{ value: 'ok', label: 'Funcionan sin problemas' },
			{ value: 'broken', label: 'Sin audio o audio distorsionado' },
		],
	},
	powers_on: { type: 'boolean', label: '¿Enciende?' },
};

describe('technicalReviewSchema', () => {
	it('selects only the fields assigned to the current form', () => {
		expect(selectTechnicalReviewSchemaFields(schema, ['speakers_condition'])).toEqual({
			speakers_condition: schema.speakers_condition,
		});
	});

	it('uses the options and labels returned by the schema', () => {
		expect(getSchemaFieldOptions(schema.speakers_condition)).toEqual([
			{ value: 'ok', label: 'Funcionan sin problemas' },
			{ value: 'broken', label: 'Sin audio o audio distorsionado' },
		]);
	});

	// El contrato declara `value: string | number`. Descartar las numéricas hacía
	// desaparecer de la UI, sin traza, cualquier opción que el backend publicara así.
	it('serializes numeric options instead of dropping them', () => {
		expect(
			getSchemaFieldOptions({
				type: 'integer',
				options: [{ value: 1, label: 'Uno' }],
			}),
		).toEqual([{ value: '1', label: 'Uno' }]);
	});

	it('falls back to the local metadata when the remote field is missing', () => {
		const fallback = {
			label: 'Bisagras',
			options: [{ value: 'ok', label: 'Sin daño' }],
		};

		expect(resolveSchemaField(undefined, fallback)).toEqual({
			label: 'Bisagras',
			options: fallback.options,
			hint: undefined,
			warning: undefined,
			isFallback: true,
		});
	});

	it('prefers the remote metadata when the backend publishes options', () => {
		const resolved = resolveSchemaField(
			{
				type: 'string',
				label: 'Estado de bisagras',
				hint: 'Revisa el juego lateral.',
				options: [{ value: 'loose', label: 'Suelta' }],
			},
			{ label: 'Bisagras', options: [{ value: 'ok', label: 'Sin daño' }] },
		);

		expect(resolved).toEqual({
			label: 'Estado de bisagras',
			options: [{ value: 'loose', label: 'Suelta' }],
			hint: 'Revisa el juego lateral.',
			warning: undefined,
			isFallback: false,
		});
	});
});
