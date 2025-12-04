import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import pagesConfig from '@/config/pages.config';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

const cfg = pagesConfig as any;

const ReportsHome: React.FC = () => {
	const navigate = useNavigate();
	const { subsidiaryId } = useParams<{ subsidiaryId: string }>();
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const sid = subsidiaryId || effectiveSubsidiaryId;

	return (
		<div className='space-y-6'>
			<Card className='border border-violet-200/60 bg-gradient-to-br from-violet-50 to-violet-50/60 shadow-sm dark:from-violet-900/10 dark:to-transparent'>
				<CardHeader className='rounded-t-md bg-white/60 dark:bg-zinc-900/40'>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100'>
							<Icon icon='HeroChartBar' className='h-6 w-6 text-violet-700' />
						</div>
						<div>
							<h2 className='text-lg font-bold text-violet-900'>Reportes</h2>
							<p className='text-sm text-violet-700'>
								Selecciona un reporte para comenzar
							</p>
						</div>
					</div>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='flex items-center gap-2 text-zinc-700'>
								<Icon icon='HeroReceiptPercent' className='h-5 w-5' /> Dashboard de
								Ventas
							</div>
							<Button
								className='mt-3'
								variant='outline'
								color='violet'
								onClick={() => navigate(`/subsidiaries/${sid}/reports/sales`)}>
								Abrir
							</Button>
						</div>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='flex items-center gap-2 text-zinc-700'>
								<Icon icon='HeroCubeTransparent' className='h-5 w-5' /> Reportes de
								Inventario
							</div>
							<Button
								className='mt-3'
								variant='outline'
								color='violet'
								onClick={() => navigate(`/subsidiaries/${sid}/reports/inventory`)}>
								Abrir
							</Button>
						</div>
						<div className='rounded-lg border border-zinc-200 bg-white p-4 dark:bg-zinc-900'>
							<div className='flex items-center gap-2 text-zinc-700'>
								<Icon icon='HeroBanknotes' className='h-5 w-5' /> Reportes
								Financieros
							</div>
							<Button
								className='mt-3'
								variant='outline'
								color='violet'
								onClick={() => navigate(`/subsidiaries/${sid}/reports/financial`)}>
								Abrir
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default ReportsHome;
