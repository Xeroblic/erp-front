import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import { ImageZoom } from '@/components/ImageZoom';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import type { IBrand } from '@/interface/brand.interface';

interface BrandLogoProps {
	brand: IBrand;
	className?: string;
	iconClassName?: string;
	/** Si hay imagen, al hacer clic abre el visor (ImageZoom). */
	zoomable?: boolean;
}

/**
 * Logo de la marca. Intenta la imagen principal y, si falla, el thumb; si no
 * hay ninguna o todas fallan, cae a un icono. Con `zoomable`, al hacer clic
 * abre el visor de imagen.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ brand, className, iconClassName, zoomable }) => {
	const candidates = useMemo(() => {
		const imageObj = brand.image;
		const stringImage =
			typeof (brand as { image?: unknown }).image === 'string'
				? (brand as { image?: string }).image
				: null;
		const list = [imageObj?.url, imageObj?.thumb, stringImage, brand.logo_url, brand.photo_url]
			.map((v) => ensureAbsoluteUrl(v ?? undefined))
			.filter((v): v is string => Boolean(v));
		return Array.from(new Set(list));
	}, [brand]);

	const [index, setIndex] = useState(0);

	useEffect(() => {
		setIndex(0);
	}, [brand.id]);

	const currentSrc = candidates[index];

	const containerClasses = classNames(
		'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
		className,
	);

	const imageEl = (
		<img
			src={currentSrc}
			alt={brand.image?.alt ?? brand.name}
			loading='lazy'
			className='h-full w-full object-contain p-1'
			onError={() => setIndex((prev) => prev + 1)}
		/>
	);

	if (currentSrc && zoomable) {
		return (
			<ImageZoom
				imageUrl={currentSrc}
				alt={brand.image?.alt ?? brand.name}
				modalTitle={brand.name}
				renderTrigger={(open) => (
					<button
						type='button'
						onClick={open}
						className={classNames(containerClasses, 'cursor-zoom-in')}>
						{imageEl}
					</button>
				)}
			/>
		);
	}

	return (
		<div className={containerClasses}>
			{currentSrc ? (
				imageEl
			) : (
				<Icon
					icon='HeroTag'
					className={classNames('text-violet-500', iconClassName ?? 'h-6 w-6')}
				/>
			)}
		</div>
	);
};

export default BrandLogo;
