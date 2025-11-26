import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Footer, { FooterLeft, FooterRight } from '../../../components/layouts/Footer/Footer';
import ApiService from '@/services/ApiService';
import Icon from '@/components/icon/Icon';

const DefaultFooterTemplate = () => {
	const [version, setVersion] = useState('');
	const footerMeta = useMemo(() => {
		const fallback = {
			brand: 'Zentria',
			label: 'Desarrollado con',
			front: { name: 'R4aveen', href: 'https://github.com/R4aveen/' },
			back: { name: 'Xeroblic', href: 'https://github.com/Xeroblic' },
		};
		try {
			const decoded = JSON.parse(
				atob(
					'eyJicmFuZCI6IlplbnRyaWEiLCJsYWJlbCI6IkRlc2Fycm9sbGFkbyBjb24iLCJmcm9udCI6eyJuYW1lIjoiUjRhdmVlbiIsImhyZWYiOiJodHRwczovL2dpdGh1Yi5jb20vUjRhdmVlbi8ifSwiYmFjayI6eyJuYW1lIjoiWGVyb2JsaWMiLCJocmVmIjoiaHR0cHM6Ly9naXRodWIuY29tL1hlcm9ibGljIn19',
				),
			);
			return Object.freeze({
				...fallback,
				...decoded,
				front: { ...fallback.front, ...(decoded as any).front },
				back: { ...fallback.back, ...(decoded as any).back },
			});
		} catch (error) {
			console.error('No se pudo decodificar footerMeta', error);
			return Object.freeze(fallback);
		}
	}, []);

	const versionEndpoint = useMemo(() => {
		const env = import.meta.env as Record<string, string | undefined>;
		const fromEnv =
			env.VITE_APP_VERSION ||
			env.VITE_VERSION_URL ||
			env.VITE_VERSION_ENDPOINT ||
			env.REACT_APP_VERSION ||
			'';
		if (fromEnv) return fromEnv;
		const apiUrl = env.VITE_API_URL;
		return apiUrl ? `${apiUrl.replace(/\/$/, '')}/version` : '';
	}, []);

	useEffect(() => {
		let mounted = true;
		const fetchVersion = async () => {
			if (!versionEndpoint) return;
			try {
				const data = await ApiService.fetchNormalized<{ version?: string } | string>({
					url: versionEndpoint,
					method: 'get',
					cacheTTLms: 60_000,
					dedupe: true,
				});

				const next =
					(data as any)?.version ??
					(data as any)?.data ??
					(data as any)?.versionSDE ??
					data;

				if (next && mounted) {
					setVersion(next.toString().trim());
				}
			} catch (error) {
				console.error('No se pudo obtener la versión SDE', error);
			}
		};
		void fetchVersion();
		return () => {
			mounted = false;
		};
	}, [versionEndpoint]);

	return (
		<Footer>
			<FooterLeft className='text-zinc-500'>
				<div className='flex items-center gap-2'>
					<span>Copyright © {dayjs().format('YYYY')}</span>
					{version && <span>• Versión {version}</span>}
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
