import FieldWrap from "@/components/form/FieldWrap";
import Input from "@/components/form/Input";
import Validation from "@/components/form/Validation";
import Icon from "@/components/icon/Icon";
import PageWrapper from "@/components/layouts/PageWrapper/PageWrapper"
import Button from "@/components/ui/Button";
import ApiService from "@/services/ApiService";
import LogoTemplate from "@/templates/layouts/Logo/Logo.template";
import classNames from "classnames";
import { useFormik } from "formik";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as Yup from 'yup'

const validationSchema = Yup.object().shape({
	password: Yup.string()
	  	.min(8, 'La contraseña debe tener al menos 8 caracteres')
	  	.required('La contraseña es obligatoria'),
	confirm_password: Yup.string()
	  	.oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
	  	.required('La confirmación de la contraseña es obligatoria'),
});

function AceptarInvitacionEmpresa() {
	const { token } = useParams()
    const [passwordShowStatus, setPasswordShowStatus] = useState<boolean>(false)

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            password: "",
            confirm_password: ""
        },
		validationSchema,
        onSubmit: async (values) => {
            try {
				const response = await ApiService.fetchData({url: `/api/activar-cuenta/${token}/`, method: 'post', headers: {'Content-Type': 'application/json'}, data: JSON.stringify({password: values.password})})
				if (response.data) {
					toast.success("Invitacion Aceptada", {autoClose: 1000})
					
				}
			} catch (error: any) {
				toast.error(error.response.data.detail)
			}
        }
    })

    return (
        <PageWrapper isProtectedRoute={false} title="Aceptar Invitacion a Empresa">
            <div className='container mx-auto flex h-full items-center justify-center'>
				<div className='flex max-w-sm flex-col gap-8'>
					<div>
						<LogoTemplate className='h-12' />
					</div>
					<div>
						<span className='text-4xl font-semibold'>¿Acepta la Invitación?</span>
					</div>
					<div className='flex flex-col gap-4'>
						<div className={classNames({ 'mb-2': !formik.isValid, })}>
							<Validation
								isValid={formik.isValid}
								isTouched={formik.touched.password}
								invalidFeedback={formik.errors.password}>
                                    <FieldWrap
                                        firstSuffix={<Icon icon='HeroKey' className='mx-2' />}
                                        lastSuffix={
                                            <Icon
                                                className='mx-2 cursor-pointer'
                                                icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'}
                                                onClick={() => {
                                                    setPasswordShowStatus(!passwordShowStatus);
                                                }}
                                            />
                                        }>
                                        <Input
                                            dimension='lg'
                                            type={passwordShowStatus ? 'text' : 'password'}
                                            id='password'
                                            name='password'
                                            placeholder='Contraseña'
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                        />
                                    </FieldWrap>
							</Validation>
						</div>
						<div className={classNames({ 'mb-2': !formik.isValid, })}>
							<Validation
								isValid={formik.isValid}
								isTouched={formik.touched.confirm_password}
								invalidFeedback={formik.errors.confirm_password}>
								<FieldWrap
									firstSuffix={<Icon icon='HeroKey' className='mx-2' />}
									lastSuffix={
										<Icon
											className='mx-2 cursor-pointer'
											icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'}
											onClick={() => {
												setPasswordShowStatus(!passwordShowStatus);
											}}
										/>
									}>
									<Input
										dimension='lg'
										type={passwordShowStatus ? 'text' : 'password'}
										id='confirm_password'
										name='confirm_password'
										placeholder='Confirmar Contraseña'
										value={formik.values.confirm_password}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
								</FieldWrap>
							</Validation>
						</div>
						<div>
							<Button
								size='lg'
								variant='solid'
								className='w-full font-semibold'
								onClick={() => formik.handleSubmit()}>
								Iniciar
							</Button>
						</div>
					</div>
				</div>
			</div>
        </PageWrapper>
    )
}

export default AceptarInvitacionEmpresa