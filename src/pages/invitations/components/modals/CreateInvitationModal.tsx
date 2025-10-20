/* eslint-disable import/extensions */
import React, { useMemo } from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import Modal, {
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import { formatPermissionName, formatRoleName } from '@/pages/admin/Permission/utils/formatters';
import type { Permission, Role } from '@/store/slices/permissions/permissionsSlice';
import type { CreateInvitationData } from '@/interface/invitacion.interface';
import type { MultiValue, SingleValue } from 'react-select';

interface CreateInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onSubmit: (data: CreateInvitationData) => Promise<void>;
    roles: Role[];
    permissions: Permission[];
    isLoadingRoles: boolean;
    isLoadingPermissions: boolean;
}

interface FormValues {
    email: string;
    first_name: string;
    last_name: string;
    role_name: string;
    middle_name: string;
    second_last_name: string;
    position: string;
    rut: string;
    company_id: number;
    branch_id: number;
    phone_number: string;
    address: string;
    message: string;
    permissions: string[];
}

const validationSchema = Yup.object({
    email: Yup.string().email('El email no es valido').required('El email es requerido'),
    first_name: Yup.string().required('El nombre es requerido'),
    last_name: Yup.string().required('El apellido es requerido'),
    role_name: Yup.string().required('El rol es requerido'),
    rut: Yup.string().required('El RUT es requerido'),
    message: Yup.string(),
});

const normalizeInvitationRoleName = (roleName: string): string | null => {
    if (!roleName) return null;

    const roleMap: Record<string, string> = {
        'super-admin': 'super-admin',
        'superadmin': 'super-admin',
        'super admin': 'super-admin',
        'admin-empresa': 'company-admin',
        'admin empresa': 'company-admin',
        'company-admin': 'company-admin',
        'companyadmin': 'company-admin',
        'company admin': 'company-admin',
        'subsidiary-admin': 'subsidiary-admin',
        'subsidiaryadmin': 'subsidiary-admin',
        'subsidiary admin': 'subsidiary-admin',
        'jefe-subempresa': 'subsidiary-admin',
        'jefe subempresa': 'subsidiary-admin',
        'branch-admin': 'branch-admin',
        'branchadmin': 'branch-admin',
        'branch admin': 'branch-admin',
        'jefe-sucursal': 'branch-admin',
        'jefe sucursal': 'branch-admin',
    };

    const ascii = roleName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const normalized = ascii
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[_]+/g, ' ')
        .replace(/[^\w\s-]/g, '');

    if (roleMap[normalized]) {
        return roleMap[normalized];
    }

    const slug = normalized.replace(/\s+/g, '-');
    return roleMap[slug] ?? null;
};

const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onSubmit,
    roles,
    permissions,
    isLoadingRoles,
    isLoadingPermissions,
}) => {
    const roleOptions = useMemo<TSelectOption[]>(() => {
        return roles
            .map((role) => ({
                value: role.name,
                label: role.display_name ? role.display_name : formatRoleName(role.name),
                normalized: normalizeInvitationRoleName(role.name),
            }))
            .filter((role) => Boolean(role.normalized))
            .map(({ value, label }) => ({ value, label }));
    }, [roles]);

    const permissionOptions = useMemo<TSelectOption[]>(
        () =>
            permissions.map((permission) => ({
                value: permission.code || permission.name,
                label: formatPermissionName(permission.code || permission.name),
            })),
        [permissions],
    );

    const rolePlaceholder = useMemo(() => {
        if (isLoadingRoles) return 'Cargando roles...';
        if (!roleOptions.length) return 'No hay roles disponibles';
        return 'Selecciona un rol';
    }, [isLoadingRoles, roleOptions.length]);

    const permissionsPlaceholder = useMemo(() => {
        if (isLoadingPermissions) return 'Cargando permisos...';
        if (!permissionOptions.length) return 'No hay permisos disponibles';
        return 'Selecciona permisos opcionales';
    }, [isLoadingPermissions, permissionOptions.length]);

    const initialValues = useMemo<FormValues>(
        () => ({
            email: '',
            first_name: '',
            last_name: '',
            role_name: roleOptions[0]?.value ?? '',
            middle_name: '',
            second_last_name: '',
            position: '',
            rut: '',
            company_id: 1,
            branch_id: 1,
            phone_number: '',
            address: '',
            message: '',
            permissions: [],
        }),
        [roleOptions],
    );

    const normalizeField = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    };

    const handleSubmit = async (
        values: FormValues,
        { setSubmitting, resetForm, setFieldError }: FormikHelpers<FormValues>,
    ) => {
        try {
            const message = values.message.trim();

            const selectedRole = roles.find(
                (role) =>
                    role.name === values.role_name ||
                    role.display_name === values.role_name ||
                    String(role.id) === values.role_name,
            );

            if (!selectedRole) {
                setFieldError('role_name', 'Selecciona un rol valido');
                return;
            }

            const normalizedRoleName = normalizeInvitationRoleName(selectedRole.name);

            if (!normalizedRoleName) {
                setFieldError('role_name', 'Este rol no admite invitaciones automaticas');
                return;
            }

            const payload: CreateInvitationData = {
                email: values.email.trim(),
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
                role_name: normalizedRoleName,
                company_id: values.company_id,
                branch_id: values.branch_id,
                middle_name: normalizeField(values.middle_name),
                second_last_name: normalizeField(values.second_last_name),
                position: normalizeField(values.position),
                rut: values.rut.trim(),
                phone_number: normalizeField(values.phone_number),
                address: normalizeField(values.address),
                data: message
                    ? {
                          message,
                      }
                    : undefined,
                ttl_days: 7,
                permissions: values.permissions.length ? values.permissions : undefined,
            };

            await onSubmit(payload);
            resetForm();
            onClose();
            onSuccess();
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={handleClose} size='md'>
            <ModalHeader>
                <Icon icon='HeroPlusCircle' />
                <Badge> Nueva Invitacion </Badge>
            </ModalHeader>

            <Formik initialValues={initialValues} enableReinitialize validationSchema={validationSchema} onSubmit={handleSubmit}>
                {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    isSubmitting,
                    setFieldValue,
                }) => (
                    <Form>
                        <ModalBody className='space-y-6'>
                            <FieldWrap isValid={!errors.email} isTouched={touched.email} invalidFeedback={errors.email}>
                                <div>
                                    <Label htmlFor='email' className='text-zinc-200'>
                                        Email *
                                    </Label>
                                    <Input
                                        name='email'
                                        type='email'
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder='ejemplo@empresa.com'
                                        className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        isValid={!errors.email}
                                        isTouched={touched.email}
                                        invalidFeedback={errors.email}
                                    />
                                </div>
                            </FieldWrap>

                            <FieldWrap isValid={!errors.first_name} isTouched={touched.first_name} invalidFeedback={errors.first_name}>
                                <div>
                                    <Label htmlFor='first_name' className='text-zinc-200'>
                                        Nombre *
                                    </Label>
                                    <Input
                                        name='first_name'
                                        type='text'
                                        value={values.first_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder='Juan'
                                        className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        isValid={!errors.first_name}
                                        isTouched={touched.first_name}
                                        invalidFeedback={errors.first_name}
                                    />
                                </div>
                            </FieldWrap>

                            <FieldWrap isValid={!errors.last_name} isTouched={touched.last_name} invalidFeedback={errors.last_name}>
                                <div>
                                    <Label htmlFor='last_name' className='text-zinc-200'>
                                        Apellido *
                                    </Label>
                                    <Input
                                        name='last_name'
                                        type='text'
                                        value={values.last_name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder='Perez'
                                        className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        isValid={!errors.last_name}
                                        isTouched={touched.last_name}
                                        invalidFeedback={errors.last_name}
                                    />
                                </div>
                            </FieldWrap>

                            <FieldWrap isValid={!errors.role_name} isTouched={touched.role_name} invalidFeedback={errors.role_name}>
                                <div>
                                    <Label htmlFor='role_name' className='text-zinc-200'>
                                        Rol *
                                    </Label>
                                    <SelectReact
                                        name='role_name'
                                        options={roleOptions}
                                        value={roleOptions.find((option) => option.value === values.role_name) ?? null}
                                        onChange={(option) => {
                                            const selected = option as SingleValue<TSelectOption>;
                                            setFieldValue('role_name', selected?.value ?? '');
                                        }}
                                        isLoading={isLoadingRoles}
                                        placeholder={rolePlaceholder}
                                        isDisabled={isLoadingRoles || roleOptions.length === 0}
                                    />
                                </div>
                            </FieldWrap>

                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                <FieldWrap isValid={!errors.rut} isTouched={touched.rut} invalidFeedback={errors.rut}>
                                    <div>
                                        <Label htmlFor='rut' className='text-zinc-200'>
                                            RUT *
                                        </Label>
                                        <Input
                                            name='rut'
                                            type='text'
                                            value={values.rut}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='12.345.678-9'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                            isValid={!errors.rut}
                                            isTouched={touched.rut}
                                            invalidFeedback={errors.rut}
                                        />
                                    </div>
                                </FieldWrap>
                                <FieldWrap>
                                    <div>
                                        <Label htmlFor='position' className='text-zinc-200'>
                                            Cargo
                                        </Label>
                                        <Input
                                            name='position'
                                            type='text'
                                            value={values.position}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='Administrador de Recursos Humanos'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        />
                                    </div>
                                </FieldWrap>
                            </div>

                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                <FieldWrap>
                                    <div>
                                        <Label htmlFor='middle_name' className='text-zinc-200'>
                                            Segundo nombre
                                        </Label>
                                        <Input
                                            name='middle_name'
                                            type='text'
                                            value={values.middle_name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='Segundo nombre'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        />
                                    </div>
                                </FieldWrap>
                                <FieldWrap>
                                    <div>
                                        <Label htmlFor='second_last_name' className='text-zinc-200'>
                                            Segundo apellido
                                        </Label>
                                        <Input
                                            name='second_last_name'
                                            type='text'
                                            value={values.second_last_name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='Segundo apellido'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        />
                                    </div>
                                </FieldWrap>
                            </div>

                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                                <FieldWrap>
                                    <div>
                                        <Label htmlFor='phone_number' className='text-zinc-200'>
                                            Telefono
                                        </Label>
                                        <Input
                                            name='phone_number'
                                            type='text'
                                            value={values.phone_number}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='+56 9 1234 5678'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        />
                                    </div>
                                </FieldWrap>
                                <FieldWrap>
                                    <div>
                                        <Label htmlFor='address' className='text-zinc-200'>
                                            Direccion
                                        </Label>
                                        <Input
                                            name='address'
                                            type='text'
                                            value={values.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder='Av. Providencia 1234'
                                            className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                        />
                                    </div>
                                </FieldWrap>
                            </div>

                            <FieldWrap>
                                <div>
                                    <Label htmlFor='permissions' className='text-zinc-200'>
                                        Permisos adicionales
                                    </Label>
                                    <SelectReact
                                        name='permissions'
                                        isMulti
                                        options={permissionOptions}
                                        value={permissionOptions.filter((option) =>
                                            values.permissions.includes(option.value),
                                        )}
                                        onChange={(selected) => {
                                            const selection = (selected ?? []) as MultiValue<TSelectOption>;
                                            setFieldValue(
                                                'permissions',
                                                selection.map((option) => option.value),
                                            );
                                        }}
                                        isLoading={isLoadingPermissions}
                                        placeholder={permissionsPlaceholder}
                                        isDisabled={
                                            isLoadingPermissions || permissionOptions.length === 0
                                        }
                                    />
                                    <p className='mt-2 text-xs text-zinc-400'>
                                        Estos permisos se agregaran ademas de los permisos otorgados por el rol seleccionado.
                                    </p>
                                </div>
                            </FieldWrap>

                            <FieldWrap>
                                <div>
                                    <Label htmlFor='message' className='text-zinc-200'>
                                        Mensaje personalizado (opcional)
                                    </Label>
                                    <Textarea
                                        name='message'
                                        rows={3}
                                        value={values.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder='Mensaje adicional para incluir en la invitacion...'
                                        className='border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-400'
                                    />
                                </div>
                            </FieldWrap>
                        </ModalBody>

                        <ModalFooter>
                            <ModalFooterChild>
                                <button
                                    type='button'
                                    onClick={handleClose}
                                    className='inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2'>
                                    <Icon icon='HeroXMark' className='me-2 h-4 w-4' />
                                    Cancelar
                                </button>
                            </ModalFooterChild>

                            <ModalFooterChild>
                                <button
                                    type='submit'
                                    disabled={isSubmitting || !values.role_name || !values.rut}
                                    className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'>
                                    <Icon icon='HeroPaperAirplane' className='me-2 h-4 w-4' />
                                    {isSubmitting ? 'Enviando...' : 'Enviar Invitacion'}
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
