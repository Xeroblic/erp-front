import React, { useState } from 'react'
import Table, { TBody, THead, Tr, Th, Td } from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/icon/Icon'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import SubsidiaryModal from './SubsidiaryModal'
import { ISubempresa } from '@/interface/empresas.interface'
import { useNavigate } from 'react-router-dom'

interface SubsidiariesTableProps {
    subsidiaries: ISubempresa[]
    loading: boolean
    onRefresh: () => void
}

export default function SubsidiariesTable({ subsidiaries, loading, onRefresh }: SubsidiariesTableProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSubsidiary, setEditingSubsidiary] = useState<ISubempresa | null>(null)

    const navigate = useNavigate()
    const handleEdit = (subsidiary: ISubempresa) => {
        setEditingSubsidiary(subsidiary)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setEditingSubsidiary(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingSubsidiary(null)
    }

    const handleSuccess = () => {
        handleCloseModal()
        onRefresh()
    }

    if (loading) {
        return (
            <Card>
                <CardBody>
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                            <span className="text-zinc-600">Cargando subempresas...</span>
                        </div>
                    </div>
                </CardBody>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon icon="HeroBuildingStorefront" className="text-xl" />
                        <div>
                            <h3 className="font-semibold">Subempresas</h3>
                            <p className="text-sm text-zinc-500">
                                {subsidiaries.length} subempresa{subsidiaries.length !== 1 ? 's' : ''} registrada{subsidiaries.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            icon="HeroArrowPath"
                            onClick={onRefresh}
                            size="sm"
                        >
                            Actualizar
                        </Button>
                        <Button
                            variant="solid"
                            icon="HeroPlus"
                            onClick={handleCreate}
                            size="sm"
                        >
                            Nueva Subempresa
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {subsidiaries.length > 0 ? (
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>Nombre</Th>
                                    <Th>RUT</Th>
                                    <Th>Dirección</Th>
                                    <Th>Teléfono</Th>
                                    <Th>Email</Th>
                                    <Th>Sucursales</Th>
                                    <Th className="w-24">Acciones</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {subsidiaries.map((subsidiary) => (
                                    <Tr key={subsidiary.id}>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <Icon icon="HeroBuildingStorefront" className="text-primary-600 text-sm" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{subsidiary.name}</div>
                                                    <div className="text-xs text-zinc-500">ID: {subsidiary.id}</div>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            {subsidiary.rut ? (
                                                <span className="text-sm font-mono">{subsidiary.rut}</span>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-400">
                                                    Sin RUT
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="max-w-xs">
                                                {subsidiary.address ? (
                                                    <span className="text-sm">{subsidiary.address}</span>
                                                ) : (
                                                    <Badge variant="outline" className="text-zinc-400">
                                                        Sin dirección
                                                    </Badge>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            {subsidiary.phone ? (
                                                <div className="flex items-center gap-1">
                                                    <Icon icon="HeroPhone" className="text-xs text-zinc-400" />
                                                    <span className="text-sm">{subsidiary.phone}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-400">
                                                    Sin teléfono
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td>
                                            {subsidiary.email ? (
                                                <div className="flex items-center gap-1">
                                                    <Icon icon="HeroEnvelope" className="text-xs text-zinc-400" />
                                                    <span className="text-sm">{subsidiary.email}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-zinc-400">
                                                    Sin email
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-1">
                                                <Icon icon="HeroBuildingOffice" className="text-xs text-zinc-400" />
                                                <span className="text-sm">
                                                    {subsidiary.branches_count || subsidiary.sucursales?.length || 0}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon="HeroPencil"
                                                    onClick={() => handleEdit(subsidiary)}
                                                    className="p-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon="HeroEye"
                                                    className="p-1"
                                                    onClick={() => navigate(`/gestion/subempresa/${subsidiary.id}`)}
                                                />
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Icon icon="HeroBuildingStorefront" className="text-2xl text-zinc-400" />
                            </div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                No hay subempresas registradas
                            </h3>
                            <p className="text-sm text-zinc-500 mb-4 max-w-sm">
                                Comienza agregando tu primera subempresa para organizar mejor tu estructura empresarial.
                            </p>
                            <Button
                                variant="solid"
                                icon="HeroPlus"
                                onClick={handleCreate}
                                size="sm"
                            >
                                Crear Primera Subempresa
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modal para crear/editar subempresa */}
            <SubsidiaryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                subsidiary={editingSubsidiary}
                onSuccess={handleSuccess}
            />
        </>
    )
}