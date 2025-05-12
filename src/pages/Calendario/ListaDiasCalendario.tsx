import { createRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayjs from 'dayjs';
import colors from 'tailwindcss/colors';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
import { DateSelectArg, EventContentArg } from '@fullcalendar/core';
import Calendar, { useCalendarView } from '@/components/Calendar';
import Avatar from '@/components/Avatar';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import esLocale from '@fullcalendar/core/locales/es';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalFooterChild } from '@/components/ui/Modal';
import Validation from '@/components/form/Validation';
import { useFormik } from 'formik';
import { useAppDispatch, useAppSelector } from '@/store';
import * as Yup from 'yup';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import {
    detalleDiaCalendarioThunk,
    listaSolicitudesVacacionesThunk,
} from '@/store/slices/calendario/calendarioSlice';
import { DayCellContentArg } from '@fullcalendar/core';
import ApiService from '@/services/ApiService';
import { ISolicitudVacaciones } from '@/interface/calendario.interface';

const validationSchema = Yup.object({
    es_feriado: Yup.boolean().required('Feriado es un campo obligatorio'),
    descripcion: Yup.string().max(250, 'La descripción no puede tener más de 250 caracteres').nullable(),
});

const ListaDiasCalendario = () => {
    const dispatch = useAppDispatch();
    const { detalleDiaCalendario, listaSolicitudesVacaciones } = useAppSelector((state) => state.calendario);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectDate, setSelectDate] = useState<DateSelectArg | undefined>(undefined);
    const [events, setEvents] = useState<
        {
            id: string;
            title: string;
            start: string;
            end?: string;
            backgroundColor: string;
            borderColor: string;
            extendedProps: {
                es_feriado?: boolean;
                es_vacacion?: boolean;
                user?: { image: { thumb: string } };
            };
        }[]
    >([]);

    const ref = createRef<FullCalendar>();
    const { viewMode, changeViewMode, next, prev, today, title: currentDate } = useCalendarView(ref);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                await dispatch(detalleDiaCalendarioThunk({ fecha: dayjs(currentDate).format('YYYY-MM-DD') }));
                await dispatch(listaSolicitudesVacacionesThunk()).unwrap();
            } catch (error) {
                console.error('Error al cargar los eventos:', error);
            }
        };

        fetchEvents();
    }, [dispatch, currentDate]);

    useEffect(() => {
        const feriadosEvents = Array.isArray(detalleDiaCalendario) ? detalleDiaCalendario.map((detalle) => ({
            id: detalle.id.toString(),
            title: detalle.descripcion,
            start: detalle.fecha,
            backgroundColor: colors.yellow['500'],
            borderColor: colors.yellow['500'],
            extendedProps: {
                es_feriado: true,
                es_vacacion: false,
                user: { image: { thumb: 'https://via.placeholder.com/150' } },
            },
        })) : [];

        const vacacionesEvents = listaSolicitudesVacaciones.map((vacacion: ISolicitudVacaciones) => ({
            id: vacacion.id.toString(),
            title: `Vacaciones de usuario ${vacacion.usuario_empresa}`,
            start: vacacion.fecha_inicio,
            end: dayjs(vacacion.fecha_fin).add(1, 'day').format('YYYY-MM-DD'),
            backgroundColor: colors.blue['500'],
            borderColor: colors.blue['500'],
            extendedProps: {
                es_feriado: false,
                es_vacacion: true,
                user: { image: { thumb: 'https://via.placeholder.com/150' } },
            },
        }));

        setEvents([...feriadosEvents, ...vacacionesEvents]);
    }, [detalleDiaCalendario, listaSolicitudesVacaciones]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            es_feriado: detalleDiaCalendario?.es_feriado || false,
            descripcion: detalleDiaCalendario?.descripcion || '',
            empresa: detalleDiaCalendario?.empresa || '',
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const response = await ApiService.fetchData({
                    url: `/api/dias-calendario/`,
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ ...values, fecha: selectDate?.startStr })
                });
                if (response.data) {
                    formik.resetForm();
                    toast.success("Dia Creado");
                    setIsOpen(false);
                }
            } catch (error: any) {
                if (error.response?.data?.includes("No se encontró un día")) {
                    try {
                        const response = await ApiService.fetchData({
                            url: `/api/dias-calendario/editar_por_fecha/`,
                            method: 'patch',
                            headers: { 'Content-Type': 'application/json' },
                            data: JSON.stringify({ ...values, empresa: detalleDiaCalendario?.empresa, fecha: selectDate?.startStr })
                        });
                        if (response.data) {
                            formik.resetForm();
                            toast.success("Dia Editado");
                            setIsOpen(false);
                        }
                    } catch (createError: any) {
                        toast.error(createError.response.data);
                    }
                } else {
                    toast.error(error.response.data);
                }
            }
        },
    });

	const renderEventContent = (eventContent: EventContentArg) => {
        const { user, es_feriado, es_vacacion } = eventContent.event.extendedProps as any;

        return (
            <div className="flex items-center gap-2">
                {user?.image?.thumb && <Avatar src={user.image.thumb} className="w-6 h-6" />}
                <span className="truncate">{eventContent.event.title}</span>
                {es_feriado && <span className="ml-2 text-red-500">(Feriado)</span>}
                {es_vacacion && <span className="ml-2 text-blue-500">(Vacaciones)</span>}
            </div>
        );
    };

    const renderDayCellContent = (arg: DayCellContentArg) => {
        return <div className="fc-daygrid-day-number text-center">{arg.dayNumberText}</div>;
    };

    const handleDateSelect = async (e: DateSelectArg) => {
        setSelectDate(e);
        setIsOpen(true);
    };

    const dayCellClassNames = (arg: DayCellContentArg) => {
        const isSunday = dayjs(arg.date).day() === 0;
        const isHoliday = events.some(
            (event) => dayjs(event.start).isSame(arg.date, 'day') && event.extendedProps.es_feriado
        );
        const isVacation = events.some(
            (event) => dayjs(event.start).isSame(arg.date, 'day') && event.extendedProps.es_vacacion
        );

        let classNames = 'transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg';

        if (isSunday) {
            classNames += ' bg-red-300 text-white hover:bg-red-400';
        }
        if (isHoliday) {
            classNames += ' bg-yellow-300 text-black hover:bg-yellow-400';
        }
        if (isVacation) {
            classNames += ' border border-blue-500 bg-blue-300 text-white hover:bg-blue-400';
        }

        return classNames.trim();
    };

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <CardHeaderChild>{currentDate}</CardHeaderChild>
                    <CardHeaderChild>
                        <Button onClick={() => prev(true)} icon="HeroChevronDoubleLeft" />
                        <Button onClick={() => prev()} icon="HeroChevronLeft" />
                        <Button onClick={() => today()} icon="HeroCalendar" />
                        <Button onClick={() => next()} icon="HeroChevronRight" />
                        <Button onClick={() => next(true)} icon="HeroChevronDoubleRight" />
                        <Dropdown>
                            <DropdownToggle>
                                <Button color="zinc" icon="HeroCalendarDays">
                                    Mes
                                </Button>
                            </DropdownToggle>
                            <DropdownMenu placement="bottom-end">
                                <DropdownItem
                                    isActive={viewMode === 'dayGridMonth'}
                                    onClick={() => changeViewMode('dayGridMonth')}
                                >
                                    Mes
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </CardHeaderChild>
                </CardHeader>
                <CardBody>
                    <Calendar
                        ref={ref}
                        height={700}
                        viewMode={viewMode}
                        initialEvents={events}
                        locales={[esLocale]}
                        locale="es"
                        selectable
                        select={handleDateSelect}
                        eventContent={renderEventContent}
                        dayCellClassNames={dayCellClassNames}
                        dayCellContent={renderDayCellContent}
                    />
                </CardBody>
            </Card>
            <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
                <ModalHeader>
                    <div>Editar Dia {selectDate?.start.toLocaleDateString()}</div>
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col">
                        <div>
                            <Label htmlFor="">¿Es Feriado?</Label>
                            <Validation
                                isValid={formik.isValid}
                                isTouched={formik.touched.es_feriado}
                                invalidFeedback={formik.errors.es_feriado}
                            >
                                <RadioGroup isInline>
                                    <Radio
                                        label="Si"
                                        name="es_feriado"
                                        value="true"
                                        selectedValue={`${formik.values.es_feriado}`}
                                        onChange={formik.handleChange}
                                    />
                                    <Radio
                                        label="No"
                                        name="es_feriado"
                                        value="false"
                                        selectedValue={`${formik.values.es_feriado}`}
                                        onChange={formik.handleChange}
                                    />
                                </RadioGroup>
                            </Validation>
                        </div>
                        <div>
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Validation
                                isValid={formik.isValid}
                                isTouched={formik.touched.descripcion}
                                invalidFeedback={formik.errors.descripcion}
                            >
                                <Textarea
                                    id="descripcion"
                                    name="descripcion"
                                    rows={10}
                                    value={formik.values.descripcion}
                                    onChange={formik.handleChange}
                                />
                            </Validation>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <ModalFooterChild />
                    <ModalFooterChild>
                        <Button color="red" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="solid" onClick={() => formik.handleSubmit()}>
                            Guardar
                        </Button>
                    </ModalFooterChild>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ListaDiasCalendario;