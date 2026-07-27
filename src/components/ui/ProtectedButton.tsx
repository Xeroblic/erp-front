import React, { forwardRef } from 'react';
import Button, { IButtonProps } from './Button';
import PermissionGuard from '../authorization/PermissionGuard';
import type { AuthorizationScopeMode } from '@/types/authorization';

type TFallbackMode = 'hidden' | 'disabled';

export interface IProtectedButtonProps extends IButtonProps {
	permission?: string;
	permissions?: string[];
	requireAll?: boolean;
	roles?: string[];
	branchId?: number | null;
	subsidiaryId?: number | null;
	companyId?: number | null;
	scope?: AuthorizationScopeMode;
	fallbackMode?: TFallbackMode;
	disabledTooltip?: string;
}

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

	if (
		!permission &&
		(!permissions || permissions.length === 0) &&
		(!roles || roles.length === 0)
	) {
		return <Button ref={ref} {...buttonProps} />;
	}

	const combinedPermission = permission ?? permissions;
	const fallback =
		fallbackMode === 'disabled' ? (
			<Button
				ref={ref}
				{...buttonProps}
				isDisable
				title={disabledTooltip ?? buttonProps.title}
			/>
		) : null;

	return (
		<PermissionGuard
			permission={combinedPermission}
			role={roles}
			requireAll={requireAll}
			branchId={branchId}
			subsidiaryId={subsidiaryId}
			companyId={companyId}
			scope={scope}
			fallback={fallback}>
			<Button ref={ref} {...buttonProps} />
		</PermissionGuard>
	);
});

ProtectedButton.displayName = 'ProtectedButton';

export default ProtectedButton;
