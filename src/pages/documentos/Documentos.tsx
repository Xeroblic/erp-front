/**
 * Sistema de Gestión de Documentos
 * CU012 - CRUD completo de documentos asociados a entidades
 */
import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardBody, CardTitle, CardFooter } from '../../components/ui/Card';
import Container from '../../components/layouts/Container/Container';
import PageWrapper from '../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../components/layouts/Subheader/Subheader';
import Icon from '../../components/icon/Icon';
import Input from '../../components/form/Input';
import SelectReact from '../../components/form/SelectReact';
import Select from '../../components/form/Select';
import Textarea from '../../components/form/Textarea';
import Checkbox from '../../components/form/Checkbox';
import Label from '../../components/form/Label';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../components/ui/Modal';
import { TSelectOption, TSelectOptions } from '../../components/form/SelectReact';

// Tipos específicos del módulo
import {
	IDocument,
	IDocumentFilters,
	IDocumentStats,
	IDocumentPayload,
	TDocumentType,
	TFileType,
	TRelatedModule,
	DOCUMENT_TYPES,
	FILE_TYPES,
	RELATED_MODULES,
} from './types/documentos.types';

const Documentos: React.FC = () => {
	// Estados principales
	const [documents, setDocuments] = useState<IDocument[]>([]);
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState<IDocumentStats | null>(null);

	// Estados para filtros
	const [filters, setFilters] = useState<IDocumentFilters>({
		search: '',
		document_type: undefined,
		file_type: undefined,
		related_module: undefined,
		related_id: undefined,
		is_active: undefined,
	});

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);

	// Opciones para los select
	const documentTypeOptions: TSelectOptions = DOCUMENT_TYPES.map((type) => ({
		value: type.value,
		label: type.label,
	}));

	const fileTypeOptions: TSelectOptions = FILE_TYPES.map((type) => ({
		value: type.value,
		label: type.label,
	}));

	const moduleOptions: TSelectOptions = RELATED_MODULES.map((module) => ({
		value: module.value,
		label: module.label,
	}));

	const statusOptions: TSelectOptions = [
		{ value: 'true', label: 'Activo' },
		{ value: 'false', label: 'Inactivo' },
	];

	// Cargar datos iniciales
	useEffect(() => {
		loadDocuments();
		loadStats();
	}, [filters]);

	const loadDocuments = async () => {
		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 800));

			const mockDocuments: IDocument[] = [
				{
					id: 1,
					company_id: 1,
					name: 'Contrato de Servicios Cliente VIP',
					file_path: '/documents/contratos/contrato_cliente_vip_2024.pdf',
					file_type: 'pdf',
					document_type: 'contrato',
					related_module: 'customer',
					related_id: 1,
					description:
						'Contrato de servicios premium para cliente VIP con condiciones especiales',
					file_size: 2048576,
					is_active: true,
					uploaded_by: 1,
					uploaded_by_name: 'Carlos Rodríguez',
					created_at: '2024-01-15T10:30:00Z',
					updated_at: '2024-01-20T14:15:00Z',
				},
				{
					id: 2,
					company_id: 1,
					name: 'Manual de Producto - Laptop Pro',
					file_path: '/documents/manuales/laptop_pro_manual_usuario.pdf',
					file_type: 'pdf',
					document_type: 'manual',
					related_module: 'product',
					related_id: 1,
					description: 'Manual de usuario completo para el producto Laptop Pro',
					file_size: 5120000,
					is_active: true,
					uploaded_by: 2,
					uploaded_by_name: 'Ana García',
					created_at: '2024-01-10T08:45:00Z',
					updated_at: '2024-01-18T16:30:00Z',
				},
				{
					id: 3,
					company_id: 1,
					name: 'Certificado ISO Proveedor Principal',
					file_path: '/documents/certificados/iso_9001_proveedor_principal.pdf',
					file_type: 'pdf',
					document_type: 'certificado',
					related_module: 'supplier',
					related_id: 1,
					description: 'Certificación ISO 9001:2015 del proveedor principal',
					file_size: 1024000,
					is_active: true,
					uploaded_by: 1,
					uploaded_by_name: 'Carlos Rodríguez',
					created_at: '2024-01-05T12:00:00Z',
					updated_at: '2024-01-05T12:00:00Z',
				},
				{
					id: 4,
					company_id: 1,
					name: 'Cotización Equipos de Oficina',
					file_path: '/documents/cotizaciones/cotizacion_equipos_oficina_2024.xlsx',
					file_type: 'xlsx',
					document_type: 'cotizacion',
					related_module: 'order',
					related_id: 1,
					description: 'Cotización para renovación de equipos de oficina',
					file_size: 512000,
					is_active: true,
					uploaded_by: 3,
					uploaded_by_name: 'Miguel Torres',
					created_at: '2024-01-12T09:15:00Z',
					updated_at: '2024-01-15T11:20:00Z',
				},
				{
					id: 5,
					company_id: 1,
					name: 'Política de Calidad Bodega Central',
					file_path: '/documents/politicas/politica_calidad_bodega_central.docx',
					file_type: 'docx',
					document_type: 'politica',
					related_module: 'warehouse',
					related_id: 1,
					description: 'Políticas y procedimientos de control de calidad',
					file_size: 768000,
					is_active: true,
					uploaded_by: 1,
					uploaded_by_name: 'Carlos Rodríguez',
					created_at: '2024-01-08T14:30:00Z',
					updated_at: '2024-01-22T10:45:00Z',
				},
				{
					id: 99,
					company_id: 1,
					name: 'Documento de Prueba - Eliminable',
					file_path: '/documents/temp/documento_prueba.txt',
					file_type: 'txt',
					document_type: 'otro',
					related_module: 'company',
					related_id: 1,
					description: 'Documento temporal para pruebas de eliminación',
					file_size: 1024,
					is_active: true,
					uploaded_by: 1,
					uploaded_by_name: 'Carlos Rodríguez',
					created_at: '2024-01-25T16:00:00Z',
					updated_at: '2024-01-25T16:00:00Z',
				},
			];

			// Aplicar filtros
			let filteredDocuments = mockDocuments;

			if (filters.search) {
				filteredDocuments = filteredDocuments.filter(
					(doc) =>
						doc.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
						doc.description?.toLowerCase().includes(filters.search!.toLowerCase()) ||
						doc.uploaded_by_name?.toLowerCase().includes(filters.search!.toLowerCase()),
				);
			}

			if (filters.document_type) {
				filteredDocuments = filteredDocuments.filter(
					(doc) => doc.document_type === filters.document_type,
				);
			}

			if (filters.file_type) {
				filteredDocuments = filteredDocuments.filter(
					(doc) => doc.file_type === filters.file_type,
				);
			}

			if (filters.related_module) {
				filteredDocuments = filteredDocuments.filter(
					(doc) => doc.related_module === filters.related_module,
				);
			}

			if (filters.related_id) {
				filteredDocuments = filteredDocuments.filter(
					(doc) => doc.related_id === filters.related_id,
				);
			}

			if (filters.is_active !== undefined) {
				filteredDocuments = filteredDocuments.filter(
					(doc) => doc.is_active === filters.is_active,
				);
			}

			setDocuments(filteredDocuments);
		} catch (error) {
			console.error('Error loading documents:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadStats = async () => {
		try {
			const mockStats: IDocumentStats = {
				total_documents: 6,
				active_documents: 6,
				total_size: 10477600, // ~10MB
				documents_by_type: [
					{ type: 'contrato', count: 1 },
					{ type: 'manual', count: 1 },
					{ type: 'certificado', count: 1 },
					{ type: 'cotizacion', count: 1 },
					{ type: 'politica', count: 1 },
					{ type: 'otro', count: 1 },
				],
				documents_by_module: [
					{ module: 'customer', count: 1 },
					{ module: 'product', count: 1 },
					{ module: 'supplier', count: 1 },
					{ module: 'order', count: 1 },
					{ module: 'warehouse', count: 1 },
					{ module: 'company', count: 1 },
				],
				recent_uploads: 3,
			};

			setStats(mockStats);
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	};

	// Funciones de manejo de filtros
	const handleFilterChange = (key: keyof IDocumentFilters, value: any) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const clearFilters = () => {
		setFilters({
			search: '',
			document_type: undefined,
			file_type: undefined,
			related_module: undefined,
			related_id: undefined,
			is_active: undefined,
		});
	};

	// Funciones de manejo de modales
	const handleCreateDocument = () => {
		setCreateModalOpen(true);
	};

	const handleEditDocument = (document: IDocument) => {
		setSelectedDocument(document);
		setEditModalOpen(true);
	};

	const handleViewDocument = (document: IDocument) => {
		setSelectedDocument(document);
		setViewModalOpen(true);
	};

	const handleDeleteDocument = (document: IDocument) => {
		setSelectedDocument(document);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedDocument) return;

		try {
			console.log('Deleting document:', selectedDocument.id);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setDeleteModalOpen(false);
			setSelectedDocument(null);
			await Promise.all([loadDocuments(), loadStats()]);
		} catch (error) {
			console.error('Error deleting document:', error);
		}
	};

	// Funciones de manejo de formularios
	const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		try {
			const newDocument: IDocumentPayload = {
				name: formData.get('name') as string,
				file_path: formData.get('file_path') as string,
				file_type: formData.get('file_type') as TFileType,
				document_type: formData.get('document_type') as TDocumentType,
				related_module: formData.get('related_module') as TRelatedModule,
				related_id: parseInt(formData.get('related_id') as string),
				description: (formData.get('description') as string) || undefined,
				is_active: formData.get('is_active') === 'on',
			};

			console.log('Creating document:', newDocument);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setCreateModalOpen(false);
			await Promise.all([loadDocuments(), loadStats()]);
		} catch (error) {
			console.error('Error creating document:', error);
		}
	};

	const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selectedDocument) return;

		const formData = new FormData(e.currentTarget);

		try {
			const updatedDocument: IDocumentPayload = {
				name: formData.get('name') as string,
				file_path: formData.get('file_path') as string,
				file_type: formData.get('file_type') as TFileType,
				document_type: formData.get('document_type') as TDocumentType,
				related_module: formData.get('related_module') as TRelatedModule,
				related_id: parseInt(formData.get('related_id') as string),
				description: (formData.get('description') as string) || undefined,
				is_active: formData.get('is_active') === 'on',
			};

			console.log('Updating document:', updatedDocument);
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setEditModalOpen(false);
			setSelectedDocument(null);
			await Promise.all([loadDocuments(), loadStats()]);
		} catch (error) {
			console.error('Error updating document:', error);
		}
	};

	// Funciones de utilidad
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getFileIcon = (fileType: TFileType): string => {
		switch (fileType) {
			case 'pdf':
				return 'HeroDocumentText';
			case 'doc':
			case 'docx':
				return 'HeroDocument';
			case 'xls':
			case 'xlsx':
				return 'HeroTableCells';
			case 'ppt':
			case 'pptx':
				return 'HeroPresentationChartLine';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
				return 'HeroPhoto';
			case 'zip':
			case 'rar':
				return 'HeroArchiveBox';
			default:
				return 'HeroDocument';
		}
	};

	const getDocumentTypeColor = (type: TDocumentType) => {
		switch (type) {
			case 'contrato':
				return 'blue';
			case 'factura':
				return 'emerald';
			case 'cotizacion':
				return 'amber';
			case 'orden_compra':
				return 'violet';
			case 'orden_venta':
				return 'indigo';
			case 'certificado':
				return 'emerald';
			case 'manual':
				return 'sky';
			case 'politica':
				return 'orange';
			case 'procedimiento':
				return 'teal';
			case 'imagen':
				return 'pink';
			default:
				return 'gray';
		}
	};

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-4'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600'>
							<Icon icon='HeroDocumentText' className='h-6 w-6' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900'>
								Gestión de Documentos
							</h1>
							<p className='text-sm text-gray-600'>
								Administra documentos asociados a entidades del sistema
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						color='blue'
						onClick={handleCreateDocument}
						className='flex items-center'>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Subir Documento
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas */}
				{stats && (
					<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
										<Icon
											icon='HeroDocumentText'
											className='h-6 w-6 text-blue-600'
										/>
									</div>
									<div className='ml-4'>
										<h3 className='text-sm font-medium text-gray-500'>
											Total Documentos
										</h3>
										<p className='text-2xl font-semibold text-gray-900'>
											{stats.total_documents}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
										<Icon
											icon='HeroCheckCircle'
											className='h-6 w-6 text-green-600'
										/>
									</div>
									<div className='ml-4'>
										<h3 className='text-sm font-medium text-gray-500'>
											Documentos Activos
										</h3>
										<p className='text-2xl font-semibold text-gray-900'>
											{stats.active_documents}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100'>
										<Icon
											icon='HeroServerStack'
											className='h-6 w-6 text-purple-600'
										/>
									</div>
									<div className='ml-4'>
										<h3 className='text-sm font-medium text-gray-500'>
											Tamaño Total
										</h3>
										<p className='text-2xl font-semibold text-gray-900'>
											{formatFileSize(stats.total_size)}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100'>
										<Icon
											icon='HeroCloudArrowUp'
											className='h-6 w-6 text-amber-600'
										/>
									</div>
									<div className='ml-4'>
										<h3 className='text-sm font-medium text-gray-500'>
											Subidas Recientes
										</h3>
										<p className='text-2xl font-semibold text-gray-900'>
											{stats.recent_uploads}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				)}

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<CardTitle>Filtros de Búsqueda</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
							<div>
								<Label htmlFor='filter-search'>Buscar</Label>
								<Input
									id='filter-search'
									name='search'
									placeholder='Nombre, descripción...'
									value={filters.search || ''}
									onChange={(e) => handleFilterChange('search', e.target.value)}
								/>
							</div>

							<div>
								<Label htmlFor='filter-document-type'>Tipo de Documento</Label>
								<SelectReact
									name='document_type'
									options={documentTypeOptions}
									value={documentTypeOptions.find(
										(option) => option.value === filters.document_type,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'document_type',
											option?.value || undefined,
										);
									}}
									placeholder='Seleccionar tipo...'
								/>
							</div>

							<div>
								<Label htmlFor='filter-file-type'>Tipo de Archivo</Label>
								<SelectReact
									name='file_type'
									options={fileTypeOptions}
									value={fileTypeOptions.find(
										(option) => option.value === filters.file_type,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange('file_type', option?.value || undefined);
									}}
									placeholder='Seleccionar archivo...'
								/>
							</div>

							<div>
								<Label htmlFor='filter-module'>Módulo Relacionado</Label>
								<SelectReact
									name='related_module'
									options={moduleOptions}
									value={moduleOptions.find(
										(option) => option.value === filters.related_module,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'related_module',
											option?.value || undefined,
										);
									}}
									placeholder='Seleccionar módulo...'
								/>
							</div>

							<div>
								<Label htmlFor='filter-status'>Estado</Label>
								<SelectReact
									name='is_active'
									options={statusOptions}
									value={statusOptions.find(
										(option) => option.value === filters.is_active?.toString(),
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										handleFilterChange(
											'is_active',
											option?.value === 'true'
												? true
												: option?.value === 'false'
													? false
													: undefined,
										);
									}}
									placeholder='Seleccionar estado...'
								/>
							</div>
						</div>
					</CardBody>
					<CardFooter>
						<Button onClick={clearFilters} variant='outline' className='ml-auto'>
							Limpiar filtros
						</Button>
					</CardFooter>
				</Card>

				{/* Tabla de Documentos */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>Lista de Documentos</CardTitle>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-500'>
									{documents.length} documentos
								</span>
								{loading && (
									<div className='flex items-center space-x-2'>
										<div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent' />
										<span className='text-sm text-gray-500'>Cargando...</span>
									</div>
								)}
							</div>
						</div>
					</CardHeader>
					<CardBody className='overflow-x-auto'>
						<table className='w-full table-auto'>
							<thead>
								<tr className='border-b border-gray-200 text-left'>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Documento
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>Tipo</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Archivo
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Módulo
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Tamaño
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Subido por
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Fecha
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Estado
									</th>
									<th className='pb-3 text-sm font-medium text-gray-500'>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{documents.map((document) => (
									<tr key={document.id} className='hover:bg-gray-50'>
										<td className='py-4'>
											<div className='flex items-center space-x-3'>
												<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
													<Icon
														icon={getFileIcon(document.file_type)}
														className='h-5 w-5 text-gray-600'
													/>
												</div>
												<div>
													<p className='font-medium text-gray-900'>
														{document.name}
													</p>
													<p className='text-sm text-gray-500'>
														ID: {document.related_id}
													</p>
												</div>
											</div>
										</td>
										<td className='py-4'>
											<Badge
												color={
													getDocumentTypeColor(
														document.document_type,
													) as any
												}>
												{
													DOCUMENT_TYPES.find(
														(t) => t.value === document.document_type,
													)?.label
												}
											</Badge>
										</td>
										<td className='py-4'>
											<div className='flex items-center space-x-2'>
												<Badge variant='outline' color='gray'>
													{document.file_type.toUpperCase()}
												</Badge>
											</div>
										</td>
										<td className='py-4'>
											<span className='text-sm text-gray-900'>
												{
													RELATED_MODULES.find(
														(m) => m.value === document.related_module,
													)?.label
												}
											</span>
										</td>
										<td className='py-4'>
											<span className='text-sm text-gray-600'>
												{formatFileSize(document.file_size || 0)}
											</span>
										</td>
										<td className='py-4'>
											<span className='text-sm text-gray-900'>
												{document.uploaded_by_name}
											</span>
										</td>
										<td className='py-4'>
											<span className='text-sm text-gray-600'>
												{formatDate(document.created_at)}
											</span>
										</td>
										<td className='py-4'>
											<Badge
												variant='outline'
												color={document.is_active ? 'emerald' : 'red'}>
												{document.is_active ? 'Activo' : 'Inactivo'}
											</Badge>
										</td>
										<td className='py-4'>
											<div className='flex items-center space-x-1'>
												<Button
													size='xs'
													variant='outline'
													onClick={() => handleViewDocument(document)}
													className='text-blue-600 hover:text-blue-700'>
													<Icon icon='HeroEye' className='h-4 w-4' />
												</Button>
												<Button
													size='xs'
													variant='outline'
													onClick={() => handleEditDocument(document)}
													className='text-amber-600 hover:text-amber-700'>
													<Icon icon='HeroPencil' className='h-4 w-4' />
												</Button>
												<Button
													size='xs'
													variant='outline'
													onClick={() => handleDeleteDocument(document)}
													className='text-red-600 hover:text-red-700'>
													<Icon icon='HeroTrash' className='h-4 w-4' />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{documents.length === 0 && !loading && (
							<div className='flex flex-col items-center justify-center py-12'>
								<Icon
									icon='HeroDocumentText'
									className='mb-4 h-12 w-12 text-gray-400'
								/>
								<p className='text-lg font-medium text-gray-500'>
									No se encontraron documentos
								</p>
								<p className='text-sm text-gray-400'>
									Ajusta los filtros o sube un nuevo documento
								</p>
							</div>
						)}
					</CardBody>
				</Card>

				{/* Modal de Confirmación de Eliminación */}
				<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen}>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
								<Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Eliminar Documento
								</h2>
								<p className='text-sm text-gray-600'>
									Esta acción no se puede deshacer
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedDocument && (
							<div className='space-y-4'>
								<div className='rounded-lg bg-red-50 p-4'>
									<div className='flex'>
										<div className='flex-shrink-0'>
											<Icon
												icon='HeroExclamationTriangle'
												className='h-5 w-5 text-red-400'
											/>
										</div>
										<div className='ml-3'>
											<h3 className='text-sm font-medium text-red-800'>
												¿Estás seguro de que quieres eliminar este
												documento?
											</h3>
											<div className='mt-2 text-sm text-red-700'>
												<p>
													<strong>Documento:</strong>{' '}
													{selectedDocument.name}
												</p>
												<p>
													<strong>Tipo:</strong>{' '}
													{
														DOCUMENT_TYPES.find(
															(t) =>
																t.value ===
																selectedDocument.document_type,
														)?.label
													}
												</p>
												<p>
													<strong>Módulo:</strong>{' '}
													{
														RELATED_MODULES.find(
															(m) =>
																m.value ===
																selectedDocument.related_module,
														)?.label
													}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex space-x-2'>
							<Button
								variant='outline'
								onClick={() => {
									setDeleteModalOpen(false);
									setSelectedDocument(null);
								}}>
								Cancelar
							</Button>
							<Button color='red' onClick={handleConfirmDelete}>
								Eliminar Documento
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Creación de Documento */}
				<Modal isOpen={createModalOpen} setIsOpen={setCreateModalOpen} size='lg'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<Icon icon='HeroPlus' className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Subir Nuevo Documento
								</h2>
								<p className='text-sm text-gray-600'>
									Registra un documento asociado a una entidad
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						<form
							id='createDocumentForm'
							className='space-y-4'
							onSubmit={handleCreateSubmit}>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div className='md:col-span-2'>
									<Label htmlFor='create-name' className='required'>
										Nombre del Documento
									</Label>
									<Input
										id='create-name'
										name='name'
										type='text'
										placeholder='Ej: Contrato de Servicios 2024'
										required
									/>
								</div>
							</div>

							<div>
								<Label htmlFor='create-file-path' className='required'>
									Ruta del Archivo
								</Label>
								<Input
									id='create-file-path'
									name='file_path'
									type='text'
									placeholder='Ej: /documents/contratos/contrato_2024.pdf'
									required
								/>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='create-document-type' className='required'>
										Tipo de Documento
									</Label>
									<Select
										defaultValue='contrato'
										id='create-document-type'
										name='document_type'
										required>
										{DOCUMENT_TYPES.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</Select>
								</div>
								<div>
									<Label htmlFor='create-file-type' className='required'>
										Tipo de Archivo
									</Label>
									<Select
										defaultValue='pdf'
										id='create-file-type'
										name='file_type'
										required>
										{FILE_TYPES.map((type) => (
											<option key={type.value} value={type.value}>
												{type.label}
											</option>
										))}
									</Select>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<div>
									<Label htmlFor='create-related-module' className='required'>
										Módulo Relacionado
									</Label>
									<Select
										defaultValue='customer'
										id='create-related-module'
										name='related_module'
										required>
										{RELATED_MODULES.map((module) => (
											<option key={module.value} value={module.value}>
												{module.label}
											</option>
										))}
									</Select>
								</div>
								<div>
									<Label htmlFor='create-related-id' className='required'>
										ID Relacionado
									</Label>
									<Input
										id='create-related-id'
										name='related_id'
										type='number'
										min='1'
										placeholder='ID de la entidad'
										required
									/>
								</div>
							</div>

							<div>
								<Label htmlFor='create-description'>Descripción (Opcional)</Label>
								<Textarea
									id='create-description'
									name='description'
									rows={3}
									placeholder='Descripción del documento, propósito, etc.'
								/>
							</div>

							<div className='space-y-3'>
								<h4 className='font-medium text-gray-900'>Estado</h4>
								<div className='flex items-center space-x-2'>
									<Checkbox id='create-active' name='is_active' defaultChecked />
									<Label htmlFor='create-active'>Documento Activo</Label>
								</div>
							</div>
						</form>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button variant='outline' onClick={() => setCreateModalOpen(false)}>
								Cancelar
							</Button>
							<Button
								color='blue'
								onClick={(e) => {
									e.preventDefault();
									const form = document.getElementById(
										'createDocumentForm',
									) as HTMLFormElement;
									if (form)
										handleCreateSubmit({
											preventDefault: () => {},
											currentTarget: form,
										} as any);
								}}>
								Subir Documento
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Edición de Documento */}
				<Modal isOpen={editModalOpen} setIsOpen={setEditModalOpen} size='lg'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
								<Icon icon='HeroPencil' className='h-6 w-6 text-amber-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Editar Documento
								</h2>
								<p className='text-sm text-gray-600'>
									Actualiza la información del documento
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedDocument && (
							<form
								id='editDocumentForm'
								className='space-y-4'
								onSubmit={handleEditSubmit}>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div className='md:col-span-2'>
										<Label htmlFor='edit-name' className='required'>
											Nombre del Documento
										</Label>
										<Input
											id='edit-name'
											name='name'
											type='text'
											defaultValue={selectedDocument.name}
											placeholder='Ej: Contrato de Servicios 2024'
											required
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='edit-file-path' className='required'>
										Ruta del Archivo
									</Label>
									<Input
										id='edit-file-path'
										name='file_path'
										type='text'
										defaultValue={selectedDocument.file_path}
										placeholder='Ej: /documents/contratos/contrato_2024.pdf'
										required
									/>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='edit-document-type' className='required'>
											Tipo de Documento
										</Label>
										<Select
											defaultValue={selectedDocument.document_type}
											id='edit-document-type'
											name='document_type'
											required>
											{DOCUMENT_TYPES.map((type) => (
												<option key={type.value} value={type.value}>
													{type.label}
												</option>
											))}
										</Select>
									</div>
									<div>
										<Label htmlFor='edit-file-type' className='required'>
											Tipo de Archivo
										</Label>
										<Select
											defaultValue={selectedDocument.file_type}
											id='edit-file-type'
											name='file_type'
											required>
											{FILE_TYPES.map((type) => (
												<option key={type.value} value={type.value}>
													{type.label}
												</option>
											))}
										</Select>
									</div>
								</div>

								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='edit-related-module' className='required'>
											Módulo Relacionado
										</Label>
										<Select
											defaultValue={selectedDocument.related_module}
											id='edit-related-module'
											name='related_module'
											required>
											{RELATED_MODULES.map((module) => (
												<option key={module.value} value={module.value}>
													{module.label}
												</option>
											))}
										</Select>
									</div>
									<div>
										<Label htmlFor='edit-related-id' className='required'>
											ID Relacionado
										</Label>
										<Input
											id='edit-related-id'
											name='related_id'
											type='number'
											min='1'
											defaultValue={selectedDocument.related_id}
											placeholder='ID de la entidad'
											required
										/>
									</div>
								</div>

								<div>
									<Label htmlFor='edit-description'>Descripción (Opcional)</Label>
									<Textarea
										id='edit-description'
										name='description'
										rows={3}
										defaultValue={selectedDocument.description}
										placeholder='Descripción del documento, propósito, etc.'
									/>
								</div>

								<div className='space-y-3'>
									<h4 className='font-medium text-gray-900'>Estado</h4>
									<div className='flex items-center space-x-2'>
										<Checkbox
											id='edit-active'
											name='is_active'
											defaultChecked={selectedDocument.is_active}
										/>
										<Label htmlFor='edit-active'>Documento Activo</Label>
									</div>
								</div>
							</form>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button
								variant='outline'
								onClick={() => {
									setEditModalOpen(false);
									setSelectedDocument(null);
								}}>
								Cancelar
							</Button>
							<Button
								color='amber'
								onClick={(e) => {
									e.preventDefault();
									const form = document.getElementById(
										'editDocumentForm',
									) as HTMLFormElement;
									if (form)
										handleEditSubmit({
											preventDefault: () => {},
											currentTarget: form,
										} as any);
								}}>
								Guardar Cambios
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Vista de Documento */}
				<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='xl'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Detalles del Documento
								</h2>
								<p className='text-sm text-gray-600'>
									Información completa y metadatos
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedDocument && (
							<div className='space-y-6'>
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
									<div className='space-y-4'>
										<div>
											<h3 className='mb-2 text-lg font-bold text-gray-900'>
												{selectedDocument.name}
											</h3>
											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Tipo de Documento:
													</span>
													<Badge
														color={
															getDocumentTypeColor(
																selectedDocument.document_type,
															) as any
														}>
														{
															DOCUMENT_TYPES.find(
																(t) =>
																	t.value ===
																	selectedDocument.document_type,
															)?.label
														}
													</Badge>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Tipo de Archivo:
													</span>
													<Badge variant='outline' color='gray'>
														{selectedDocument.file_type.toUpperCase()}
													</Badge>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Tamaño:
													</span>
													<span>
														{formatFileSize(
															selectedDocument.file_size || 0,
														)}
													</span>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Ruta del Archivo:
													</span>
													<span className='cursor-pointer text-right text-blue-600 hover:text-blue-700'>
														{selectedDocument.file_path}
													</span>
												</div>
											</div>
										</div>
									</div>

									<div className='space-y-4'>
										<div className='space-y-2'>
											<div className='mb-4 flex flex-wrap gap-2'>
												<Badge
													color={
														selectedDocument.is_active
															? 'emerald'
															: 'red'
													}>
													{selectedDocument.is_active
														? 'Activo'
														: 'Inactivo'}
												</Badge>
											</div>

											<div className='space-y-2 text-sm'>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Módulo Relacionado:
													</span>
													<span>
														{
															RELATED_MODULES.find(
																(m) =>
																	m.value ===
																	selectedDocument.related_module,
															)?.label
														}
													</span>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														ID Relacionado:
													</span>
													<span>{selectedDocument.related_id}</span>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Subido por:
													</span>
													<span>{selectedDocument.uploaded_by_name}</span>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Fecha de Creación:
													</span>
													<span>
														{formatDate(selectedDocument.created_at)}
													</span>
												</div>
												<div className='flex justify-between'>
													<span className='font-medium text-gray-700'>
														Última Actualización:
													</span>
													<span>
														{formatDate(selectedDocument.updated_at)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{selectedDocument.description && (
									<div className='rounded-lg bg-gray-50 p-4'>
										<h4 className='mb-2 font-medium text-gray-900'>
											Descripción
										</h4>
										<p className='text-gray-700'>
											{selectedDocument.description}
										</p>
									</div>
								)}
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-between'>
							<Button
								variant='outline'
								onClick={() => {
									setViewModalOpen(false);
									setSelectedDocument(null);
								}}>
								Cerrar
							</Button>
							{selectedDocument && (
								<Button
									color='amber'
									onClick={() => {
										setViewModalOpen(false);
										handleEditDocument(selectedDocument);
									}}>
									Editar Documento
								</Button>
							)}
						</div>
					</ModalFooter>
				</Modal>

				{/* Los modales de creación, edición y vista se agregaron arriba */}
			</Container>
		</PageWrapper>
	);
};

export default Documentos;
