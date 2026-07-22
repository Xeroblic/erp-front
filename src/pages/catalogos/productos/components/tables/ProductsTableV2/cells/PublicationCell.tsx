import React from 'react';
import Badge from '@/components/ui/Badge';
import { useAttributesValidator } from '@/pages/catalogos/productos/hooks/useAttributesValidator';
import REQUIRED_ATTRIBUTES_BY_TYPE from '@/pages/catalogos/productos/constants/requiredAttributesByType';
import type { IProduct } from '@/interface/product.interface';

const IncompleteAttributes: React.FC<{ missingCount: number; missingLabels?: string[] }> = ({
	missingCount,
	missingLabels,
}) => (
	<div>
		<Badge variant='outline' color='amber'>
			En revisión
		</Badge>
		<div className='mt-1 text-xs text-neutral-500'>
			{missingCount} atributos incompletos
			{Array.isArray(missingLabels) && missingLabels.length > 0 && (
				<div className='mt-1 text-xs text-neutral-400' title={missingLabels.join(', ')}>
					Ver campos faltantes
				</div>
			)}
		</div>
	</div>
);

const PublicationCell: React.FC<{ product: IProduct }> = ({ product }) => {
	// use hook to validate attributes (frontend-only). No new attribute defs created.
	const requiredForType = REQUIRED_ATTRIBUTES_BY_TYPE[product.product_type ?? ''] ?? undefined;
	const {
		ok: attributesComplete,
		missingCount,
		missingLabels,
	} = useAttributesValidator(product.product_type, product.attributes_json, {
		requiredPaths: requiredForType,
		treatEmptyStringAsMissing: true,
	});

	const status = product.product_status;

	// Archivado - prioridad máxima
	if (status === 'archived') {
		return (
			<div className='flex flex-col gap-1.5'>
				<div>
					<Badge variant='outline' color='zinc'>
						Archivado
					</Badge>
					<div className='mt-1 text-xs text-neutral-500'>Producto archivado</div>
				</div>
			</div>
		);
	}

	// Rechazado
	if (status === 'rejected') {
		return (
			<div className='flex flex-col gap-1.5'>
				<div>
					<Badge variant='outline' color='red'>
						Rechazado
					</Badge>
					{!attributesComplete ? (
						<div className='mt-1 text-xs text-neutral-500'>
							{missingCount} atributos incompletos
						</div>
					) : (
						<div className='text-xs text-neutral-500'>Revisar observaciones</div>
					)}
				</div>
			</div>
		);
	}

	// Validado/Publicado
	if (status === 'validated') {
		return (
			<div className='flex flex-col gap-1.5'>
				{!attributesComplete ? (
					<IncompleteAttributes
						missingCount={missingCount}
						missingLabels={missingLabels}
					/>
				) : (
					<div>
						<Badge variant='outline' color='emerald'>
							Publicado
						</Badge>
						<div className='text-xs text-neutral-500'>Atributos completos</div>
					</div>
				)}
			</div>
		);
	}

	// Pendiente o cualquier otro estado
	return (
		<div className='flex flex-col gap-1.5'>
			{!attributesComplete ? (
				<IncompleteAttributes missingCount={missingCount} missingLabels={missingLabels} />
			) : (
				<div>
					<Badge variant='outline' color='amber'>
						Pendiente
					</Badge>
					<div className='text-xs text-neutral-500'>Atributos completos</div>
				</div>
			)}
		</div>
	);
};

export default PublicationCell;
