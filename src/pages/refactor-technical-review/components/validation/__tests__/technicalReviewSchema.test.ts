import { describe, expect, it } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { getSchemaFieldOptions, selectTechnicalReviewSchemaFields } from '../technicalReviewSchema';

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

	it('ignores non-string options because SelectionCard serializes string values', () => {
		expect(
			getSchemaFieldOptions({
				type: 'integer',
				options: [{ value: 1, label: 'Uno' }],
			}),
		).toEqual([]);
	});
});
