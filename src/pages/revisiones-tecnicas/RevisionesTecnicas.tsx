// src/pages/revisiones-tecnicas/RevisionesTecnicas.tsx
import React, { useState, useEffect } from 'react';
import {
	IRevisionTecnica,
	IRevisionFilters,
	IRevisionStats,
	IRevisionFormData,
	TipoEquipo,
	CategoriaEquipo,
	TIPOS_EQUIPO,
	CATEGORIAS_EQUIPO,
	ESTADOS_REVISION,
	TIPOS_RAM,
	TECNOLOGIAS_DISCO,
	SISTEMAS_OPERATIVOS,
	TIPOS_PANEL,
	ESTADOS_COMPONENTE,
	getTipoEquipoColor,
	getCategoriaColor,
	getEstadoColor,
	getEstadoComponenteColor,
} from './types/revisiones.types';

import Container from '../../components/layouts/Container/Container';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/form/Input';
import Select from '../../components/form/Select';
import Label from '../../components/form/Label';
import Textarea from '../../components/form/Textarea';
import Checkbox from '../../components/form/Checkbox';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../components/ui/Modal';
import PageWrapper from '../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../components/layouts/Subheader/Subheader';
import Icon from '../../components/icon/Icon';

const RevisionesTecnicas: React.FC = () => {
	// Estados principales
	const [revisiones, setRevisiones] = useState<IRevisionTecnica[]>([]);
	const [stats, setStats] = useState<IRevisionStats>({
		total: 0,
		activas: 0,
		completadas: 0,
		canceladas: 0,
		por_tipo: { notebook: 0, desktop: 0, aio: 0, monitor: 0, docking: 0 },
		por_categoria: { A: 0, B: 0, C: 0, M: 0 },
	});

	const [filters, setFilters] = useState<IRevisionFilters>({
		busqueda: '',
		tipo_equipo: '',
		categoria: '',
		estado: '',
		tecnico_responsable: '',
		fecha_desde: '',
		fecha_hasta: '',
	});

	// Estados de modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);

	const [selectedRevision, setSelectedRevision] = useState<IRevisionTecnica | null>(null);
	const [selectedTipoEquipo, setSelectedTipoEquipo] = useState<TipoEquipo>('notebook');
	const [loading, setLoading] = useState(false);

	// Mock data
	const mockRevisiones: IRevisionTecnica[] = [
		{
			id: 1,
			tipo_equipo: 'notebook',
			marca: 'Dell',
			modelo: 'Latitude 7420',
			numero_serie: 'DL742012345',
			diagnostico_general: 'Equipo con pantalla dañada, resto funciona correctamente',
			categoria_equipo: 'A',
			linea_serie: 'Latitude Business',
			codigo_barras_interno: 'INT-001-2024',
			cliente: 'Empresa ABC S.A.',
			proveedor: 'Dell Colombia',
			observaciones_tecnicas: 'Requiere cambio de pantalla, batería en buen estado',
			adjunto_fotos: true,
			fecha_creacion: '2024-03-15T10:30:00Z',
			fecha_actualizacion: '2024-03-15T10:30:00Z',
			tecnico_responsable: 'Juan Pérez',
			tecnico_responsable_id: 1,
			estado: 'activa',
			especificaciones: {
				procesador: 'Intel Core i7-1185G7',
				memoria_ram_gb: 16,
				slots_ram_usados: 2,
				tipo_ram: 'SO-DIMM DDR4',
				almacenamiento_capacidad_gb: 512,
				tecnologia_disco: 'NVME',
				sistema_operativo: 'Windows 11',
				incluye_cargador: true,
				tiene_vga: false,
				tiene_hdmi: true,
				tiene_displayport: true,
				cantidad_puertos_usb: 4,
				tiene_usb_tipo_c: true,
				tiene_lector_sd: true,
				tiene_wifi: true,
				tiene_bluetooth: true,
				tiene_rj45: true,
				tiene_lector_cd_dvd: false,
				tamano_pantalla_pulgadas: 14,
				resolucion_pantalla: '1920x1080',
				estado_pantalla: 'malo',
				estado_touchscreen: 'no_aplica',
				estado_touchpad: 'bueno',
				estado_teclado: 'excelente',
				estado_cubierta_superior: 'bueno',
				estado_bisagras: 'bueno',
				estado_tapa_inferior: 'bueno',
				estado_bateria: 'bueno',
			},
		},
		{
			id: 2,
			tipo_equipo: 'desktop',
			marca: 'HP',
			modelo: 'ProDesk 400 G7',
			numero_serie: 'HP400G712345',
			diagnostico_general: 'Equipo completamente funcional, solo requiere limpieza',
			categoria_equipo: 'B',
			cliente: 'Oficina Central',
			observaciones_tecnicas: 'Equipo en excelente estado general',
			adjunto_fotos: false,
			fecha_creacion: '2024-03-14T09:15:00Z',
			fecha_actualizacion: '2024-03-14T09:15:00Z',
			tecnico_responsable: 'María González',
			tecnico_responsable_id: 2,
			estado: 'completada',
			especificaciones: {
				procesador: 'Intel Core i5-10500',
				memoria_ram_gb: 8,
				slots_ram_usados: 1,
				tipo_ram: 'DDR4',
				almacenamiento_capacidad_gb: 1000,
				tecnologia_disco: 'HDD',
				sistema_operativo: 'Windows 10',
				tiene_vga: true,
				tiene_hdmi: true,
				tiene_displayport: false,
				cantidad_puertos_usb: 6,
				tiene_usb_tipo_c: false,
				tiene_lector_sd: true,
				tiene_wifi: true,
				tiene_bluetooth: true,
				tiene_rj45: true,
				tiene_lector_cd_dvd: true,
			},
		},
		{
			id: 3,
			tipo_equipo: 'monitor',
			marca: 'Samsung',
			modelo: 'F24T450FQU',
			numero_serie: 'SM24T45012345',
			diagnostico_general: 'Monitor funcional con ajuste de altura defectuoso',
			categoria_equipo: 'C',
			cliente: 'Departamento de Ventas',
			adjunto_fotos: true,
			fecha_creacion: '2024-03-13T14:20:00Z',
			fecha_actualizacion: '2024-03-13T14:20:00Z',
			tecnico_responsable: 'Carlos López',
			tecnico_responsable_id: 3,
			estado: 'activa',
			especificaciones: {
				tamano_pantalla_pulgadas: 24,
				resolucion: '1920x1080',
				tipo_panel: 'IPS',
				entrada_hdmi: true,
				entrada_vga: true,
				entrada_displayport: false,
				ajuste_altura: false,
				rotacion_pantalla: false,
				estado_pantalla: 'excelente',
				estado_marco: 'bueno',
				estado_base_soporte: 'malo',
			},
		},
		{
			id: 4,
			tipo_equipo: 'docking',
			marca: 'Lenovo',
			modelo: 'ThinkPad Universal USB-C Dock',
			numero_serie: 'LN-DOCK-12345',
			diagnostico_general: 'Docking station completamente funcional',
			categoria_equipo: 'A',
			proveedor: 'Lenovo Colombia',
			adjunto_fotos: false,
			fecha_creacion: '2024-03-12T11:45:00Z',
			fecha_actualizacion: '2024-03-12T11:45:00Z',
			tecnico_responsable: 'Ana Rodríguez',
			tecnico_responsable_id: 4,
			estado: 'completada',
			especificaciones: {
				salida_vga: true,
				puertos_hdmi: 2,
				puertos_displayport: 1,
				puertos_usb: 6,
				puertos_usb_tipo_c: 2,
				lector_tarjetas_sd: true,
				tiene_wifi: false,
				puerto_rj45: true,
				estado_carcasa: 'excelente',
			},
		},
		{
			id: 5,
			tipo_equipo: 'aio',
			marca: 'Apple',
			modelo: 'iMac 24"',
			numero_serie: 'IMAC24-2024-001',
			diagnostico_general: 'Equipo con falla en puerto USB, resto funcional',
			categoria_equipo: 'M',
			cliente: 'Diseño Gráfico',
			observaciones_tecnicas: 'Requiere revisión de placa base para USB',
			adjunto_fotos: true,
			fecha_creacion: '2024-03-11T16:30:00Z',
			fecha_actualizacion: '2024-03-11T16:30:00Z',
			tecnico_responsable: 'Luis Martínez',
			tecnico_responsable_id: 5,
			estado: 'activa',
			especificaciones: {
				procesador: 'Apple M1',
				memoria_ram_gb: 16,
				slots_ram_usados: 2,
				tipo_ram: 'DDR4',
				almacenamiento_capacidad_gb: 512,
				tecnologia_disco: 'SSD',
				sistema_operativo: 'macOS',
				tamano_pantalla_pulgadas: 24,
				resolucion_pantalla: '4480x2520',
				estado_pantalla: 'excelente',
				incluye_cargador: true,
				tiene_vga: false,
				tiene_hdmi: false,
				tiene_displayport: true,
				cantidad_puertos_usb: 4,
				tiene_usb_tipo_c: true,
				tiene_lector_sd: true,
				tiene_wifi: true,
				tiene_bluetooth: true,
				tiene_rj45: true,
				estado_bateria: 'no_aplica',
			},
		},
	];

	// Función para calcular estadísticas
	const calculateStats = (data: IRevisionTecnica[]): IRevisionStats => {
		const stats: IRevisionStats = {
			total: data.length,
			activas: data.filter((r) => r.estado === 'activa').length,
			completadas: data.filter((r) => r.estado === 'completada').length,
			canceladas: data.filter((r) => r.estado === 'cancelada').length,
			por_tipo: { notebook: 0, desktop: 0, aio: 0, monitor: 0, docking: 0 },
			por_categoria: { A: 0, B: 0, C: 0, M: 0 },
		};

		data.forEach((revision) => {
			stats.por_tipo[revision.tipo_equipo]++;
			stats.por_categoria[revision.categoria_equipo]++;
		});

		return stats;
	};

	// Función para filtrar revisiones
	const getFilteredRevisiones = (): IRevisionTecnica[] => {
		let filtered = [...mockRevisiones];

		if (filters.busqueda) {
			const busqueda = filters.busqueda.toLowerCase();
			filtered = filtered.filter(
				(revision) =>
					revision.marca.toLowerCase().includes(busqueda) ||
					revision.modelo.toLowerCase().includes(busqueda) ||
					revision.numero_serie.toLowerCase().includes(busqueda) ||
					revision.diagnostico_general.toLowerCase().includes(busqueda) ||
					revision.tecnico_responsable.toLowerCase().includes(busqueda),
			);
		}

		if (filters.tipo_equipo) {
			filtered = filtered.filter((revision) => revision.tipo_equipo === filters.tipo_equipo);
		}

		if (filters.categoria) {
			filtered = filtered.filter(
				(revision) => revision.categoria_equipo === filters.categoria,
			);
		}

		if (filters.estado) {
			filtered = filtered.filter((revision) => revision.estado === filters.estado);
		}

		if (filters.tecnico_responsable) {
			filtered = filtered.filter((revision) =>
				revision.tecnico_responsable
					.toLowerCase()
					.includes(filters.tecnico_responsable.toLowerCase()),
			);
		}

		return filtered;
	};

	// Cargar datos iniciales
	useEffect(() => {
		const filtered = getFilteredRevisiones();
		setRevisiones(filtered);
		setStats(calculateStats(filtered));
	}, [filters]);

	// Handlers de modales
	const handleCreateRevision = () => {
		setSelectedTipoEquipo('notebook');
		setCreateModalOpen(true);
	};

	const handleEditRevision = (revision: IRevisionTecnica) => {
		setSelectedRevision(revision);
		setSelectedTipoEquipo(revision.tipo_equipo);
		setEditModalOpen(true);
	};

	const handleViewRevision = (revision: IRevisionTecnica) => {
		setSelectedRevision(revision);
		setViewModalOpen(true);
	};

	const handleDeleteRevision = (revision: IRevisionTecnica) => {
		setSelectedRevision(revision);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = () => {
		if (selectedRevision) {
			// Aquí iría la lógica para eliminar la revisión
			console.log('Eliminando revisión:', selectedRevision.id);
			setDeleteModalOpen(false);
			setSelectedRevision(null);
		}
	};

	// Handlers de formularios
	const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		console.log('Creando revisión:', data);
		// Aquí iría la lógica para crear la revisión

		setCreateModalOpen(false);
	};

	const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData.entries());

		console.log('Editando revisión:', selectedRevision?.id, data);
		// Aquí iría la lógica para actualizar la revisión

		setEditModalOpen(false);
		setSelectedRevision(null);
	};

	// Componente para campos específicos de Notebook
	const renderNotebookFields = (isEdit: boolean = false, revision?: IRevisionTecnica) => {
		const specs = isEdit && revision ? (revision.especificaciones as any) : {};

		return (
			<div className='space-y-4'>
				<h4 className='border-b pb-2 font-medium text-gray-900'>
					Especificaciones de Hardware
				</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<Label htmlFor='procesador' className='required'>
							Procesador
						</Label>
						<Input
							id='procesador'
							name='procesador'
							type='text'
							defaultValue={isEdit ? specs.procesador : ''}
							placeholder='Ej: Intel Core i7-1185G7'
							required
						/>
					</div>
					<div>
						<Label htmlFor='memoria_ram_gb' className='required'>
							Memoria RAM (GB)
						</Label>
						<Input
							id='memoria_ram_gb'
							name='memoria_ram_gb'
							type='number'
							min='1'
							max='128'
							defaultValue={isEdit ? specs.memoria_ram_gb : ''}
							placeholder='8'
							required
						/>
					</div>
					<div>
						<Label htmlFor='slots_ram_usados' className='required'>
							Slots RAM Usados
						</Label>
						<Input
							id='slots_ram_usados'
							name='slots_ram_usados'
							type='number'
							min='1'
							max='4'
							defaultValue={isEdit ? specs.slots_ram_usados : ''}
							placeholder='2'
							required
						/>
					</div>
					<div>
						<Label htmlFor='tipo_ram' className='required'>
							Tipo de RAM
						</Label>
						<Select
							id='tipo_ram'
							name='tipo_ram'
							defaultValue={isEdit ? specs.tipo_ram : 'SO-DIMM DDR4'}
							required>
							{TIPOS_RAM.map((tipo) => (
								<option key={tipo.value} value={tipo.value}>
									{tipo.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='almacenamiento_capacidad_gb' className='required'>
							Almacenamiento (GB)
						</Label>
						<Input
							id='almacenamiento_capacidad_gb'
							name='almacenamiento_capacidad_gb'
							type='number'
							min='1'
							defaultValue={isEdit ? specs.almacenamiento_capacidad_gb : ''}
							placeholder='512'
							required
						/>
					</div>
					<div>
						<Label htmlFor='tecnologia_disco' className='required'>
							Tecnología de Disco
						</Label>
						<Select
							id='tecnologia_disco'
							name='tecnologia_disco'
							defaultValue={isEdit ? specs.tecnologia_disco : 'SSD'}
							required>
							{TECNOLOGIAS_DISCO.map((tech) => (
								<option key={tech.value} value={tech.value}>
									{tech.label}
								</option>
							))}
						</Select>
					</div>
				</div>

				<h4 className='border-b pb-2 font-medium text-gray-900'>
					Sistema Operativo y Pantalla
				</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<Label htmlFor='sistema_operativo' className='required'>
							Sistema Operativo
						</Label>
						<Select
							id='sistema_operativo'
							name='sistema_operativo'
							defaultValue={isEdit ? specs.sistema_operativo : 'Windows 11'}
							required>
							{SISTEMAS_OPERATIVOS.map((os) => (
								<option key={os.value} value={os.value}>
									{os.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='tamano_pantalla_pulgadas' className='required'>
							Tamaño Pantalla (pulgadas)
						</Label>
						<Input
							id='tamano_pantalla_pulgadas'
							name='tamano_pantalla_pulgadas'
							type='number'
							min='10'
							max='18'
							step='0.1'
							defaultValue={isEdit ? specs.tamano_pantalla_pulgadas : ''}
							placeholder='14'
							required
						/>
					</div>
					<div>
						<Label htmlFor='resolucion_pantalla' className='required'>
							Resolución de Pantalla
						</Label>
						<Input
							id='resolucion_pantalla'
							name='resolucion_pantalla'
							type='text'
							defaultValue={isEdit ? specs.resolucion_pantalla : ''}
							placeholder='1920x1080'
							required
						/>
					</div>
				</div>

				<h4 className='border-b pb-2 font-medium text-gray-900'>Conectividad</h4>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='incluye_cargador'
							name='incluye_cargador'
							defaultChecked={isEdit ? specs.incluye_cargador : true}
						/>
						<Label htmlFor='incluye_cargador'>Incluye Cargador</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_hdmi'
							name='tiene_hdmi'
							defaultChecked={isEdit ? specs.tiene_hdmi : false}
						/>
						<Label htmlFor='tiene_hdmi'>HDMI</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_displayport'
							name='tiene_displayport'
							defaultChecked={isEdit ? specs.tiene_displayport : false}
						/>
						<Label htmlFor='tiene_displayport'>DisplayPort</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_usb_tipo_c'
							name='tiene_usb_tipo_c'
							defaultChecked={isEdit ? specs.tiene_usb_tipo_c : false}
						/>
						<Label htmlFor='tiene_usb_tipo_c'>USB Tipo-C</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_wifi'
							name='tiene_wifi'
							defaultChecked={isEdit ? specs.tiene_wifi : true}
						/>
						<Label htmlFor='tiene_wifi'>Wi-Fi</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_bluetooth'
							name='tiene_bluetooth'
							defaultChecked={isEdit ? specs.tiene_bluetooth : true}
						/>
						<Label htmlFor='tiene_bluetooth'>Bluetooth</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_rj45'
							name='tiene_rj45'
							defaultChecked={isEdit ? specs.tiene_rj45 : false}
						/>
						<Label htmlFor='tiene_rj45'>Puerto RJ-45</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='tiene_lector_sd'
							name='tiene_lector_sd'
							defaultChecked={isEdit ? specs.tiene_lector_sd : false}
						/>
						<Label htmlFor='tiene_lector_sd'>Lector SD</Label>
					</div>
				</div>

				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<Label htmlFor='cantidad_puertos_usb'>Cantidad Puertos USB</Label>
						<Input
							id='cantidad_puertos_usb'
							name='cantidad_puertos_usb'
							type='number'
							min='0'
							max='10'
							defaultValue={isEdit ? specs.cantidad_puertos_usb : '2'}
							placeholder='2'
						/>
					</div>
				</div>

				<h4 className='border-b pb-2 font-medium text-gray-900'>Estado de Componentes</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
					<div>
						<Label htmlFor='estado_pantalla' className='required'>
							Estado de Pantalla
						</Label>
						<Select
							id='estado_pantalla'
							name='estado_pantalla'
							defaultValue={isEdit ? specs.estado_pantalla : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_teclado' className='required'>
							Estado del Teclado
						</Label>
						<Select
							id='estado_teclado'
							name='estado_teclado'
							defaultValue={isEdit ? specs.estado_teclado : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_touchpad' className='required'>
							Estado del Touchpad
						</Label>
						<Select
							id='estado_touchpad'
							name='estado_touchpad'
							defaultValue={isEdit ? specs.estado_touchpad : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_bateria' className='required'>
							Estado de la Batería
						</Label>
						<Select
							id='estado_bateria'
							name='estado_bateria'
							defaultValue={isEdit ? specs.estado_bateria : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_bisagras' className='required'>
							Estado de Bisagras
						</Label>
						<Select
							id='estado_bisagras'
							name='estado_bisagras'
							defaultValue={isEdit ? specs.estado_bisagras : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_cubierta_superior' className='required'>
							Estado Cubierta Superior
						</Label>
						<Select
							id='estado_cubierta_superior'
							name='estado_cubierta_superior'
							defaultValue={isEdit ? specs.estado_cubierta_superior : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
				</div>
			</div>
		);
	};

	// Componente para campos específicos de Monitor
	const renderMonitorFields = (isEdit: boolean = false, revision?: IRevisionTecnica) => {
		const specs = isEdit && revision ? (revision.especificaciones as any) : {};

		return (
			<div className='space-y-4'>
				<h4 className='border-b pb-2 font-medium text-gray-900'>
					Especificaciones de Pantalla
				</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<div>
						<Label htmlFor='tamano_pantalla_pulgadas' className='required'>
							Tamaño (pulgadas)
						</Label>
						<Input
							id='tamano_pantalla_pulgadas'
							name='tamano_pantalla_pulgadas'
							type='number'
							min='15'
							max='55'
							step='0.1'
							defaultValue={isEdit ? specs.tamano_pantalla_pulgadas : ''}
							placeholder='24'
							required
						/>
					</div>
					<div>
						<Label htmlFor='resolucion' className='required'>
							Resolución
						</Label>
						<Input
							id='resolucion'
							name='resolucion'
							type='text'
							defaultValue={isEdit ? specs.resolucion : ''}
							placeholder='1920x1080'
							required
						/>
					</div>
					<div>
						<Label htmlFor='tipo_panel' className='required'>
							Tipo de Panel
						</Label>
						<Select
							id='tipo_panel'
							name='tipo_panel'
							defaultValue={isEdit ? specs.tipo_panel : 'IPS'}
							required>
							{TIPOS_PANEL.map((panel) => (
								<option key={panel.value} value={panel.value}>
									{panel.label}
								</option>
							))}
						</Select>
					</div>
				</div>

				<h4 className='border-b pb-2 font-medium text-gray-900'>Conectividad</h4>
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='entrada_hdmi'
							name='entrada_hdmi'
							defaultChecked={isEdit ? specs.entrada_hdmi : true}
						/>
						<Label htmlFor='entrada_hdmi'>Entrada HDMI</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='entrada_vga'
							name='entrada_vga'
							defaultChecked={isEdit ? specs.entrada_vga : false}
						/>
						<Label htmlFor='entrada_vga'>Entrada VGA</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='entrada_displayport'
							name='entrada_displayport'
							defaultChecked={isEdit ? specs.entrada_displayport : false}
						/>
						<Label htmlFor='entrada_displayport'>Entrada DisplayPort</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='ajuste_altura'
							name='ajuste_altura'
							defaultChecked={isEdit ? specs.ajuste_altura : false}
						/>
						<Label htmlFor='ajuste_altura'>Ajuste de Altura</Label>
					</div>
					<div className='flex items-center space-x-2'>
						<Checkbox
							id='rotacion_pantalla'
							name='rotacion_pantalla'
							defaultChecked={isEdit ? specs.rotacion_pantalla : false}
						/>
						<Label htmlFor='rotacion_pantalla'>Rotación de Pantalla</Label>
					</div>
				</div>

				<h4 className='border-b pb-2 font-medium text-gray-900'>Estado de Componentes</h4>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div>
						<Label htmlFor='estado_pantalla' className='required'>
							Estado de Pantalla
						</Label>
						<Select
							id='estado_pantalla'
							name='estado_pantalla'
							defaultValue={isEdit ? specs.estado_pantalla : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_marco' className='required'>
							Estado del Marco
						</Label>
						<Select
							id='estado_marco'
							name='estado_marco'
							defaultValue={isEdit ? specs.estado_marco : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='estado_base_soporte' className='required'>
							Estado Base/Soporte
						</Label>
						<Select
							id='estado_base_soporte'
							name='estado_base_soporte'
							defaultValue={isEdit ? specs.estado_base_soporte : 'bueno'}
							required>
							{ESTADOS_COMPONENTE.map((estado) => (
								<option key={estado.value} value={estado.value}>
									{estado.label}
								</option>
							))}
						</Select>
					</div>
				</div>
			</div>
		);
	};

	// Función para renderizar campos específicos según el tipo
	const renderSpecificFields = (
		tipo: TipoEquipo,
		isEdit: boolean = false,
		revision?: IRevisionTecnica,
	) => {
		switch (tipo) {
			case 'notebook':
				return renderNotebookFields(isEdit, revision);
			case 'monitor':
				return renderMonitorFields(isEdit, revision);
			case 'desktop':
			case 'aio':
			case 'docking':
				return (
					<div className='rounded-lg bg-blue-50 p-4'>
						<p className='text-sm text-blue-800'>
							Los campos específicos para{' '}
							{TIPOS_EQUIPO.find((t) => t.value === tipo)?.label}
							se implementarán en la siguiente versión.
						</p>
					</div>
				);
			default:
				return null;
		}
	};

	// Funciones auxiliares para colores de badges
	const getTipoEquipoColor = (tipo: string) => {
		switch (tipo) {
			case 'notebook':
				return 'blue';
			case 'desktop':
				return 'emerald';
			case 'monitor':
				return 'purple';
			case 'aio':
				return 'amber';
			case 'docking':
				return 'cyan';
			default:
				return 'gray';
		}
	};

	const getCategoriaColor = (categoria: string) => {
		switch (categoria) {
			case 'A':
				return 'emerald';
			case 'B':
				return 'blue';
			case 'C':
				return 'amber';
			case 'D':
				return 'red';
			default:
				return 'gray';
		}
	};

	const getEstadoColor = (estado: string) => {
		switch (estado) {
			case 'pendiente':
				return 'amber';
			case 'en_proceso':
				return 'blue';
			case 'completada':
				return 'emerald';
			case 'cancelada':
				return 'red';
			default:
				return 'gray';
		}
	};

	const getEstadoComponenteColor = (estado: string) => {
		switch (estado) {
			case 'excelente':
				return 'emerald';
			case 'bueno':
				return 'blue';
			case 'regular':
				return 'amber';
			case 'malo':
				return 'red';
			case 'no_aplica':
				return 'gray';
			default:
				return 'gray';
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroWrenchScrewdriver' className='mr-2 h-6 w-6' />
					Revisiones Técnicas
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='solid' color='blue' onClick={handleCreateRevision}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Nueva Revisión
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Tarjetas de Estadísticas */}
				<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardBody>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										Total Revisiones
									</p>
									<p className='text-2xl font-bold text-gray-900'>
										{stats.total}
									</p>
								</div>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
									<Icon
										icon='HeroWrenchScrewdriver'
										className='h-6 w-6 text-blue-600'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>Activas</p>
									<p className='text-2xl font-bold text-blue-900'>
										{stats.activas}
									</p>
								</div>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
									<Icon icon='HeroClock' className='h-6 w-6 text-blue-600' />
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>Completadas</p>
									<p className='text-2xl font-bold text-green-900'>
										{stats.completadas}
									</p>
								</div>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
									<Icon
										icon='HeroCheckCircle'
										className='h-6 w-6 text-green-600'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>Canceladas</p>
									<p className='text-2xl font-bold text-red-900'>
										{stats.canceladas}
									</p>
								</div>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-red-100'>
									<Icon icon='HeroXCircle' className='h-6 w-6 text-red-600' />
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<CardTitle>Filtros de Búsqueda</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
							<div>
								<Label htmlFor='search'>Búsqueda General</Label>
								<Input
									id='search'
									name='search'
									type='text'
									placeholder='Marca, modelo, serie, diagnóstico...'
									value={filters.busqueda}
									onChange={(e) =>
										setFilters({ ...filters, busqueda: e.target.value })
									}
								/>
							</div>
							<div>
								<Label htmlFor='filter-tipo'>Tipo de Equipo</Label>
								<Select
									id='filter-tipo'
									name='filter-tipo'
									value={filters.tipo_equipo}
									onChange={(e) =>
										setFilters({
											...filters,
											tipo_equipo: e.target.value as TipoEquipo | '',
										})
									}>
									<option value=''>Todos los tipos</option>
									{TIPOS_EQUIPO.map((tipo) => (
										<option key={tipo.value} value={tipo.value}>
											{tipo.label}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label htmlFor='filter-categoria'>Categoría</Label>
								<Select
									id='filter-categoria'
									name='filter-categoria'
									value={filters.categoria}
									onChange={(e) =>
										setFilters({
											...filters,
											categoria: e.target.value as CategoriaEquipo | '',
										})
									}>
									<option value=''>Todas las categorías</option>
									{CATEGORIAS_EQUIPO.map((categoria) => (
										<option key={categoria.value} value={categoria.value}>
											{categoria.label}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label htmlFor='filter-estado'>Estado</Label>
								<Select
									id='filter-estado'
									name='filter-estado'
									value={filters.estado}
									onChange={(e) =>
										setFilters({ ...filters, estado: e.target.value as any })
									}>
									<option value=''>Todos los estados</option>
									{ESTADOS_REVISION.map((estado) => (
										<option key={estado.value} value={estado.value}>
											{estado.label}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label htmlFor='filter-tecnico'>Técnico Responsable</Label>
								<Input
									id='filter-tecnico'
									name='filter-tecnico'
									type='text'
									placeholder='Nombre del técnico'
									value={filters.tecnico_responsable}
									onChange={(e) =>
										setFilters({
											...filters,
											tecnico_responsable: e.target.value,
										})
									}
								/>
							</div>
							<div className='flex items-end'>
								<Button
									variant='outline'
									onClick={() =>
										setFilters({
											busqueda: '',
											tipo_equipo: '',
											categoria: '',
											estado: '',
											tecnico_responsable: '',
											fecha_desde: '',
											fecha_hasta: '',
										})
									}>
									<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
									Limpiar Filtros
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de Revisiones */}
				<Card>
					<CardHeader>
						<CardTitle>Listado de Revisiones Técnicas</CardTitle>
						<div className='text-sm text-gray-600'>
							Mostrando {revisiones.length} de {stats.total} revisiones
						</div>
					</CardHeader>
					<CardBody className='overflow-x-auto'>
						<table className='w-full table-auto'>
							<thead>
								<tr className='border-b border-gray-200'>
									<th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>
										Equipo
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>
										Número de Serie
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>
										Diagnóstico
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>
										Técnico
									</th>
									<th className='px-4 py-3 text-left text-sm font-semibold text-gray-900'>
										Fecha
									</th>
									<th className='px-4 py-3 text-center text-sm font-semibold text-gray-900'>
										Estado
									</th>
									<th className='px-4 py-3 text-center text-sm font-semibold text-gray-900'>
										Acciones
									</th>
								</tr>
							</thead>
							<tbody>
								{revisiones.map((revision) => (
									<tr
										key={revision.id}
										className='border-b border-gray-100 hover:bg-gray-50'>
										<td className='px-4 py-4'>
											<div className='flex flex-col'>
												<div className='flex items-center space-x-2'>
													<span className='font-medium text-gray-900'>
														{revision.marca} {revision.modelo}
													</span>
													<Badge
														color={
															getTipoEquipoColor(
																revision.tipo_equipo,
															) as any
														}
														variant='outline'>
														{
															TIPOS_EQUIPO.find(
																(t) =>
																	t.value ===
																	revision.tipo_equipo,
															)?.label
														}
													</Badge>
												</div>
												<Badge
													color={
														getCategoriaColor(
															revision.categoria_equipo,
														) as any
													}>
													Cat. {revision.categoria_equipo}
												</Badge>
											</div>
										</td>
										<td className='px-4 py-4'>
											<span className='font-mono text-sm text-gray-900'>
												{revision.numero_serie}
											</span>
										</td>
										<td className='px-4 py-4'>
											<div className='max-w-xs truncate text-sm text-gray-600'>
												{revision.diagnostico_general}
											</div>
										</td>
										<td className='px-4 py-4'>
											<span className='text-sm text-gray-900'>
												{revision.tecnico_responsable}
											</span>
										</td>
										<td className='px-4 py-4'>
											<span className='text-sm text-gray-600'>
												{formatDate(revision.fecha_creacion)}
											</span>
										</td>
										<td className='px-4 py-4 text-center'>
											<Badge color={getEstadoColor(revision.estado) as any}>
												{
													ESTADOS_REVISION.find(
														(e) => e.value === revision.estado,
													)?.label
												}
											</Badge>
										</td>
										<td className='px-4 py-4'>
											<div className='flex items-center justify-center space-x-2'>
												<Button
													size='sm'
													variant='outline'
													color='blue'
													onClick={() => handleViewRevision(revision)}>
													<Icon icon='HeroEye' className='h-4 w-4' />
												</Button>
												<Button
													size='sm'
													variant='outline'
													color='amber'
													onClick={() => handleEditRevision(revision)}>
													<Icon icon='HeroPencil' className='h-4 w-4' />
												</Button>
												<Button
													size='sm'
													variant='outline'
													color='red'
													onClick={() => handleDeleteRevision(revision)}>
													<Icon icon='HeroTrash' className='h-4 w-4' />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{revisiones.length === 0 && (
							<div className='flex h-32 items-center justify-center'>
								<div className='text-center'>
									<Icon
										icon='HeroWrenchScrewdriver'
										className='mx-auto h-12 w-12 text-gray-400'
									/>
									<h3 className='mt-2 text-sm font-medium text-gray-900'>
										No hay revisiones
									</h3>
									<p className='mt-1 text-sm text-gray-500'>
										No se encontraron revisiones técnicas con los filtros
										aplicados.
									</p>
								</div>
							</div>
						)}
					</CardBody>
				</Card>

				{/* Modal de Confirmación de Eliminación */}
				<Modal isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} size='lg'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-6 w-6 text-red-600'
								/>
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Confirmar Eliminación
								</h2>
								<p className='text-sm text-gray-600'>
									Esta acción no se puede deshacer
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedRevision && (
							<div className='space-y-4'>
								<div className='rounded-lg bg-gray-50 p-4'>
									<h4 className='font-medium text-gray-900'>
										Revisión a eliminar:
									</h4>
									<div className='mt-2 space-y-1 text-sm text-gray-600'>
										<p>
											<strong>Equipo:</strong> {selectedRevision.marca}{' '}
											{selectedRevision.modelo}
										</p>
										<p>
											<strong>Número de Serie:</strong>{' '}
											{selectedRevision.numero_serie}
										</p>
										<p>
											<strong>Técnico:</strong>{' '}
											{selectedRevision.tecnico_responsable}
										</p>
										<p>
											<strong>Estado:</strong>{' '}
											{
												ESTADOS_REVISION.find(
													(e) => e.value === selectedRevision.estado,
												)?.label
											}
										</p>
									</div>
								</div>
								<div className='rounded-lg bg-red-50 p-4'>
									<p className='text-sm text-red-800'>
										<strong>
											¿Está seguro que desea eliminar esta revisión técnica?
										</strong>
									</p>
									<p className='mt-1 text-sm text-red-600'>
										Esta acción eliminará permanentemente la revisión y toda su
										información asociada.
									</p>
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end space-x-2'>
							<Button
								variant='outline'
								onClick={() => {
									setDeleteModalOpen(false);
									setSelectedRevision(null);
								}}>
								Cancelar
							</Button>
							<Button color='red' onClick={handleConfirmDelete}>
								Eliminar Revisión
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Creación de Revisión Técnica */}
				<Modal isOpen={createModalOpen} setIsOpen={setCreateModalOpen} size='xl'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<Icon icon='HeroPlus' className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Nueva Revisión Técnica
								</h2>
								<p className='text-sm text-gray-600'>
									Registra una nueva revisión de equipo
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						<form
							id='createRevisionForm'
							className='space-y-6'
							onSubmit={handleCreateSubmit}>
							{/* Campos Generales */}
							<div className='space-y-4'>
								<h4 className='border-b pb-2 font-medium text-gray-900'>
									Información General
								</h4>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='create-tipo-equipo' className='required'>
											Tipo de Equipo
										</Label>
										<Select
											id='create-tipo-equipo'
											name='tipo_equipo'
											value={selectedTipoEquipo}
											onChange={(e) =>
												setSelectedTipoEquipo(e.target.value as TipoEquipo)
											}
											required>
											{TIPOS_EQUIPO.map((tipo) => (
												<option key={tipo.value} value={tipo.value}>
													{tipo.label}
												</option>
											))}
										</Select>
									</div>
									<div>
										<Label htmlFor='create-categoria' className='required'>
											Categoría del Equipo
										</Label>
										<Select
											id='create-categoria'
											name='categoria_equipo'
											defaultValue='B'
											required>
											{CATEGORIAS_EQUIPO.map((categoria) => (
												<option
													key={categoria.value}
													value={categoria.value}>
													{categoria.label}
												</option>
											))}
										</Select>
									</div>
									<div>
										<Label htmlFor='create-marca' className='required'>
											Marca
										</Label>
										<Input
											id='create-marca'
											name='marca'
											type='text'
											placeholder='Ej: Dell, HP, Lenovo'
											required
										/>
									</div>
									<div>
										<Label htmlFor='create-modelo' className='required'>
											Modelo
										</Label>
										<Input
											id='create-modelo'
											name='modelo'
											type='text'
											placeholder='Ej: Latitude 7420'
											required
										/>
									</div>
									<div>
										<Label htmlFor='create-numero-serie' className='required'>
											Número de Serie
										</Label>
										<Input
											id='create-numero-serie'
											name='numero_serie'
											type='text'
											placeholder='Número de serie único'
											required
										/>
									</div>
									<div>
										<Label htmlFor='create-linea-serie'>Línea o Serie</Label>
										<Input
											id='create-linea-serie'
											name='linea_serie'
											type='text'
											placeholder='Ej: Latitude Business'
										/>
									</div>
									<div>
										<Label htmlFor='create-cliente'>Cliente</Label>
										<Input
											id='create-cliente'
											name='cliente'
											type='text'
											placeholder='Nombre del cliente o departamento'
										/>
									</div>
									<div>
										<Label htmlFor='create-proveedor'>Proveedor</Label>
										<Input
											id='create-proveedor'
											name='proveedor'
											type='text'
											placeholder='Nombre del proveedor'
										/>
									</div>
								</div>
							</div>

							{/* Diagnóstico */}
							<div className='space-y-4'>
								<div>
									<Label htmlFor='create-diagnostico' className='required'>
										Diagnóstico General
									</Label>
									<Textarea
										id='create-diagnostico'
										name='diagnostico_general'
										rows={3}
										placeholder='Describe el estado general del equipo y problemas encontrados'
										required
									/>
								</div>
								<div>
									<Label htmlFor='create-observaciones'>
										Observaciones Técnicas
									</Label>
									<Textarea
										id='create-observaciones'
										name='observaciones_tecnicas'
										rows={3}
										placeholder='Observaciones adicionales o recomendaciones'
									/>
								</div>
							</div>

							{/* Campos específicos por tipo de equipo */}
							{renderSpecificFields(selectedTipoEquipo)}

							{/* Opciones adicionales */}
							<div className='space-y-4'>
								<h4 className='border-b pb-2 font-medium text-gray-900'>
									Opciones Adicionales
								</h4>
								<div className='flex items-center space-x-2'>
									<Checkbox
										id='create-fotos'
										name='adjunto_fotos'
										defaultChecked={false}
									/>
									<Label htmlFor='create-fotos'>¿Se adjuntaron fotos?</Label>
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
										'createRevisionForm',
									) as HTMLFormElement;
									if (form)
										handleCreateSubmit({
											preventDefault: () => {},
											currentTarget: form,
										} as any);
								}}>
								Crear Revisión
							</Button>
						</div>
					</ModalFooter>
				</Modal>

				{/* Modal de Edición de Revisión Técnica */}
				<Modal isOpen={editModalOpen} setIsOpen={setEditModalOpen} size='xl'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
								<Icon icon='HeroPencil' className='h-6 w-6 text-amber-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Editar Revisión Técnica
								</h2>
								<p className='text-sm text-gray-600'>
									Actualiza la información de la revisión
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedRevision && (
							<form
								id='editRevisionForm'
								className='space-y-6'
								onSubmit={handleEditSubmit}>
								{/* Campos Generales */}
								<div className='space-y-4'>
									<h4 className='border-b pb-2 font-medium text-gray-900'>
										Información General
									</h4>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div>
											<Label htmlFor='edit-tipo-equipo' className='required'>
												Tipo de Equipo
											</Label>
											<Select
												id='edit-tipo-equipo'
												name='tipo_equipo'
												value={selectedTipoEquipo}
												onChange={(e) =>
													setSelectedTipoEquipo(
														e.target.value as TipoEquipo,
													)
												}
												required>
												{TIPOS_EQUIPO.map((tipo) => (
													<option key={tipo.value} value={tipo.value}>
														{tipo.label}
													</option>
												))}
											</Select>
										</div>
										<div>
											<Label htmlFor='edit-categoria' className='required'>
												Categoría del Equipo
											</Label>
											<Select
												id='edit-categoria'
												name='categoria_equipo'
												defaultValue={selectedRevision.categoria_equipo}
												required>
												{CATEGORIAS_EQUIPO.map((categoria) => (
													<option
														key={categoria.value}
														value={categoria.value}>
														{categoria.label}
													</option>
												))}
											</Select>
										</div>
										<div>
											<Label htmlFor='edit-marca' className='required'>
												Marca
											</Label>
											<Input
												id='edit-marca'
												name='marca'
												type='text'
												defaultValue={selectedRevision.marca}
												placeholder='Ej: Dell, HP, Lenovo'
												required
											/>
										</div>
										<div>
											<Label htmlFor='edit-modelo' className='required'>
												Modelo
											</Label>
											<Input
												id='edit-modelo'
												name='modelo'
												type='text'
												defaultValue={selectedRevision.modelo}
												placeholder='Ej: Latitude 7420'
												required
											/>
										</div>
										<div>
											<Label htmlFor='edit-numero-serie' className='required'>
												Número de Serie
											</Label>
											<Input
												id='edit-numero-serie'
												name='numero_serie'
												type='text'
												defaultValue={selectedRevision.numero_serie}
												placeholder='Número de serie único'
												required
											/>
										</div>
										<div>
											<Label htmlFor='edit-linea-serie'>Línea o Serie</Label>
											<Input
												id='edit-linea-serie'
												name='linea_serie'
												type='text'
												defaultValue={selectedRevision.linea_serie}
												placeholder='Ej: Latitude Business'
											/>
										</div>
										<div>
											<Label htmlFor='edit-cliente'>Cliente</Label>
											<Input
												id='edit-cliente'
												name='cliente'
												type='text'
												defaultValue={selectedRevision.cliente}
												placeholder='Nombre del cliente o departamento'
											/>
										</div>
										<div>
											<Label htmlFor='edit-proveedor'>Proveedor</Label>
											<Input
												id='edit-proveedor'
												name='proveedor'
												type='text'
												defaultValue={selectedRevision.proveedor}
												placeholder='Nombre del proveedor'
											/>
										</div>
									</div>
								</div>

								{/* Diagnóstico */}
								<div className='space-y-4'>
									<div>
										<Label htmlFor='edit-diagnostico' className='required'>
											Diagnóstico General
										</Label>
										<Textarea
											id='edit-diagnostico'
											name='diagnostico_general'
											rows={3}
											defaultValue={selectedRevision.diagnostico_general}
											placeholder='Describe el estado general del equipo y problemas encontrados'
											required
										/>
									</div>
									<div>
										<Label htmlFor='edit-observaciones'>
											Observaciones Técnicas
										</Label>
										<Textarea
											id='edit-observaciones'
											name='observaciones_tecnicas'
											rows={3}
											defaultValue={selectedRevision.observaciones_tecnicas}
											placeholder='Observaciones adicionales o recomendaciones'
										/>
									</div>
								</div>

								{/* Campos específicos por tipo de equipo */}
								{renderSpecificFields(selectedTipoEquipo, true, selectedRevision)}

								{/* Opciones adicionales */}
								<div className='space-y-4'>
									<h4 className='border-b pb-2 font-medium text-gray-900'>
										Opciones Adicionales
									</h4>
									<div className='flex items-center space-x-2'>
										<Checkbox
											id='edit-fotos'
											name='adjunto_fotos'
											defaultChecked={selectedRevision.adjunto_fotos}
										/>
										<Label htmlFor='edit-fotos'>¿Se adjuntaron fotos?</Label>
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
									setSelectedRevision(null);
								}}>
								Cancelar
							</Button>
							<Button
								color='amber'
								onClick={(e) => {
									e.preventDefault();
									const form = document.getElementById(
										'editRevisionForm',
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

				{/* Modal de Vista de Revisión Técnica */}
				<Modal isOpen={viewModalOpen} setIsOpen={setViewModalOpen} size='xl'>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
								<Icon icon='HeroEye' className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h2 className='text-xl font-bold text-gray-900'>
									Detalle de Revisión Técnica
								</h2>
								<p className='text-sm text-gray-600'>
									Información completa de la revisión
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{selectedRevision && (
							<div className='space-y-6'>
								{/* Información General */}
								<div className='space-y-4'>
									<h3 className='border-b pb-2 text-lg font-bold text-gray-900'>
										{selectedRevision.marca} {selectedRevision.modelo}
									</h3>
									<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
										<div className='space-y-3'>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Tipo de Equipo:
												</span>
												<Badge
													color={
														getTipoEquipoColor(
															selectedRevision.tipo_equipo,
														) as any
													}>
													{
														TIPOS_EQUIPO.find(
															(t) =>
																t.value ===
																selectedRevision.tipo_equipo,
														)?.label
													}
												</Badge>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Categoría:
												</span>
												<Badge
													color={
														getCategoriaColor(
															selectedRevision.categoria_equipo,
														) as any
													}>
													Categoría {selectedRevision.categoria_equipo}
												</Badge>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Número de Serie:
												</span>
												<span className='font-mono'>
													{selectedRevision.numero_serie}
												</span>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Estado:
												</span>
												<Badge
													color={
														getEstadoColor(
															selectedRevision.estado,
														) as any
													}>
													{
														ESTADOS_REVISION.find(
															(e) =>
																e.value === selectedRevision.estado,
														)?.label
													}
												</Badge>
											</div>
											{selectedRevision.linea_serie && (
												<div className='flex justify-between text-sm'>
													<span className='font-medium text-gray-700'>
														Línea/Serie:
													</span>
													<span>{selectedRevision.linea_serie}</span>
												</div>
											)}
										</div>
										<div className='space-y-3'>
											{selectedRevision.cliente && (
												<div className='flex justify-between text-sm'>
													<span className='font-medium text-gray-700'>
														Cliente:
													</span>
													<span>{selectedRevision.cliente}</span>
												</div>
											)}
											{selectedRevision.proveedor && (
												<div className='flex justify-between text-sm'>
													<span className='font-medium text-gray-700'>
														Proveedor:
													</span>
													<span>{selectedRevision.proveedor}</span>
												</div>
											)}
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Técnico:
												</span>
												<span>{selectedRevision.tecnico_responsable}</span>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Fecha:
												</span>
												<span>
													{formatDate(selectedRevision.fecha_creacion)}
												</span>
											</div>
											<div className='flex justify-between text-sm'>
												<span className='font-medium text-gray-700'>
													Fotos:
												</span>
												<Badge
													color={
														selectedRevision.adjunto_fotos
															? 'emerald'
															: 'gray'
													}>
													{selectedRevision.adjunto_fotos ? 'Sí' : 'No'}
												</Badge>
											</div>
										</div>
									</div>
								</div>

								{/* Diagnóstico */}
								<div className='space-y-4'>
									<h4 className='border-b pb-2 font-medium text-gray-900'>
										Diagnóstico
									</h4>
									<div className='rounded-lg bg-gray-50 p-4'>
										<p className='text-gray-700'>
											{selectedRevision.diagnostico_general}
										</p>
									</div>
									{selectedRevision.observaciones_tecnicas && (
										<div>
											<h5 className='mb-2 font-medium text-gray-700'>
												Observaciones Técnicas:
											</h5>
											<div className='rounded-lg bg-blue-50 p-4'>
												<p className='text-gray-700'>
													{selectedRevision.observaciones_tecnicas}
												</p>
											</div>
										</div>
									)}
								</div>

								{/* Especificaciones Técnicas */}
								<div className='space-y-4'>
									<h4 className='border-b pb-2 font-medium text-gray-900'>
										Especificaciones Técnicas
									</h4>
									{selectedRevision.tipo_equipo === 'notebook' && (
										<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
											<div className='space-y-3'>
												<h5 className='font-medium text-gray-700'>
													Hardware
												</h5>
												<div className='space-y-2 text-sm'>
													<div className='flex justify-between'>
														<span>Procesador:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).procesador
															}
														</span>
													</div>
													<div className='flex justify-between'>
														<span>RAM:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).memoria_ram_gb
															}{' '}
															GB{' '}
															{
																(
																	selectedRevision.especificaciones as any
																).tipo_ram
															}
														</span>
													</div>
													<div className='flex justify-between'>
														<span>Almacenamiento:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).almacenamiento_capacidad_gb
															}{' '}
															GB{' '}
															{
																(
																	selectedRevision.especificaciones as any
																).tecnologia_disco
															}
														</span>
													</div>
													<div className='flex justify-between'>
														<span>Sistema Operativo:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).sistema_operativo
															}
														</span>
													</div>
												</div>
											</div>
											<div className='space-y-3'>
												<h5 className='font-medium text-gray-700'>
													Estado de Componentes
												</h5>
												<div className='space-y-2 text-sm'>
													<div className='flex justify-between'>
														<span>Pantalla:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_pantalla,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_pantalla,
																)?.label
															}
														</Badge>
													</div>
													<div className='flex justify-between'>
														<span>Teclado:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_teclado,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_teclado,
																)?.label
															}
														</Badge>
													</div>
													<div className='flex justify-between'>
														<span>Batería:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_bateria,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_bateria,
																)?.label
															}
														</Badge>
													</div>
												</div>
											</div>
										</div>
									)}

									{selectedRevision.tipo_equipo === 'monitor' && (
										<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
											<div className='space-y-3'>
												<h5 className='font-medium text-gray-700'>
													Pantalla
												</h5>
												<div className='space-y-2 text-sm'>
													<div className='flex justify-between'>
														<span>Tamaño:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).tamano_pantalla_pulgadas
															}
															"
														</span>
													</div>
													<div className='flex justify-between'>
														<span>Resolución:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).resolucion
															}
														</span>
													</div>
													<div className='flex justify-between'>
														<span>Tipo de Panel:</span>
														<span>
															{
																(
																	selectedRevision.especificaciones as any
																).tipo_panel
															}
														</span>
													</div>
												</div>
											</div>
											<div className='space-y-3'>
												<h5 className='font-medium text-gray-700'>
													Estado
												</h5>
												<div className='space-y-2 text-sm'>
													<div className='flex justify-between'>
														<span>Pantalla:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_pantalla,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_pantalla,
																)?.label
															}
														</Badge>
													</div>
													<div className='flex justify-between'>
														<span>Marco:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_marco,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_marco,
																)?.label
															}
														</Badge>
													</div>
													<div className='flex justify-between'>
														<span>Base/Soporte:</span>
														<Badge
															color={
																getEstadoComponenteColor(
																	(
																		selectedRevision.especificaciones as any
																	).estado_base_soporte,
																) as any
															}>
															{
																ESTADOS_COMPONENTE.find(
																	(e) =>
																		e.value ===
																		(
																			selectedRevision.especificaciones as any
																		).estado_base_soporte,
																)?.label
															}
														</Badge>
													</div>
												</div>
											</div>
										</div>
									)}

									{['desktop', 'aio', 'docking'].includes(
										selectedRevision.tipo_equipo,
									) && (
										<div className='rounded-lg bg-blue-50 p-4'>
											<p className='text-sm text-blue-800'>
												Vista detallada para{' '}
												{
													TIPOS_EQUIPO.find(
														(t) =>
															t.value ===
															selectedRevision.tipo_equipo,
													)?.label
												}
												se implementará en la siguiente versión.
											</p>
										</div>
									)}
								</div>
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-between'>
							<Button
								variant='outline'
								onClick={() => {
									setViewModalOpen(false);
									setSelectedRevision(null);
								}}>
								Cerrar
							</Button>
							{selectedRevision && (
								<Button
									color='amber'
									onClick={() => {
										setViewModalOpen(false);
										handleEditRevision(selectedRevision);
									}}>
									Editar Revisión
								</Button>
							)}
						</div>
					</ModalFooter>
				</Modal>

				{/* Los modales están ahora completamente implementados */}
			</Container>
		</PageWrapper>
	);
};

export default RevisionesTecnicas;
