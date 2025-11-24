import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Footer, { FooterLeft, FooterRight } from '../../../components/layouts/Footer/Footer';
import ApiService from '@/services/ApiService';
import Icon from '@/components/icon/Icon';

const DefaultFooterTemplate = () => {
	const [version, setVersion] = useState('');

	useEffect(() => {
		const fetchVersion = async () => {
			const versionUrl = process.env.REACT_APP_VERSION ?? 'http://localhost:8000/api/version';
			if (!versionUrl) return;
			try {
				const data = await ApiService.fetchNormalized<{ version?: string } | string>({
					url: versionUrl,
					method: 'get',
					cacheTTLms: 60_000,
					dedupe: true,
				});
				const next =
					(data as any)?.version ??
					(data as any)?.data ??
					(data as any)?.versionSDE ??
					data;
				if (next) setVersion(next.toString().trim());
			} catch (error) {
				console.error('No se pudo obtener la versión SDE', error);
			}
		};
		fetchVersion();
	}, []);

	return (
		<Footer>
			<FooterLeft className='text-zinc-500'>
				<div className='flex items-center gap-2'>
					<span>Copyright © {dayjs().format('YYYY')}</span>
					{version && <span>• Versión SDE {version}</span>}
				</div>
			</FooterLeft>
			<FooterRight className='text-zinc-500'>
				<span className='flex items-center gap-2'>
					<b>Zentria</b>
					<span className='flex items-center gap-1'>
						Desarrollado con <Icon icon='DuoHeart' color='gray' /> por
						<a href='https://github.com/R4aveen/' target='_blank' rel='noreferrer' className='hover:underline'>R4aveen</a>
						·
						<a href='https://github.com/Xeroblic' target='_blank' rel='noreferrer' className='hover:underline'>Xeroblic</a>
					</span>
				</span>
			</FooterRight>
		</Footer>
	);
};

export default DefaultFooterTemplate;
