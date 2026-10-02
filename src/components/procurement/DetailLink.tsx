import React, { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import useCan from '@/hooks/useCan';
import type { IPageLink } from '@/config/procurementLinks';

export interface IDetailLinkProps {
	/** Destino con su permiso, o `null` cuando no hay ficha real a la que ir. */
	link: IPageLink | null;
	/**
	 * Contexto para lector de pantalla que antecede al texto visible («Ficha
	 * del proveedor»), para que el enlace no se anuncie sólo como un número.
	 */
	srLabel: string;
	children: ReactNode;
}

/**
 * Referencia cruzada entre fichas del módulo de abastecimiento. Es enlace sólo
 * si hay destino y quien mira tiene **todo** el `authority` de esa ruta (la
 * misma regla de `AuthorityCheck`); si no, deja el texto tal cual, sin pistas
 * de un enlace que no podría abrir.
 */
const DetailLink: FC<IDetailLinkProps> = ({ link, srLabel, children }) => {
	const { all } = useCan();

	if (!link || !all([...link.authority])) return <span>{children}</span>;

	return (
		<Link
			to={link.to}
			className='rounded-sm text-blue-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400'>
			<span className='sr-only'>{srLabel}: </span>
			{children}
		</Link>
	);
};

export default DetailLink;
