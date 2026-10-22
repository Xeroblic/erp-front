import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import Footer, { FooterLeft, FooterRight } from '@/components/layouts/Footer/Footer';
import Icon from '@/components/icon/Icon';

interface IFooterLink {
	name: string;
	href: string;
}

interface IFooterMeta {
	brand: string;
	label: string;
	front: IFooterLink;
	back: IFooterLink;
}

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const pickString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value : fallback;

const mergeLink = (value: unknown, fallback: IFooterLink): IFooterLink => {
	const record = asRecord(value);
	return {
		name: pickString(record.name, fallback.name),
		href: pickString(record.href, fallback.href),
	};
};

const DefaultFooterTemplate = () => {
	const footerMeta = useMemo(() => {
		const fallback: IFooterMeta = {
			brand: 'Zentria',
			label: 'Desarrollado con',
			front: { name: 'R4aveen', href: 'https://github.com/R4aveen/' },
			back: { name: 'Xeroblic', href: 'https://github.com/Xeroblic' },
		};
		try {
			const decoded = asRecord(
				JSON.parse(
					atob(
						'eyJicmFuZCI6IlplbnRyaWEiLCJsYWJlbCI6IkRlc2Fycm9sbGFkbyBjb24iLCJmcm9udCI6eyJuYW1lIjoiUjRhdmVlbiIsImhyZWYiOiJodHRwczovL2dpdGh1Yi5jb20vUjRhdmVlbi8ifSwiYmFjayI6eyJuYW1lIjoiWGVyb2JsaWMiLCJocmVmIjoiaHR0cHM6Ly9naXRodWIuY29tL1hlcm9ibGljIn19',
					),
				) as unknown,
			);
			return Object.freeze<IFooterMeta>({
				brand: pickString(decoded.brand, fallback.brand),
				label: pickString(decoded.label, fallback.label),
				front: mergeLink(decoded.front, fallback.front),
				back: mergeLink(decoded.back, fallback.back),
			});
		} catch (error) {
			console.error('No se pudo decodificar footerMeta', error);
			return Object.freeze(fallback);
		}
	}, []);
	return (
		<Footer>
			<FooterLeft className='text-zinc-500'>
				<div className='flex items-center gap-2'>
					<span>Copyright © {dayjs().format('YYYY')}</span>
					<span>• Versión {__APP_VERSION__}</span>
				</div>
			</FooterLeft>
			<FooterRight className='text-zinc-500'>
				<span className='flex items-center gap-2'>
					<b>{footerMeta.brand}</b>
					<span className='flex items-center gap-1'>
						{footerMeta.label} <Icon icon='DuoHeart' color='gray' /> por
						<a
							href={footerMeta.front.href}
							target='_blank'
							rel='noreferrer'
							className='hover:underline'>
							{footerMeta.front.name}
						</a>
						·
						<a
							href={footerMeta.back.href}
							target='_blank'
							rel='noreferrer'
							className='hover:underline'>
							{footerMeta.back.name}
						</a>
					</span>
				</span>
			</FooterRight>
		</Footer>
	);
};

export default DefaultFooterTemplate;
