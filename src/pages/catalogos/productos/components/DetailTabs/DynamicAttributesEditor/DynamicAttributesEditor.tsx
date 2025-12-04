import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useDynamicAttributesEditor } from './hooks/useDynamicAttributesEditor';
import BasicConfigurationSection from './sections/BasicConfigurationSection';
import CpuSection from './sections/CpuSection';
import RamSection from './sections/RamSection';
import StorageSection from './sections/StorageSection';
import GpuSection from './sections/GpuSection';
import DisplaySection from './sections/DisplaySection';
import OsSection from './sections/OsSection';
import ConnectivitySection from './sections/ConnectivitySection';
import PackagingSection from './sections/PackagingSection';
import CameraSection from './sections/CameraSection';
import AudioSection from './sections/AudioSection';
import KeyboardSection from './sections/KeyboardSection';
import MonitorExtrasSection from './sections/MonitorExtrasSection';
import NotesSection from './sections/NotesSection';
import JsonPreviewSection from './sections/JsonPreviewSection';
import { useAttributesValidator } from '@/pages/catalogos/productos/hooks/useAttributesValidator';
import REQUIRED_ATTRIBUTES_BY_TYPE from '@/pages/catalogos/productos/constants/requiredAttributesByType';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IProduct } from '@/interface/product.interface';

const DynamicAttributesEditor: React.FC<{
	product?: IProduct | null;
	updateProduct?: (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => Promise<void>;
}> = ({ product = null, updateProduct }) => {
	const { attributes, updateAttribute, currentProductKind, currentCpuBrand, isFieldVisible } =
		useDynamicAttributesEditor();

	const [autoSavedPending, setAutoSavedPending] = useState(false);

	// decide required paths for validator
	const requiredForType =
		REQUIRED_ATTRIBUTES_BY_TYPE[
			(product?.product_type as string) ?? currentProductKind ?? 'general'
		] ?? undefined;

	const {
		ok: attributesComplete,
		missingCount,
		missingLabels,
	} = useAttributesValidator(
		(product?.product_type as string) ?? currentProductKind,
		attributes,
		{ requiredPaths: requiredForType, treatEmptyStringAsMissing: true },
	);

	// When attributes become complete, set product_status to 'pending' (persist via updateProduct if available)
	useEffect(() => {
		if (!product) return;
		if (attributesComplete) {
			// if product is already validated or pending, no-op
			if (
				product.product_status === 'validated' ||
				product.product_status === 'pending' ||
				product.product_status === 'rejected'
			)
				return;
			// avoid double calls
			if (autoSavedPending) return;
			setAutoSavedPending(true);
			(async () => {
				try {
					if (updateProduct) {
						await updateProduct({ data: { product_status: 'pending' } });
						toast.success('El estado del producto se actualizó a Pendiente');
					}
				} catch (e) {
					toast.error('No se pudo actualizar el estado a Pendiente');
				} finally {
					setAutoSavedPending(false);
				}
			})();
		}
	}, [attributesComplete, product, updateProduct, autoSavedPending]);

	return (
		<div className='space-y-6'>
			{/* Estado y acciones de publicación */}
			<div className='flex items-center justify-between gap-4'>
				<div>
					{product && product.product_status === 'rejected' ? (
						<div className='flex items-center gap-3'>
							<Badge color='red'>Rechazado</Badge>
							{!attributesComplete && (
								<span className='text-sm text-neutral-500'>
									{missingCount} atributos incompletos
								</span>
							)}
						</div>
					) : !attributesComplete ? (
						<div className='flex items-center gap-3'>
							<Badge color='amber'>En revisión</Badge>
							<span className='text-sm text-neutral-500'>
								{missingCount} atributos incompletos
							</span>
						</div>
					) : product && product.product_status === 'validated' ? (
						<Badge color='emerald'>Publicado</Badge>
					) : (
						<Badge color='amber'>Pendiente</Badge>
					)}
				</div>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={async () => {
							if (!product || !updateProduct) return;
							try {
								await updateProduct({ data: { product_status: 'rejected' } });
								toast.success('Producto marcado como Rechazado');
							} catch (e) {
								toast.error('No se pudo actualizar el estado');
							}
						}}
						icon='HeroXMark'
						className='hidden sm:inline-flex'>
						Rechazar
					</Button>
					<Button
						variant='solid'
						color='emerald'
						size='sm'
						isDisable={!attributesComplete}
						onClick={async () => {
							if (!product || !updateProduct) return;
							if (!attributesComplete) {
								toast.error('Completa todos los atributos antes de publicar');
								return;
							}
							try {
								await updateProduct({ data: { product_status: 'validated' } });
								toast.success('Producto publicado');
							} catch (e) {
								toast.error('No se pudo publicar el producto');
							}
						}}
						icon='HeroCheck'>
						Aceptar y Publicar
					</Button>
				</div>
			</div>

			<BasicConfigurationSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<CpuSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentCpuBrand={currentCpuBrand}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<RamSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<StorageSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<GpuSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<DisplaySection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<OsSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<ConnectivitySection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<PackagingSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<CameraSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<AudioSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<KeyboardSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<MonitorExtrasSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<NotesSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<JsonPreviewSection />
		</div>
	);
};

export default DynamicAttributesEditor;
