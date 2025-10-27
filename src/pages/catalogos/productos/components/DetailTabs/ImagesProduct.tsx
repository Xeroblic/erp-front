import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
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
	const [isDragging, setIsDragging] = React.useState(false);
	const [hoveredImage, setHoveredImage] = React.useState<string | null>(null);
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

	const hasMainImage = !!productImage?.url;

	return (
		<div className='space-y-6'>
			<Alert color='yellow' icon='HeroExclamationTriangle' variant='outline'>
				<div className='text-sm'>
					<strong>Importante:</strong> No subas la misma imagen como principal y en
					galería. Si eliminas una, se borrarán ambas porque comparten el mismo archivo.
				</div>
			</Alert>

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
						<div
							className='group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
							onMouseEnter={() => setHoveredImage(productImage.url)}
							onMouseLeave={() => setHoveredImage(null)}>
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
						<div className='relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
							{productGallery.map((image, index) => (
								<div
									key={image.id || index}
									className='group relative overflow-visible rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800'
									onMouseEnter={() => setHoveredImage(image.url)}
									onMouseLeave={() => setHoveredImage(null)}>
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
												if (
													image.url &&
													e.currentTarget.src !== image.url
												) {
													e.currentTarget.src = image.url;
												}
											}}
										/>
									</div>

									{image.id && onDeleteImage && (
										<Button
											size='sm'
											color='red'
											className='absolute right-2 top-2 z-10 opacity-0 shadow-xl transition-opacity group-hover:opacity-100'
											onClick={(e) => {
												e.stopPropagation();
												onDeleteImage(image.id!);
											}}>
											<Icon icon='HeroTrash' className='h-4 w-4' />
										</Button>
									)}

									<div className='absolute bottom-2 right-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm'>
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

			{hoveredImage && (
				<div
					className='pointer-events-none fixed z-[9999] flex items-center justify-center'
					style={{
						left: '50%',
						top: '50%',
						transform: 'translate(-50%, -50%)',
					}}>
					<div className='rounded-xl border-4 border-white bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800'>
						<img
							src={hoveredImage}
							alt='Preview'
							className='max-h-[80vh] max-w-[80vw] rounded-lg object-contain'
							style={{
								minWidth: '400px',
								minHeight: '400px',
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ImagesProduct;
