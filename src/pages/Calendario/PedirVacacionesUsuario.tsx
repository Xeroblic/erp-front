import Container from "@/components/layouts/Container/Container"
import PageWrapper from "@/components/layouts/PageWrapper/PageWrapper"
import Subheader, { SubheaderLeft, SubheaderRight } from "@/components/layouts/Subheader/Subheader"
import { useAppDispatch, useAppSelector } from "@/store"
import { detalleUsuarioEmpresaPorUserThunk, listaUsuariosEmpresaThunk } from "@/store/slices/empresa/empresaSlice"
import { useFormik } from "formik"
import { useEffect, useState } from "react"
import { DateRange, Range } from "react-date-range"
import es from 'date-fns/locale/es';
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import * as Yup from 'yup'
import Textarea from "@/components/form/Textarea"
import { toast } from "react-toastify"
import ApiService from "@/services/ApiService"
import dayjs from "dayjs"
import Radio, { RadioGroup } from "@/components/form/Radio"
import calcularDiasHabiles from "./utils/calcularDiasHabiles"


function PedirVacacionesUsuario() {
    const dispatch = useAppDispatch()
    const { personalizacionUsuario } = useAppSelector((state) => state.auth)
    const { detalleUsuarioEmpresa } = useAppSelector((state) => state.empresa)
    const [extraordinaria, setExtraordinaria] = useState<"true" | "false">("false")
    const [state, setState] = useState<Range[]>([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection',
        }
    ]);

    useEffect(() => {
        if (state.length > 0) {
            if (state[0].startDate) {
                formik.setFieldValue('fecha_inicio', state[0].startDate.toDateString())
            }
            if (state[0].endDate) {
                formik.setFieldValue('fecha_fin', state[0].endDate.toDateString())
            }
        }
    }, [state])

    useEffect(() => {
        dispatch(listaUsuariosEmpresaThunk())
        dispatch(detalleUsuarioEmpresaPorUserThunk({id_usuario: personalizacionUsuario?.usuario}))
    }, [personalizacionUsuario])

    const validationSchema = Yup.object().shape({
        fecha_inicio: Yup.string().required('Requerido'),
        fecha_fin: Yup.string().required('Requerido'),
        comentario: Yup.string().nullable(),
    }).test('dias-disponibles', 'No tienes suficientes días disponibles', function (values) {
        if (extraordinaria === "false") {
            const {fecha_inicio, fecha_fin } = values;

            if ( fecha_inicio && fecha_fin) {
                const startDate = new Date(fecha_inicio);
                const endDate = new Date(fecha_fin);
                const diasHabiles = calcularDiasHabiles(startDate, endDate);

                if (detalleUsuarioEmpresa && detalleUsuarioEmpresa.papeleta.dias_disponibles < diasHabiles) {
                    return this.createError({
                        path: 'fecha_fin',
                        message: `Los días seleccionados (${diasHabiles}) exceden los días disponibles (${detalleUsuarioEmpresa.papeleta.dias_disponibles}).`,
                    });
                }
            }
        }

        return true;
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            usuario_empresa: detalleUsuarioEmpresa?.id,
            fecha_inicio: "",
            fecha_fin: "",
            comentario: ""
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const response = await ApiService.fetchData({url: `/api/solicitudes-vacaciones/`, method: 'post', headers: {'Content-Type': 'application/json'}, data: JSON.stringify({...values, es_extraordinaria: extraordinaria === "true" ? true : false, fecha_inicio: dayjs(values.fecha_inicio).format('YYYY-MM-DD'), fecha_fin: dayjs(values.fecha_fin).format('YYYY-MM-DD'), creado_por: personalizacionUsuario?.usuario})})
                if (response.data) {
                    toast.success("Solicitud Creada", {autoClose: 1000})
                    formik.resetForm()
                    setState([
                        {
                            startDate: new Date(),
                            endDate: new Date(),
                            key: 'selection',
                        }
                    ])
                }
            } catch (error: any) {
                toast.error(error.response.data[0])
            }
        }
    })

    return (
        <PageWrapper isProtectedRoute={true} title="Crear Solicitud Vacaciones" name="Crear Solicitud Vacaciones">
            <Subheader>
                <SubheaderLeft>
                    <Badge className="text-xl">Pedir Vacaciones</Badge>
                </SubheaderLeft>
                <SubheaderRight>
                    <Button onClick={() => {formik.handleSubmit()}} variant="solid">Crear Solicitud</Button>
                </SubheaderRight>
            </Subheader>
            <Container className="w-full h-full">
                <div className="h-full flex">
                    <div className="grid grid-cols-12 w-full gap-4">
                        <div className="col-span-full">
                            <Card>
                                <CardBody className="flex justify-center items-center">
                                    <div className="w-full">
                                        <Badge>Dias Acumulados</Badge>
                                        <div id="dias_acumulados" className="ml-4">{detalleUsuarioEmpresa ? `${detalleUsuarioEmpresa.papeleta.dias_acumulados} dias` : "Sin Usuario"}</div>
                                    </div>
                                    <div className="w-full">
                                        <Badge>Dias Disponibles</Badge>
                                        <div id="dias_disponibles" className="ml-4">{detalleUsuarioEmpresa ? `${detalleUsuarioEmpresa.papeleta.dias_disponibles} dias` : "Sin Usuario"}</div>
                                    </div>
                                    <div className="w-full">
                                        <Badge>Dias Tomados</Badge>
                                        <div id="dias_tomados" className="ml-4">{detalleUsuarioEmpresa ? `${detalleUsuarioEmpresa.papeleta.dias_tomados} dias` : "Sin Usuario"}</div>
                                    </div>
                                    <div className="w-full">
                                        <Badge>Dias Habiles Seleccionados</Badge>
                                        <div className="ml-4">{calcularDiasHabiles(new Date(formik.values.fecha_inicio), new Date(formik.values.fecha_fin))}</div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        <div className="col-span-12">
                            <Card className="h-full">
                                <CardHeader>
                                    <Badge className="text-lg">Fechas</Badge>
                                </CardHeader>
                                <CardBody className="flex flex-col">
                                    <div className="flex justify-center">
                                        <Badge className="text-lg">¿Es Extraordinaria?</Badge>
                                        <RadioGroup isInline>
                                            <Radio
                                                label="Sí"
                                                name='si'
                                                value="true"
                                                selectedValue={extraordinaria}
                                                onChange={() => {setExtraordinaria("true")}}
                                            />
                                            <Radio
                                                label="No"
                                                name='no'
                                                value="false"
                                                selectedValue={extraordinaria}
                                                onChange={() => {setExtraordinaria("false")}}
                                            />
                                        </RadioGroup>
                                    </div>
                                    <div className="flex justify-center">
                                        <DateRange
                                            minDate={new Date()}
                                            editableDateInputs
                                            onChange={(item) => setState([item.selection])}
                                            moveRangeOnFirstSelection={false}
                                            ranges={state}
                                            color={"#3b82f6"}
                                            locale={es}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Badge className="text-lg text-center" color="red">{formik.errors.fecha_fin}</Badge>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        <div className="col-span-12">
                            <Card>
                                <CardHeader>
                                    <Badge className="text-lg">Comentario</Badge>
                                </CardHeader>
                                <CardBody>
                                    <Textarea 
                                        rows={4}
                                        name="comentario"
                                        value={formik.values.comentario}
                                        onChange={formik.handleChange}
                                    />
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </Container>
        </PageWrapper>
    )
}

export default PedirVacacionesUsuario