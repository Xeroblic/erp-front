import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Button from '@/components/ui/Button';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import { useInvitationsManagement } from '../../hooks/useInvitationsManagement';
import Badge from '@/components/ui/Badge';

interface CreateInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormValues {
    email: string;
    first_name: string;
    last_name: string;
    role_name: string;
    company_id: number;
    branch_id: number;
    message: string;
}

const validationSchema = Yup.object({
    email: Yup.string()
        .email('El email no es válido')
        .required('El email es requerido'),
    first_name: Yup.string()
        .required('El nombre es requerido'),
    last_name: Yup.string()
        .required('El apellido es requerido'),
    role_name: Yup.string()
        .required('El rol es requerido'),
    message: Yup.string()
});

const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { handleCreateInvitation } = useInvitationsManagement();

    const initialValues: FormValues = {
        email: '',
        first_name: '',
        last_name: '',
        role_name: 'employee',
        company_id: 1,
        branch_id: 1,
        message: ''
    };

    const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
        try {
            await handleCreateInvitation(values);
            resetForm();
            onClose();
            onSuccess();
        } catch (error) {
            // Error handling is done in the hook
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose} size="md">
            <ModalHeader>
                <Icon icon='HeroPlusCircle'/>
                <Badge> Nueva Invitación </Badge>
            </ModalHeader>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                    <Form>
                        <ModalBody className="space-y-6">
                            {/* Email */}
                            <FieldWrap
                                isValid={!errors.email}
                                isTouched={touched.email}
                                invalidFeedback={errors.email}
                            >
                                <div>
                                    <Label htmlFor="email" className="text-zinc-200">
                                        Email *
                                    </Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="ejemplo@empresa.com"
                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-400"
                                        isValid={!errors.email}
                                        isTouched={touched.email}
                                        invalidFeedback={errors.email}
                                    />
                                </div>
                            </FieldWrap>

                            {/* Nombre */}
                            <FieldWrap
                                isValid={!errors.first_name}
                                isTouched={touched.first_name}
                                invalidFeedback={errors.first_name}
                            >
                                <div>
                                    <Label htmlFor="first_name" className="text-zinc-200">
                                        Nombre *
                                    </Label>
                                    <Input
                                        name="first_name"
                                        type="text"
                                        value={values.first_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Juan"
                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-400"
                                        isValid={!errors.first_name}
                                        isTouched={touched.first_name}
                                        invalidFeedback={errors.first_name}
                                    />
                                </div>
                            </FieldWrap>

                            {/* Apellido */}
                            <FieldWrap
                                isValid={!errors.last_name}
                                isTouched={touched.last_name}
                                invalidFeedback={errors.last_name}
                            >
                                <div>
                                    <Label htmlFor="last_name" className="text-zinc-200">
                                        Apellido *
                                    </Label>
                                    <Input
                                        name="last_name"
                                        type="text"
                                        value={values.last_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Pérez"
                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-400"
                                        isValid={!errors.last_name}
                                        isTouched={touched.last_name}
                                        invalidFeedback={errors.last_name}
                                    />
                                </div>
                            </FieldWrap>

                            {/* Rol */}
                            <FieldWrap
                                isValid={!errors.role_name}
                                isTouched={touched.role_name}
                                invalidFeedback={errors.role_name}
                            >
                                <div>
                                    <Label htmlFor="role_name" className="text-zinc-200">
                                        Rol *
                                    </Label>
                                    <Select
                                        name="role_name"
                                        value={values.role_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className="bg-zinc-800/50 border-zinc-700 text-white"
                                        isValid={!errors.role_name}
                                        isTouched={touched.role_name}
                                        invalidFeedback={errors.role_name}
                                    >
                                        <option value="employee">Empleado</option>
                                        <option value="hr">Recursos Humanos</option>
                                        <option value="admin">Administrador</option>
                                    </Select>
                                </div>
                            </FieldWrap>

                            {/* Mensaje personalizado */}
                            <FieldWrap>
                                <div>
                                    <Label htmlFor="message" className="text-zinc-200">
                                        Mensaje personalizado (opcional)
                                    </Label>
                                    <Textarea
                                        name="message"
                                        rows={3}
                                        value={values.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Mensaje adicional para incluir en la invitación..."
                                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-400"
                                    />
                                </div>
                            </FieldWrap>
                        </ModalBody>

                        <ModalFooter>
                            <ModalFooterChild>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="inline-flex items-center px-4 py-2 border border-zinc-700 text-sm font-medium rounded-md text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
                                >
                                    <Icon icon="HeroXMark" className="h-4 w-4 me-2" />
                                    Cancelar
                                </button>
                            </ModalFooterChild>

                            <ModalFooterChild>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icon icon="HeroPaperAirplane" className="h-4 w-4 me-2" />
                                    {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
                                </button>
                            </ModalFooterChild>
                        </ModalFooter>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default CreateInvitationModal;
