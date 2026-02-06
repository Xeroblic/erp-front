// src/components/ui/ProtectedButton.tsx
import React, { forwardRef } from 'react';
import Button, { IButtonProps } from './Button';
import PermissionGuard from '../authorization/PermissionGuard';

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
 * Botón con protección de permisos integrada.
 *
 * @example
 * // Ocultar si no tiene permiso
 * <ProtectedButton permission="edit-sale" onClick={handleEdit}>
 *   Editar
 * </ProtectedButton>
 *
 * @example
 * // Mostrar deshabilitado con tooltip
 * <ProtectedButton
 *   permission="delete-sale"
 *   fallbackMode="disabled"
 *   disabledTooltip="Necesitas permiso de administrador"
 *   icon="HeroTrash"
 * >
 *   Eliminar
 * </ProtectedButton>
 */
const ProtectedButton = forwardRef<HTMLButtonElement, IProtectedButtonProps>((props, ref) => {
	const {
		permission,
		permissions,
		requireAll,
		roles,
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
	const combinedPermission = permission || permissions;
	const combinedRole = roles;

	return (
		<PermissionGuard
			permission={combinedPermission}
			role={combinedRole}
			requireAll={requireAll}>
			<Button ref={ref} {...buttonProps} />
		</PermissionGuard>
	);
});

ProtectedButton.displayName = 'ProtectedButton';

export default ProtectedButton;
