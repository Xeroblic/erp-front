import React, { ReactNode, useEffect, useState, WheelEvent } from 'react';
import Modal, { ModalBody, ModalHeader } from './ui/Modal';

const mergeClasses = (...classes: Array<string | undefined | false>) =>
	classes.filter(Boolean).join(' ');

export interface ImageZoomProps {
	imageUrl: string;
	alt?: string;
	onClose?: () => void;
	withModal?: boolean;
	thumbnailUrl?: string;
	thumbnailAlt?: string;
	thumbnailClassName?: string;
	containerClassName?: string;
	viewerClassName?: string;
	imageClassName?: string;
	modalTitle?: string;
	modalSubtitle?: string;
	previewLabel?: string;
	renderTrigger?: (open: () => void) => ReactNode;
}

const ImageZoomComponent = ({
	imageUrl,
	alt = 'Imagen',
	onClose,
	withModal = true,
	thumbnailUrl,
	thumbnailAlt,
	thumbnailClassName = 'h-28 w-28',
	containerClassName,
	viewerClassName,
	imageClassName,
	modalTitle = 'Imagen ampliada',
	modalSubtitle = 'Haz clic o usa la rueda del ratón para hacer zoom',
	previewLabel = 'Ver imagen',
	renderTrigger,
}: ImageZoomProps) => {
	const [isOpen, setIsOpen] = useState(!withModal);
	const [scale, setScale] = useState(1);
	const [hasOpened, setHasOpened] = useState(false);

	const MIN_SCALE = 1;
	const MAX_SCALE = 4;
	const ZOOM_STEP = 0.25;

	useEffect(() => {
		if (withModal) {
			setIsOpen(false);
			setHasOpened(false);
		} else {
			setIsOpen(true);
		}
	}, [withModal]);

	useEffect(() => {
		setScale(1);
	}, [imageUrl]);

	useEffect(() => {
		if (!withModal || !hasOpened) return;
		if (!isOpen) {
			onClose?.();
		}
	}, [hasOpened, isOpen, onClose, withModal]);

	const clampScale = (value: number) => {
		if (value < MIN_SCALE) return MIN_SCALE;
		if (value > MAX_SCALE) return MAX_SCALE;
		return Number(value.toFixed(2));
	};

	const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
		setScale((prev) => clampScale(prev + delta));
	};

	const handleToggleZoom = () => {
		setScale((prev) => (prev === MIN_SCALE ? clampScale(2) : MIN_SCALE));
	};

	const openModal = () => {
		if (!withModal) return;
		setScale(1);
		setHasOpened(true);
		setIsOpen(true);
	};

	const viewer = (
		<div
			className={mergeClasses(
				'flex max-h-[80vh] min-h-[320px] w-full items-center justify-center overflow-auto rounded-xl bg-black/70 p-4',
				viewerClassName,
			)}
			onClick={handleToggleZoom}
			onWheel={handleWheel}
			role='presentation'>
			<img
				src={imageUrl}
				alt={alt}
				className={mergeClasses('max-h-full max-w-full select-none', imageClassName)}
				style={{
					transform: `scale(${scale})`,
					transition: 'transform 150ms ease',
					cursor: scale === MIN_SCALE ? 'zoom-in' : 'zoom-out',
				}}
				draggable={false}
			/>
		</div>
	);

	if (!withModal) {
		return <div className={containerClassName}>{viewer}</div>;
	}

	const defaultTrigger = (
		<button
			type='button'
			className={mergeClasses(
				'group relative inline-flex cursor-zoom-in overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg',
				thumbnailClassName,
			)}
			onClick={openModal}>
			<img
				src={thumbnailUrl ?? imageUrl}
				alt={thumbnailAlt ?? alt}
				className='h-full w-full object-cover'
			/>
			<span className='pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-xs font-medium uppercase tracking-wide text-white transition group-hover:bg-black/80'>
				{previewLabel}
			</span>
		</button>
	);

	return (
		<div className={mergeClasses('flex flex-col gap-4', containerClassName)}>
			{renderTrigger ? renderTrigger(openModal) : defaultTrigger}

			<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg' isCentered>
				<ModalHeader>
					<div className='flex flex-col'>
						<span className='text-base'>{modalTitle}</span>
						<span className='text-xs font-normal text-slate-500'>{modalSubtitle}</span>
					</div>
				</ModalHeader>
				<ModalBody className='bg-gray-900/70'>{viewer}</ModalBody>
			</Modal>
		</div>
	);
};

export { ImageZoomComponent as ImageZoom };
export default ImageZoomComponent;
