import React, { useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ImportTermsWizard from '@/components/integrations/importTerms/ImportTermsWizard';

export const ImportTermsContent: React.FC = () => {
	const [wizardOpen, setWizardOpen] = useState(false);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-semibold'>Importar Categorías y Marcas</span>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<Card className='border border-neutral-100/70 bg-white/95 shadow-lg shadow-black/10 dark:border-white/5 dark:bg-neutral-900/80'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Importación de términos desde WooCommerce</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='space-y-5'>
							<p className='text-sm text-zinc-600 dark:text-zinc-300'>
								Trae masivamente las categorías y marcas de la tienda virtual hacia
								el ERP. Útil en la configuración inicial de la integración para
								mapear el catálogo existente. La importación se ejecuta en segundo
								plano.
							</p>
							<div className='rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/20 dark:text-sky-100'>
								<Icon icon='HeroInformationCircle' className='me-1 inline' />
								La importación está pensada para vincular/actualizar los términos
								existentes en lugar de duplicarlos. Evita lanzar varias
								importaciones a la vez mientras una está en curso.
							</div>
							<Button
								variant='solid'
								color='indigo'
								icon='HeroArrowDownTray'
								onClick={() => setWizardOpen(true)}>
								Importar términos
							</Button>
						</div>
					</CardBody>
				</Card>
			</Container>

			<ImportTermsWizard isOpen={wizardOpen} setIsOpen={setWizardOpen} />
		</>
	);
};

const ImportTermsPage: React.FC = () => (
	<PageWrapper name='Importar Términos'>
		<ImportTermsContent />
	</PageWrapper>
);

export default ImportTermsPage;
