import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Footer, { FooterLeft, FooterRight } from '../../../components/layouts/Footer/Footer';
import ApiService from '@/services/ApiService';

const DefaultFooterTemplate = () => {
	const [version, setVersion] = useState('');

	useEffect(() => {
		const fetchVersion = async () => {
			if (!process.env.REACT_APP_VERSION) return;
			try {
				const response = await fetch(process.env.REACT_APP_VERSION);
				if (!response.ok) return;
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const data = await response.json();
					setVersion((data?.version ?? '').toString());
					return;
				}
				setVersion((await response.text()).trim());
			} catch (error) {
				console.error('No se pudo obtener la versión SDE', error);
			}
		};
		fetchVersion();
	}, []);
	
	return (
		<Footer>
			<FooterLeft className='text-zinc-500'>
				<div>Copyright © {dayjs().format('YYYY')}</div>

			</FooterLeft>
			<FooterRight className='text-zinc-500'>
				<span>
					<b>Zentria</b> Desarrollado con ❤️ por R&M
				</span>
				{version && <span>Versión SDE {version}</span>}
			</FooterRight>
		</Footer>
	);
};

export default DefaultFooterTemplate;
