import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import packageJson from '../../../../package.json';
import DefaultFooterTemplate from './DefaultFooter.template';

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span aria-hidden='true' />,
}));

describe('DefaultFooterTemplate', () => {
	it('muestra la versión de package.json del front', () => {
		render(<DefaultFooterTemplate />);

		expect(screen.getByText(`• Versión ${packageJson.version}`)).toBeInTheDocument();
	});

	it('muestra la marca y los enlaces decodificados de la metadata', () => {
		render(<DefaultFooterTemplate />);

		expect(screen.getByText('Zentria')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'R4aveen' })).toHaveAttribute(
			'href',
			'https://github.com/R4aveen/',
		);
		expect(screen.getByRole('link', { name: 'Xeroblic' })).toHaveAttribute(
			'href',
			'https://github.com/Xeroblic',
		);
	});
});
