import React from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/form/Input'
import Label from '@/components/form/Label'
import { toast } from 'react-toastify'
import { useAppDispatch } from '@/store'
import { ISubempresa } from '@/interface/empresas.interface'
import { createSubsidiaria, updateSubsidiaria } from '@/store/slices/empresa/empresaSlice'
import { unwrapResult } from '@reduxjs/toolkit'

interface SubsidiaryModalProps {
    isOpen: boolean
    onClose: () => void
    subsidiary: ISubempresa | null
    onSuccess: () => void
}

const validationSchema = Yup.object({
    name: Yup.string()
        .required('El nombre es requerido')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    rut: Yup.string()
        .nullable()
        .matches(/^[\d\.-k]+$/i, 'Formato de RUT inválido')
        .max(12, 'El RUT no puede exceder 12 caracteres'),
    address: Yup.string()
        .nullable()
        .max(200, 'La dirección no puede exceder 200 caracteres'),
    phone: Yup.string()
        .nullable()
        .matches(/^[\d\s\-\+\(\)]*$/, 'Formato de teléfono inválido')
        .max(20, 'El teléfono no puede exceder 20 caracteres'),
    email: Yup.string()
        .nullable()
        .email('Formato de email inválido')
        .max(100, 'El email no puede exceder 100 caracteres'),
    website: Yup.string()
        .nullable()
        .url('Formato de URL inválido')
        .max(100, 'El sitio web no puede exceder 100 caracteres')
})

export default function SubsidiaryModal({ isOpen, onClose, subsidiary, onSuccess }: SubsidiaryModalProps) {
    const dispatch = useAppDispatch()
    const isEditing = Boolean(subsidiary)

    const formik = useFormik({
        initialValues: {
            name: subsidiary?.name || '',
            rut: subsidiary?.rut || '',
            address: subsidiary?.address || '',
            phone: subsidiary?.phone || '',
            email: subsidiary?.email || '',
            website: subsidiary?.website || ''
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // 🔥 NUEVO: Usar actions dinámicos de Redux
                const subsidiaryData = {
                    ...values,
                    // Convertir strings vacíos a null
                    rut: values.rut.trim() || undefined,
                    address: values.address.trim() || undefined,
                    phone: values.phone.trim() || undefined,
                    email: values.email.trim() || undefined,
                    website: values.website.trim() || undefined
                };

                if (isEditing && subsidiary?.id) {
                    // Actualizar subsidiaria existente
                    const action = await dispatch(updateSubsidiaria({
                        id: subsidiary.id,
                        data: subsidiaryData
                    }));
                    unwrapResult(action);
                } else {
                    // ➕ Crear nueva subsidiaria
                    const action = await dispatch(createSubsidiaria(subsidiaryData));
                    unwrapResult(action);
                }

                toast.success(isEditing
                    ? `${values.name} ha sido actualizada correctamente`
                    : `${values.name} ha sido creada correctamente`
                );

                onSuccess();
            } catch (error: any) {
                console.error('Error al guardar subempresa:', error);
                toast.error(isEditing
                    ? 'Error al actualizar la subempresa'
                    : 'Error al crear la subempresa'
                );
            } finally {
                setSubmitting(false);
            }
        }
    })

    const handleClose = () => {
        formik.resetForm()
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={() => handleClose()}
        >
            <ModalHeader>
                <h3 className="text-lg font-semibold">
                    {isEditing ? 'Editar Subempresa' : 'Nueva Subempresa'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1 ml-3">
                    {isEditing
                        ? 'Modifica los datos de la subempresa'
                        : 'Ingresa los datos de la nueva subempresa'
                    }
                </p>
            </ModalHeader>

            <ModalBody>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    {/* Nombre de la subempresa */}
                    <div>
                        <Label htmlFor="name">Nombre de la subempresa *</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ej: Sucursal Norte"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.name}</p>
                        )}
                    </div>

                    {/* RUT de la subempresa */}
                    <div>
                        <Label htmlFor="rut">RUT de la subempresa</Label>
                        <Input
                            id="rut"
                            name="rut"
                            placeholder="Ej: 12.345.678-9"
                            value={formik.values.rut}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.rut && formik.errors.rut && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.rut}</p>
                        )}
                    </div>

                    {/* Dirección */}
                    <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="Ej: Av. Principal 123, Ciudad"
                            value={formik.values.address}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.address && formik.errors.address && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.address}</p>
                        )}
                    </div>

                    {/* Teléfono */}
                    <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="Ej: +1 234 567 8900"
                            value={formik.values.phone}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.phone && formik.errors.phone && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.phone}</p>
                        )}
                    </div>

                    {/* Email de contacto */}
                    <div>
                        <Label htmlFor="email">Email de contacto</Label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="Ej: sucursal@empresa.com"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.email}</p>
                        )}
                    </div>

                    {/* Sitio web */}
                    <div>
                        <Label htmlFor="website">Sitio web</Label>
                        <Input
                            id="website"
                            name="website"
                            placeholder="Ej: https://sucursal.empresa.com"
                            value={formik.values.website}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            disabled={formik.isSubmitting}
                        />
                        {formik.touched.website && formik.errors.website && (
                            <p className="mt-1 text-red-600 text-sm">{formik.errors.website}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            isDisable={formik.isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="solid"
                            onClick={() => formik.handleSubmit()}
                            isLoading={formik.isSubmitting}
                            isDisable={!formik.isValid}
                        >
                            {isEditing ? 'Guardar Cambios' : 'Crear Subempresa'}
                        </Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}
