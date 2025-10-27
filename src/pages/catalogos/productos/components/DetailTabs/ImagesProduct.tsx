import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import React from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '../../types/products.types';
import type { IProductImage } from '@/interface/product.interface';

interface ContenidoTabProps {
	onUploadMainImage?: (file?: File | null) => Promise<void>;
	onUploadGalleryImage?: (file?: File | null) => Promise<void>;
	onOpenLibrary?: () => void;
	productImage?: IProductImage | null;
	productGallery?: Array<IProductImage> | null;
	onDeleteImage?: (imageId: number) => Promise<void>;
}

const ImagesProduct: React.FC<ContenidoTabProps> = ({
	onUploadMainImage,
	onUploadGalleryImage,
	onOpenLibrary,
	productImage,
	productGallery,
	onDeleteImage,
}) => {
	const mainImageRef = React.useRef<HTMLInputElement | null>(null);
	const galleryImageRef = React.useRef<HTMLInputElement | null>(null);
	const imageContainerRef = React.useRef<HTMLDivElement | null>(null);
	const [isDragging, setIsDragging] = React.useState(false);
	const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
	const [modalOpen, setModalOpen] = React.useState(false);
	const [isZoomed, setIsZoomed] = React.useState(false);
	const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
	const { values } = useFormikContext<ProductDetailForm>();

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const files = Array.from(e.dataTransfer.files);
		const imageFile = files.find((f) => f.type.startsWith('image/'));

		if (imageFile && onUploadGalleryImage) {
			await onUploadGalleryImage(imageFile);
		}
	};

	const handleMainImageSelect = async () => {
		const file = mainImageRef.current?.files?.[0] ?? null;
		if (!file) return;
		await onUploadMainImage?.(file);
		if (mainImageRef.current) mainImageRef.current.value = '';
	};

	const handleGalleryImageSelect = async () => {
		const file = galleryImageRef.current?.files?.[0] ?? null;
		if (!file) return;
		await onUploadGalleryImage?.(file);
		if (galleryImageRef.current) galleryImageRef.current.value = '';
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!isZoomed || !imageContainerRef.current) return;

		const rect = imageContainerRef.current.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;

		setMousePosition({ x, y });
	};

	const handleImageClick = () => {
		setIsZoomed(!isZoomed);
	};

	const handleCloseLightbox = () => {
		console.log('🚪 handleCloseLightbox llamado');
		setLightboxImage(null);
		setModalOpen(false);
		setIsZoomed(false);
		setMousePosition({ x: 50, y: 50 });
	};

	// Debug: ver cuando cambia lightboxImage
	React.useEffect(() => {
		console.log('🖼️ lightboxImage cambió a:', lightboxImage);
		console.log('🔓 Modal isOpen:', !!lightboxImage);
	}, [lightboxImage]);

	// Sincronizar modalOpen con lightboxImage
	React.useEffect(() => {
		if (lightboxImage) {
			console.log('📂 Abriendo modal con imagen:', lightboxImage);
			setModalOpen(true);
		}
	}, [lightboxImage]);

	return (
		<div className='space-y-6'>
			{/* Alerta informativa */}
			<Alert color='yellow' icon='HeroExclamationTriangle' variant='outline'>
				<div className='text-sm'>
					<strong>Importante:</strong> No subas la misma imagen como principal y en
					galería. Si eliminas una, se borrarán ambas porque comparten el mismo archivo.
				</div>
			</Alert>

			{/* Zona de Upload */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Gestión de Imágenes del Producto</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`rounded-lg border-2 border-dashed p-8 text-center transition-all ${
							isDragging
								? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
								: 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'
						}`}>
						<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800'>
							<Icon
								icon='HeroCloudArrowUp'
								className={`h-8 w-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
							/>
						</div>
						<p className='mb-1 text-sm font-medium text-gray-900 dark:text-white'>
							Arrastra imágenes aquí o haz clic en los botones
						</p>
						<p className='mb-6 text-xs text-gray-500 dark:text-gray-400'>
							PNG, JPG, WEBP hasta 10MB
						</p>

						<Input
							name='main-image'
							ref={mainImageRef}
							type='file'
							accept='image/*'
							className='hidden'
							id='product-main-image-input'
							onChange={handleMainImageSelect}
						/>
						<Input
							name='gallery-image'
							ref={galleryImageRef}
							type='file'
							accept='image/*'
							className='hidden'
							id='product-gallery-image-input'
							onChange={handleGalleryImageSelect}
						/>

						<div className='flex flex-wrap items-center justify-center gap-3'>
							<Button
								variant='solid'
								color='blue'
								onClick={() => mainImageRef.current?.click()}>
								<Icon icon='HeroStar' className='mr-2 h-5 w-5' />
								Subir imagen principal
							</Button>
							<Button
								variant='solid'
								color='green'
								onClick={() => galleryImageRef.current?.click()}>
								<Icon icon='HeroPhoto' className='mr-2 h-5 w-5' />
								Agregar a galería
							</Button>
							<Button variant='outline' onClick={() => onOpenLibrary?.()}>
								<Icon icon='HeroFolder' className='mr-2 h-5 w-5' />
								Biblioteca
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Imagen Principal */}
			{productImage && (
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600'>
									<Icon icon='HeroStar' className='h-5 w-5 text-white' />
								</div>
								<div>
									<CardTitle>Imagen Principal</CardTitle>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										Esta es la imagen destacada del producto
									</p>
								</div>
							</div>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
							<div className='aspect-video w-full overflow-hidden bg-gray-50 dark:bg-gray-900'>
								<img
									src={productImage.url}
									alt={productImage.alt || 'Imagen principal'}
									className='h-full w-full object-contain transition-transform duration-300 group-hover:scale-105'
									onError={(e) => {
										console.error(
											'Error cargando imagen principal:',
											productImage.url,
										);
										console.log('productImage completo:', productImage);
										// Intentar con thumb si url falla
										if (
											productImage.thumb &&
											e.currentTarget.src !== productImage.thumb
										) {
											e.currentTarget.src = productImage.thumb;
										}
									}}
								/>
							</div>
							<div className='absolute inset-0 flex items-center justify-center gap-3 bg-black/80 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100'>
								<Button
									size='lg'
									variant='solid'
									className='bg-white text-gray-900 shadow-2xl ring-4 ring-white/50 hover:scale-110 hover:bg-gray-100'
									onClick={() => setLightboxImage(productImage.url)}>
									<Icon icon='HeroMagnifyingGlassPlus' className='mr-2 h-5 w-5' />
									Ampliar
								</Button>
								{productImage.id && onDeleteImage && (
									<Button
										size='lg'
										color='red'
										className='shadow-2xl ring-4 ring-red-300/50 hover:scale-110'
										onClick={() => onDeleteImage(productImage.id!)}>
										<Icon icon='HeroTrash' className='mr-2 h-5 w-5' />
										Eliminar
									</Button>
								)}
							</div>
							{productImage.alt && (
								<div className='border-t border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'>
									{productImage.alt}
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Galería */}
			{productGallery && productGallery.length > 0 && (
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-600'>
									<Icon icon='HeroPhoto' className='h-5 w-5 text-white' />
								</div>
								<div>
									<CardTitle>Galería de Imágenes</CardTitle>
									<p className='text-sm text-gray-500 dark:text-gray-400'>
										{productGallery.length}{' '}
										{productGallery.length === 1
											? 'imagen adicional'
											: 'imágenes adicionales'}
									</p>
								</div>
							</div>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
							{productGallery.map((image, index) => (
								<div
									key={image.id || index}
									className='group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800'>
									<div className='aspect-square w-full overflow-hidden bg-gray-50 dark:bg-gray-900'>
										<img
											src={image.thumb || image.url}
											alt={image.alt || `Imagen ${index + 1}`}
											className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-110'
											onError={(e) => {
												console.error(
													`Error cargando imagen galería #${index + 1}:`,
													image.thumb || image.url,
												);
												console.log('image completo:', image);
												// Intentar con url completa si thumb falla
												if (
													image.url &&
													e.currentTarget.src !== image.url
												) {
													e.currentTarget.src = image.url;
												}
											}}
										/>
									</div>

									<div className='absolute inset-0 flex items-center justify-center gap-3 bg-black/85 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100'>
										<Button
											size='sm'
											variant='solid'
											className='bg-white text-gray-900 shadow-2xl ring-4 ring-white/50 hover:scale-110 hover:bg-gray-100'
											onClick={(e) => {
												e.stopPropagation();
												console.log('Click en ampliar, URL:', image.url);
												console.log(
													'Estado anterior lightboxImage:',
													lightboxImage,
												);
												setLightboxImage(image.url);
												console.log('Después de setLightboxImage');
											}}>
											<Icon
												icon='HeroMagnifyingGlassPlus'
												className='h-4 w-4'
											/>
										</Button>
										{image.id && onDeleteImage && (
											<Button
												size='sm'
												color='red'
												className='shadow-2xl ring-4 ring-red-300/50 hover:scale-110'
												onClick={(e) => {
													e.stopPropagation();
													onDeleteImage(image.id!);
												}}>
												<Icon icon='HeroTrash' className='h-4 w-4' />
											</Button>
										)}
									</div>

									<div className='absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm'>
										#{index + 1}
									</div>

									{image.alt && (
										<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
											{image.alt}
										</div>
									)}
								</div>
							))}
						</div>
					</CardBody>
				</Card>
			)}

			{/* Estado vacío */}
			{!productImage && (!productGallery || productGallery.length === 0) && (
				<Card>
					<CardBody>
						<div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-900/50'>
							<div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800'>
								<Icon icon='HeroPhoto' className='h-10 w-10 text-gray-300' />
							</div>
							<p className='mb-1 text-base font-semibold text-gray-900 dark:text-white'>
								No hay imágenes cargadas
							</p>
							<p className='text-sm text-gray-500 dark:text-gray-400'>
								Usa los botones de arriba para comenzar
							</p>
						</div>
					</CardBody>
				</Card>
			)}

			{/* Lightbox Modal con Zoom */}
			<Modal isOpen={modalOpen} setIsOpen={setModalOpen} size='lg'>
				<ModalHeader setIsOpen={setModalOpen}>
					<div className='flex items-center justify-between'>
						<span>Vista Ampliada</span>
						<Button
							size='sm'
							variant='outline'
							onClick={(e) => {
								e.stopPropagation();
								setIsZoomed(!isZoomed);
							}}>
							<Icon
								icon={
									isZoomed
										? 'HeroMagnifyingGlassMinus'
										: 'HeroMagnifyingGlassPlus'
								}
								className='mr-2 h-4 w-4'
							/>
							{isZoomed ? 'Zoom Out' : 'Zoom In'}
						</Button>
					</div>
				</ModalHeader>
				<ModalBody>
					{lightboxImage && (
						<div
							ref={imageContainerRef}
							className='relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900'
							style={{ height: '70vh' }}>
							<div
								className={`relative h-full w-full ${
									isZoomed ? 'cursor-move' : 'cursor-zoom-in'
								}`}
								onMouseMove={handleMouseMove}
								onClick={handleImageClick}>
								<img
									src={lightboxImage}
									alt='Vista ampliada'
									className='pointer-events-none absolute left-1/2 top-1/2 select-none transition-transform duration-150 ease-out'
									draggable={false}
									style={{
										transform: isZoomed
											? `translate(-50%, -50%) translate(${(50 - mousePosition.x) * 2.5}%, ${(50 - mousePosition.y) * 2.5}%) scale(2.5)`
											: 'translate(-50%, -50%)',
										maxWidth: isZoomed ? 'none' : '90%',
										maxHeight: isZoomed ? 'none' : '90%',
										width: isZoomed ? 'auto' : 'auto',
										height: isZoomed ? 'auto' : 'auto',
										objectFit: 'contain',
									}}
								/>
							</div>
							{!isZoomed && (
								<div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity hover:opacity-100'>
									<div className='rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xl dark:bg-gray-800 dark:text-white'>
										<Icon
											icon='HeroMagnifyingGlassPlus'
											className='mr-2 inline h-5 w-5'
										/>
										Haz clic para hacer zoom
									</div>
								</div>
							)}
							{isZoomed && (
								<div className='pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-sm'>
									<Icon
										icon='HeroCursorArrowRays'
										className='mr-2 inline h-4 w-4'
									/>
									Mueve el cursor para explorar • Click para salir del zoom
								</div>
							)}
						</div>
					)}
				</ModalBody>
			</Modal>
		</div>
	);
};

export default ImagesProduct;
