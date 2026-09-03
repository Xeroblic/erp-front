import React, { forwardRef, useId } from 'react';
import type { AuthorizationScopeMode } from '@/types/authorization';
import Button, { IButtonProps } from './Button';
import PermissionGuard from '../authorization/PermissionGuard';
import Tooltip from './Tooltip';

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
	const disabledTooltipId = useId();

	if (
		!permission &&
		(!permissions || permissions.length === 0) &&
		(!roles || roles.length === 0)
	) {
		return <Button ref={ref} {...buttonProps} />;
	}

	const combinedPermission = permission ?? permissions;
	const fallbackExplanation =
		disabledTooltip ?? buttonProps.title ?? 'No tienes autorización para realizar esta acción';
	const disabledButton = (
		<Button ref={ref} {...buttonProps} isDisable title={fallbackExplanation} />
	);
	let fallback: React.ReactNode = null;

	/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Trigger enfocable para explicar un botón nativamente deshabilitado. */
	if (fallbackMode === 'disabled') {
		fallback = (
			<Tooltip id={disabledTooltipId} text={fallbackExplanation}>
				<span
					tabIndex={0}
					className='inline-flex !cursor-not-allowed'
					aria-describedby={disabledTooltipId}>
					{disabledButton}
				</span>
			</Tooltip>
		);
	}
	/* eslint-enable jsx-a11y/no-noninteractive-tabindex */

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
