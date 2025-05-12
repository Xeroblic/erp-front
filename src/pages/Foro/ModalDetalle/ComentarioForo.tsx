import { IComentario } from "@/interface/foro.interface";
import { useState } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import ApiService from "@/services/ApiService";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchForosThunk } from "@/store/slices/foros/foroSlice";
import Avatar from "@/components/Avatar";
import Button from "@/components/ui/Button";
import Icon from "@/components/icon/Icon";
import extractDate from "@/hooks/extractedDate";
import Input from "@/components/form/Input";

function ComentarioForo({ comentario, idforo }: { idforo: any, comentario: IComentario }) {
    const dispatch = useAppDispatch();
    const [respondiendo, setRespondiendo] = useState<boolean>(false);
    const { access, isAuthenticated } = useAppSelector((state) => state.auth);

    const formik = useFormik({
        initialValues: {
            contenido: ''
        },
        onSubmit: async (values) => {
            try {
                const response = await ApiService.fetchData({
                    url: `/api/foros/comentarios/`,
                    method: 'post',
                    headers: { 'Authorization': `Bearer ${access}`, 'Content-Type': 'application/json' },
                    data: JSON.stringify({ contenido: values.contenido, comentario_padre: comentario.id, foro: idforo })
                });
                if (response.data) {
                    toast.success('Comentario creado', { autoClose: 1000 });
                    dispatch(fetchForosThunk());
                    setRespondiendo(false);
                    formik.resetForm();
                }
            } catch (error: any) {
                toast.error(error.message);
            }
        }
    });

    return (
        <div className="h-full">
            <div className="pb-6">
                <div className="md:flex items-center justify-between">
                    <div className="flex items-center">
                        <Avatar
                            rounded="rounded-full"
                            src={comentario.usuario.first_name || '/logo512.png'}
                        />
                        <div className="ltr:ml-2 rtl:mr-2">
                            <div className="font-semibold truncate text-gray-900 dark:text-gray-100">
                                {comentario.usuario.first_name} {comentario.usuario.last_name}
                            </div>
                        </div>
                    </div>
                    <Icon icon="clock" className="text-lg">
                        <span className="font-semibold">
                            {extractDate(comentario.fecha_creacion).day}/{extractDate(comentario.fecha_creacion).month} {extractDate(comentario.fecha_creacion).hours}:{extractDate(comentario.fecha_creacion).minutes}
                        </span>
                    </Icon>
                </div>
                <div className="mt-2">
                    {comentario.contenido}
                </div>
                <div>
                    {isAuthenticated && (
                        respondiendo ? (
                            <form onSubmit={formik.handleSubmit}>
                                <Input
                                    // textArea
                                    name="contenido"
                                    className="mt-2"
                                    value={formik.values.contenido}
                                    onChange={formik.handleChange}
                                />
                                <Button size="xs" variant="default" onClick={() => { setRespondiendo(false) }}>Cancelar</Button>
                                <Button size="xs" variant="default" className="ml-2" type="submit">Guardar</Button>
                            </form>
                        ) : (
                            <Button size="xs" variant="default" className="!p-0 !m-0" onClick={() => { setRespondiendo(true) }}>Responder</Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default ComentarioForo;
