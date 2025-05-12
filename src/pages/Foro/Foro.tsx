import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import { RootState, useAppSelector } from '@/store';
import {
    fetchForosThunk,
    toggleForoLikeThunk,
    createComentarioThunk,
} from '@/store/slices/foros/foroSlice';
import { unwrapResult } from '@reduxjs/toolkit';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import { IComentario } from '@/interface/foro.interface';
import { motion } from 'framer-motion';
import Icon from '@/components/icon/Icon';

const Foro = () => {
    const dispatch = useDispatch();
    const { foros, loading, error } = useAppSelector((state: RootState) => state.foro);
    const userId = useAppSelector((state) => state.auth.userMe?.pk); // Assuming you have user info in auth slice

    useEffect(() => {
        dispatch(fetchForosThunk());
    }, [dispatch]);

    useEffect(() => {
        console.log('Foros:', foros);
        console.log('Loading:', loading);
        console.log('Error:', error);
    }, [foros, loading, error]);

    const handleLike = async (foroId: number) => {
        try {
            const resultAction = dispatch(toggleForoLikeThunk({ foroId }));
            unwrapResult(resultAction as any);
            dispatch(fetchForosThunk());
        } catch (err) {
            console.error('Failed to like the foro: ', err);
        }
    };

    const handleCommentSubmit = (
        values: { contenido: string; foroId: number; comentarioId?: number },
        { resetForm }: any,
    ) => {
        dispatch(createComentarioThunk(values));
        dispatch(fetchForosThunk());
        resetForm();
    };

    const [showReplies, setShowReplies] = React.useState<{ [key: number]: boolean }>({});

    const renderComentarios = (comentarios: IComentario[], foroId: number) => {
        const toggleReplies = (comentarioId: number) => {
            setShowReplies((prev) => ({ ...prev, [comentarioId]: !prev[comentarioId] }));
        };

        if (comentarios.length === 0) return null;
        const comentario = comentarios[0];

        return (
            <div key={comentario.id} className='mt-4 rounded-lg border bg-gray-100 p-4'>
                <p className='text-gray-800'>{comentario.contenido}</p>
                <p className='text-sm text-gray-600'>
                    By {comentario.usuario.first_name} {comentario.usuario.last_name} on{' '}
                    {new Date(comentario.fecha_creacion).toLocaleString()}
                </p>
                <Formik
                    initialValues={{ contenido: '', foroId: foroId, comentarioId: comentario.id }}
                    validationSchema={Yup.object({
                        contenido: Yup.string().required('Content is required'),
                    })}
                    onSubmit={handleCommentSubmit}>
                    {() => (
                        <Form className='mt-2'>
                            <Field
                                name='contenido'
                                as='textarea'
                                placeholder='Reply to this comment...'
                                className='w-full rounded border bg-white p-2 text-black'
                            />
                            <ErrorMessage
                                name='contenido'
                                component='div'
                                className='text-sm text-red-500'
                            />
                            <Button className='mt-2' onClick={() => toggleReplies(comentario.id)}>
                                Reply
                            </Button>
                        </Form>
                    )}
                </Formik>
                {comentario.hijos && comentario.hijos.length > 0 && (
                    <div className='mt-2'>
                        <Button
                            onClick={() => toggleReplies(comentario.id)}
                            className='text-blue-500'>
                            {showReplies[comentario.id] ? 'Hide Replies' : 'View Replies'}
                        </Button>
                        {showReplies[comentario.id] && (
                            <div className='ml-6 mt-2'>
                                {renderComentarios(comentario.hijos, foroId)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <PageWrapper isProtectedRoute={false} title='Foro'>
            <Subheader>
                <SubheaderLeft>
                    <Badge className='text-4xl'>FORO</Badge>
                </SubheaderLeft>
            </Subheader>
            <Container className='flex h-full w-full flex-col items-center'>
                {/* {loading && <p>Loading...</p>}
                {error && <p>Error: {error}</p>} */}
                <div className='foros-list mb-16 mt-8 grid w-full max-w-6xl grid-cols-1 gap-8'>
                    {Array.isArray(foros) &&
                        foros.map((foro) => (
                            <Card
                                key={foro.id}
                                className='mb-6 transform rounded-lg shadow-xl transition-transform hover:scale-105'>
                                <CardHeader className='rounded-t-lg bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-white'>
                                    <h1 className='text-2xl font-bold'>{foro.nombre}</h1>
                                </CardHeader>
                                <CardBody className='rounded-b-lg p-6'>
                                    <div className='mb-6 max-h-80 w-full overflow-hidden rounded-lg'>
                                        <img
                                            className='h-full w-full rounded-lg object-cover'
                                            src={foro.imagen}
                                            alt={foro.nombre}
                                        />
                                    </div>
                                    <p className='text-gray-800'>{foro.descripcion}</p>
                                    <div className='mt-4 flex items-center justify-between'>
                                        <Button
                                            onClick={() => handleLike(foro.id)}
                                            className='flex items-center'>
                                            <motion.div
                                                whileTap={{ scale: 0.9 }}
                                                animate={{
                                                    scale: foro.likes?.some(
                                                        (like) =>
                                                            like.usuario.id === userId &&
                                                            like.activo,
                                                    )
                                                        ? 1.2
                                                        : 1,
                                                }}
                                                transition={{ duration: 0.2 }}>
                                                {foro.likes?.some(
                                                    (like) =>
                                                        like.usuario.id === userId &&
                                                        like.activo,
                                                ) ? (
                                                    <Icon
                                                        icon='HeroHeart'
                                                        color='red'
                                                        className='mr-2'
                                                    />
                                                ) : (
                                                    <Icon
                                                        icon='HeroHeart'
                                                        color='gray'
                                                        className='mr-2'
                                                    />
                                                )}
                                            </motion.div>
                                            Like
                                        </Button>
                                        <span>
                                            {foro.likes?.filter((like) => like.activo).length || 0}{' '}
                                            Likes
                                        </span>
                                    </div>
                                    <Formik
                                        initialValues={{
                                            contenido: '',
                                            foroId: foro.id,
                                            comentarioId: undefined,
                                        }}
                                        validationSchema={Yup.object({
                                            contenido: Yup.string().required('Content is required'),
                                        })}
                                        onSubmit={handleCommentSubmit}>
                                        {() => (
                                            <Form className='mt-4'>
                                                <Field
                                                    name='contenido'
                                                    as='textarea'
                                                    placeholder='Add a comment...'
                                                    className='w-full rounded-lg border p-2'
                                                />
                                                <ErrorMessage
                                                    name='contenido'
                                                    component='div'
                                                    className='text-sm text-red-500'
                                                />
                                                <Button className='mt-2' typeof='submit' onClick={() => {
                                                    handleCommentSubmit

                                                }}>
                                                    Comment
                                                </Button>
                                            </Form>
                                        )}
                                    </Formik>
                                    <div className='mt-4'>
                                        {foro.comentarios &&
                                            renderComentarios(
                                                foro.comentarios.map(
                                                    (c) =>
                                                        ({
                                                            ...c,
                                                            fecha_creacion: new Date(
                                                                c.fecha_creacion,
                                                            ).toISOString(),
                                                            hijos: c.hijos.map((hijo) => ({
                                                                ...hijo,
                                                                fecha_creacion: new Date(
                                                                    hijo.fecha_creacion,
                                                                ).toISOString(),
                                                            })),
                                                        }) as IComentario,
                                                ),
                                                foro.id,
                                            )}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                </div>
            </Container>
        </PageWrapper>
    );
};

export default Foro;
