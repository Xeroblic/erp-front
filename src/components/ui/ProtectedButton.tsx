// src/components/ui/ProtectedButton.tsx
import React, { forwardRef } from 'react';
import Button, { IButtonProps } from './Button';
import PermissionGuard from '../authorization/PermissionGuard';
import type { AuthorizationScopeMode } from '@/types/authorization';

type TFallbackMode = 'hidden' | 'disabled';

export interface IProtectedButtonProps extends IButtonProps {
	/** Permiso requerido para ver/usar el botón */
	permission?: string;
	/** Permisos requeridos (modo OR por defecto) */
	permissions?: string[];
	/** Si requiere todos los permisos especificados */
	requireAll?: boolean;
	/** Roles requeridos */
	roles?: string[];
	/** ID de la sucursal a validar en el scope contextual */
	branchId?: number | null;
	/** ID de la subsidiaria a validar en el scope contextual */
	subsidiaryId?: number | null;
	/** ID de la empresa a validar en el scope contextual */
	companyId?: number | null;
	/** Modo de scope: 'none', 'visible', 'access', 'both' */
	scope?: AuthorizationScopeMode;
	/**
	 * Comportamiento cuando no tiene permisos:
	 * - 'hidden' (default): No se muestra el botón
	 * - 'disabled': Se muestra deshabilitado con tooltip
	 */
	fallbackMode?: TFallbackMode;
	/** Tooltip cuando está deshabilitado por falta de permisos */
	disabledTooltip?: string;
}

/**
 * Botón con protección de permisos y scope contextual integrada.
 *
 * @example
 * // Ocultar si no tiene permiso
 * <ProtectedButton permission="edit-sale" onClick={handleEdit}>
 *   Editar
 * </ProtectedButton>
 *
 * @example
 * // Validar permiso + acceso a la sucursal actual
 * <ProtectedButton
 *   permission="create-product"
 *   branchId={currentBranchId}
 *   scope="access"
 *   fallbackMode="disabled"
 *   icon="HeroPlus"
 * >
 *   Nuevo producto
 * </ProtectedButton>
 */
const ProtectedButton = forwardRef<HTMLButtonElement, IProtectedButtonProps>((props, ref) => {
	const {
		permission,
		permissions,
		requireAll,
		roles,
		branchId,
		subsidiaryId,
		companyId,
		scope,
		fallbackMode = 'hidden',
		disabledTooltip,
		...buttonProps
	} = props;

	// Si no se especifica ningún permiso, renderizar el botón normalmente
	if (
		!permission &&
		(!permissions || permissions.length === 0) &&
		(!roles || roles.length === 0)
	) {
		return <Button ref={ref} {...buttonProps} />;
	}

	// Combinar permission y permissions en una sola prop para PermissionGuard
	const combinedPermission = permission ?? permissions;

	return (
		<PermissionGuard
			permission={combinedPermission}
			role={roles}
			requireAll={requireAll}
			branchId={branchId}
			subsidiaryId={subsidiaryId}
			companyId={companyId}
			scope={scope}>
			<Button ref={ref} {...buttonProps} />
		</PermissionGuard>
	);
});

ProtectedButton.displayName = 'ProtectedButton';

export default ProtectedButton;
