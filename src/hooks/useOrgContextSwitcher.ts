import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import { userMeThunk } from '@/store/slices/auth/authSlice';

/**
 * Hook único para ejecutar el cambio de contexto organizacional (empresa / subsidiaria /
 * sucursal). Centraliza lo que antes estaba disperso y con bugs en
 * `useCompanyManager.switchCompany`:
 *  - resuelve el `company_id` REAL (antes estaba hardcodeado en `1`), y
 *  - emite un evento con semántica correcta (la subsidiaria NO se mete dentro de `branchId`).
 */

/** Detalle del evento unificado de cambio de contexto. */
export interface OrgContextChangeDetail {
	companyId: number | null;
	subsidiaryId: number | null;
	branchId: number | null;
}

/** Evento nuevo, bien tipado. Se mantiene `user-branch-changed` por compatibilidad. */
export const ORG_CONTEXT_CHANGED_EVENT = 'org-context-changed';
export const LEGACY_BRANCH_CHANGED_EVENT = 'user-branch-changed';

export interface SwitchContextArgs {
	/** Valor a guardar en `personalization.sucursal_principal`. */
	sucursalPrincipal: number;
	/** Si se indica, se envía como `subsidiary_id` a `/user/switch-company`. */
	subsidiaryId?: number | null;
	/** `company_id` explícito; si no se pasa, se resuelve desde personalización/usuario. */
	companyId?: number | null;
	/** `branchId` real para el evento (null en un cambio de subsidiaria). */
	eventBranchId?: number | null;
	successMessage?: string;
}

export const useOrgContextSwitcher = () => {
	const dispatch = useAppDispatch();
	const companyId = useAppSelector((s) => s.auth.user?.company?.id ?? null);
	const personalizacion = useAppSelector((s) => s.personalizacion?.personalizacionUsuario);

	const [isSwitching, setIsSwitching] = useState(false);

	const switchContext = useCallback(
		async ({
			sucursalPrincipal,
			subsidiaryId = null,
			companyId: companyIdArg,
			eventBranchId = null,
			successMessage = 'Contexto actualizado',
		}: SwitchContextArgs): Promise<boolean> => {
			setIsSwitching(true);
			try {
				const resolvedCompanyId =
					companyIdArg ?? personalizacion?.company_id ?? companyId ?? null;

				// 1) switch-company: company_id REAL (ya no hardcodeado en 1).
				await ApiService.fetchData({
					url: '/user/switch-company',
					method: 'post',
					data: {
						...(resolvedCompanyId != null ? { company_id: resolvedCompanyId } : {}),
						...(subsidiaryId != null ? { subsidiary_id: subsidiaryId } : {}),
					},
				});

				// 2) personalization: sólo si cambió el sucursal_principal.
				if (personalizacion?.sucursal_principal !== sucursalPrincipal) {
					try {
						await ApiService.fetchData({
							url: '/user/personalization',
							method: 'put',
							data: {
								tema: personalizacion?.tema,
								font_size: personalizacion?.font_size,
								sucursal_principal: sucursalPrincipal,
							},
						});
					} catch (err) {
						console.warn(
							'[useOrgContextSwitcher] no se pudo actualizar la personalización:',
							err,
						);
					}
				}

				// 3) refresca el perfil (trae el nuevo contexto ya aplicado).
				await dispatch(userMeThunk()).unwrap();

				// 4) evento unificado + legacy con semántica CORRECTA (subsidiaria != branch).
				const detail: OrgContextChangeDetail = {
					companyId: resolvedCompanyId,
					subsidiaryId,
					branchId: eventBranchId,
				};
				window.dispatchEvent(new CustomEvent(ORG_CONTEXT_CHANGED_EVENT, { detail }));
				window.dispatchEvent(
					new CustomEvent(LEGACY_BRANCH_CHANGED_EVENT, {
						detail: { branchId: eventBranchId, subsidiaryId },
					}),
				);

				toast.success(successMessage);
				return true;
			} catch (error) {
				const err = error as {
					name?: string;
					response?: { data?: { message?: string } };
				};
				if (err?.name === 'AbortError' || err?.name === 'CanceledError') return false;
				toast.error(err?.response?.data?.message || 'No se pudo cambiar el contexto');
				return false;
			} finally {
				setIsSwitching(false);
			}
		},
		[dispatch, personalizacion, companyId],
	);

	return { switchContext, isSwitching };
};

export default useOrgContextSwitcher;
