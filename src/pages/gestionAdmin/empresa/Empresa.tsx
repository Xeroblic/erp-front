// src/pages/EmpresaDetalle.tsx
import React, { useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchEmpresaPrincipal } from '@/store/slices/empresa/empresaSlice'
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper'
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader'
import Container from '@/components/layouts/Container/Container'
import Card, { CardBody } from '@/components/ui/Card'
import Label from '@/components/form/Label'
import Input from '@/components/form/Input'
import Button from '@/components/ui/Button'
import { IEmpresa } from '@/interface/empresas.interface'

export default function EmpresaDetalle() {
  const dispatch = useAppDispatch()
  const { detalleEmpresa: empresa, loading, error } = useAppSelector(s => s.empresa)

  // 1) Carga al montar
  useEffect(() => {
    dispatch(fetchEmpresaPrincipal())
  }, [dispatch])

  // 2) Formik
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nombre:      empresa?.nombre      || '',
      rut:         empresa?.rut         || '',
      descripcion: empresa?.descripcion || '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string().required('El nombre es requerido'),
      rut:    Yup.string().required('El RUT es requerido'),
      descripcion: Yup.string().nullable(),
    }),
    onSubmit: async values => {
      if (!empresa) return
      try {
        await fetch(`/api/empresas/${empresa.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        dispatch(fetchEmpresaPrincipal())
        alert('Empresa actualizada')
      } catch (e: any) {
        alert('Error al guardar: ' + e.message)
      }
    },
  })

  // 3) Estados
  if (loading)  return <div className="p-8 text-center">Cargando empresa…</div>
  if (error)    return <div className="p-8 text-red-600">Error: {error}</div>
  if (!empresa) return <div className="p-8 text-gray-600">No existe empresa configurada</div>

  // 4) Render
  return (
    <PageWrapper isProtectedRoute title="Detalle Empresa" name={empresa.nombre}>
      <Subheader>
        <SubheaderLeft>
          <h1 className="text-2xl font-semibold">Detalle de Empresa</h1>
        </SubheaderLeft>
        <SubheaderRight>
          <Button variant="solid" onClick={() => formik.handleSubmit()}>
            Guardar cambios
          </Button>
        </SubheaderRight>
      </Subheader>

      <Container className="pt-4 space-y-6">
        {/* ✨ Datos principales */}
        <Card>
          <CardBody>
            <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formik.values.nombre}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.nombre && formik.errors.nombre && (
                  <p className="text-red-600 text-sm">{formik.errors.nombre}</p>
                )}
              </div>
              <div>
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  name="rut"
                  value={formik.values.rut}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.rut && formik.errors.rut && (
                  <p className="text-red-600 text-sm">{formik.errors.rut}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  value={formik.values.descripcion}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.descripcion && formik.errors.descripcion && (
                  <p className="text-red-600 text-sm">{formik.errors.descripcion}</p>
                )}
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t pt-6">
                <div>
                  <Label htmlFor=''>Creada el</Label>
                  <p className="mt-1 text-gray-700">{new Date(empresa.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label htmlFor=''>Última actualización</Label>
                  <p className="mt-1 text-gray-700">{new Date(empresa.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label htmlFor=''>Rol asignado</Label>
                  <p className="mt-1 text-gray-700">#{empresa.pivot?.rol_id}</p>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* ✨ Subempresas y sucursales */}
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold mb-4">Subempresas</h2>
            {empresa.subempresas?.length > 0 ? (
              <div className="space-y-6">
                {empresa.subempresas?.map(sub => (
                  <Card key={sub.id} className="border-gray-200">
                    <CardBody className="space-y-2">
                      <h3 className="font-medium">{sub.nombre}</h3>
                      {sub.sucursales?.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {sub.sucursales?.map(suc => (
                            <li key={suc.id}>{suc.nombre}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">Sin sucursales</p>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No hay subempresas configuradas</p>
            )}
          </CardBody>
        </Card>
      </Container>
    </PageWrapper>
  )
}
