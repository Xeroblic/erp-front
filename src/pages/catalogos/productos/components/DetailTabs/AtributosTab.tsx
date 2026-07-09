import React, { useCallback, useState } from 'react';
import Icon from '@/components/icon/Icon';
import DynamicAttributesEditor from './DynamicAttributesEditor';
import { AttributesTabPanel } from './AttributesTab';
import type { IProduct } from '@/interface/product.interface';

interface AtributosTabProps {
	loading?: boolean;
	product?: IProduct | null;
	updateProduct?: (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => Promise<void>;
}

type AttrView = 'catalog' | 'review';

const AtributosTab: React.FC<AtributosTabProps> = ({
	loading = false,
	product = null,
	updateProduct,
}) => {
	const [view, setView] = useState<AttrView>('review');

	const switchTo = useCallback((v: AttrView) => setView(v), []);

	if (loading) {
		return (
			<div className='flex items-center gap-3 py-8 text-sm text-neutral-500'>
				<Icon icon='HeroArrowPath' className='h-4 w-4 animate-spin' />
				Cargando atributos del producto...
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* View switcher */}
			<div className='flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800/50'>
				<button
					type='button'
					onClick={() => switchTo('review')}
					className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
						view === 'review'
							? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400'
							: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
					}`}>
					<Icon icon='HeroClipboardDocumentCheck' className='h-4 w-4' />
					Revisión técnica
				</button>
				<button
					type='button'
					onClick={() => switchTo('catalog')}
					className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
						view === 'catalog'
							? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400'
							: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
					}`}>
					<Icon icon='HeroCog6Tooth' className='h-4 w-4' />
					Catálogo (specs)
				</button>
			</div>

			{/* Active view */}
			{view === 'review' ? (
				<AttributesTabPanel product={product} updateProduct={updateProduct} />
			) : (
				<DynamicAttributesEditor product={product} updateProduct={updateProduct} />
			)}
		</div>
	);
};

export default AtributosTab;
