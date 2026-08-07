import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormikProps } from 'formik';
import EditableField from '../EditableField';
import EditableSelect from '../EditableSelect';

interface TestValues {
	field: string;
	select: string;
}

const formikWith = (values: TestValues): FormikProps<TestValues> =>
	({
		values,
		touched: {},
		errors: {},
		handleBlur: vi.fn(),
		handleChange: vi.fn(),
	}) as unknown as FormikProps<TestValues>;

describe('campos editables en modo lectura', () => {
	it('muestra el estado vacío consistente para texto y selección con espacios', () => {
		const formik = formikWith({ field: '   ', select: '  ' });

		render(
			<>
				<EditableField formik={formik} name='field' label='Texto' isEditable={false} />
				<EditableSelect
					formik={formik}
					name='select'
					label='Selección'
					isEditable={false}
					options={[{ value: 'factura', label: 'Factura' }]}
				/>
			</>,
		);

		expect(screen.getAllByText('Sin información registrada.')).toHaveLength(2);
		expect(screen.getByText('Texto').parentElement).toHaveClass('w-full');
		expect(screen.getByText('Selección').parentElement).toHaveClass('w-full');
		expect(screen.getByText('Texto').parentElement).not.toHaveClass('rounded-lg');
	});
});
