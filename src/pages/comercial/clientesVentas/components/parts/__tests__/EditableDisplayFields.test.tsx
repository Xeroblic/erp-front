import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormikProps } from 'formik';
import EditableField from '../EditableField';
import EditableSelect from '../EditableSelect';

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

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

	it('usa Seleccionar como placeholder en edición', () => {
		const formik = formikWith({ field: '', select: '' });

		render(
			<EditableSelect
				formik={formik}
				name='select'
				label='Selección'
				isEditable
				options={[{ value: 'factura', label: 'Factura' }]}
			/>,
		);

		expect(screen.getByText('Seleccionar')).toBeInTheDocument();
	});

	it('permite aplicar un formatter autoritativo en modo lectura', () => {
		const formik = formikWith({ field: '', select: 'legacy' });

		render(
			<EditableSelect
				formik={formik}
				name='select'
				label='Tipo de cliente'
				isEditable={false}
				options={[]}
				displayValueFormatter={() => 'Sin información'}
			/>,
		);

		expect(screen.getByText('Sin información')).toBeInTheDocument();
		expect(screen.queryByText('legacy')).not.toBeInTheDocument();
	});
});
