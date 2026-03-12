import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomerDetailThunk,
	updateCustomerThunk,
} from '@/store/slices/customerSales/customerSalesSlice';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import { ClientesVentasDetalleSchema, IClientesVentasDetalleForm } from '../types';

export const useClientesVentasDetalle = () => {
	const { clienteId } = useParams();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { detalle, loading } = useAppSelector((s) => s.customerSales);
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [isEditable, setIsEditable] = useState(false);

	useEffect(() => {
		if (clienteId) {
			dispatch(
				fetchCustomerDetailThunk({
					subsidiary: effectiveSubsidiaryId ?? 1,
					id: clienteId,
				} as any),
			);
		}
	}, [clienteId, dispatch, effectiveSubsidiaryId]);

	const contacto = useMemo(
		() => ({
			name: detalle?.contact_name || detalle?.primary_contact?.name || '',
			email: detalle?.email || detalle?.primary_contact?.email || '',
			phone: detalle?.phone || detalle?.primary_contact?.phone || '',
		}),
		[detalle],
	);

	const initialFormValues: IClientesVentasDetalleForm = useMemo(
		() => ({
			document_number: detalle?.document_number || detalle?.rut || '',
			billing_company: detalle?.billing_company || '',
			contact_name: contacto.name || '',
			email: contacto.email || '',
			trade_activity: detalle?.trade_activity || '',
			phone: contacto.phone || '',
			is_active: detalle?.is_active ?? true,
			preferred_payment_method: detalle?.preferred_payment_method || '',
			default_document_type: detalle?.default_document_type || '',
			billing_address_1: detalle?.billing_address_1 || '',
			billing_city: detalle?.billing_city || '',
			billing_postcode: detalle?.billing_postcode || '',
			shipping_address_1: detalle?.shipping_address_1 || '',
			shipping_city: detalle?.shipping_city || '',
			notes: detalle?.notes || '',
		}),
		[detalle, contacto],
	);

	const formik = useFormik<IClientesVentasDetalleForm>({
		enableReinitialize: true,
		initialValues: initialFormValues,
		validationSchema: ClientesVentasDetalleSchema,
		onSubmit: async (values, { setSubmitting }) => {
			if (!detalle) return;
			try {
				const payload = {
					...values,
					rut: values.document_number,
					document_number: values.document_number,
					contact_name: values.contact_name,
					email: values.email,
					phone: values.phone,
					primary_contact: {
						name: values.contact_name || '',
						email: values.email || '',
						phone: values.phone || '',
					},
					primary_contact_name: values.contact_name,
					primary_contact_email: values.email,
					primary_contact_phone: values.phone,
				};

				await dispatch(
					updateCustomerThunk({
						subsidiary: effectiveSubsidiaryId ?? 1,
						id: detalle.id,
						payload,
					}) as any,
				).unwrap();

				// Re-fetch only the detail to ensure we have the latest server state
				await dispatch(
					fetchCustomerDetailThunk({
						subsidiary: effectiveSubsidiaryId ?? 1,
						id: detalle.id,
					} as any),
				);

				toast.success('Cliente actualizado correctamente');
				setIsEditable(false);
			} catch (error) {
				console.error(error);
				toast.error('No se pudo actualizar el cliente');
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleCancelEdit = () => {
		formik.resetForm();
		setIsEditable(false);
	};

	const handleBack = () => navigate('/comercial/clientes-ventas');

	return {
		formik,
		detalle,
		loading,
		isEditable,
		setIsEditable,
		handleCancelEdit,
		handleBack,
		contacto,
	};
};
