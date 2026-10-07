import React, { FC } from 'react';
import classNames from 'classnames';
import ProtectedButton from '@/components/ui/ProtectedButton';
import type { TColors } from '@/types/colors.type';
import type { TIcons } from '@/types/icons.type';
import type { AuthorizationScopeMode } from '@/types/authorization';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';

/**
 * `allowed_actions` decide qué se **ofrece**; el guard decide qué se **permite**.
 * La lista puede venir cacheada u obsoleta, así que cada botón sigue pasando por
 * `ProtectedButton` con su permiso y su contexto de sucursal.
 */

export interface IAllowedActionDefinition {
	label: string;
	icon: TIcons;
	/**
	 * Permisos funcionales del contrato (sección 15) que exige el endpoint. Es
	 * un array porque algunas acciones cruzan dos entidades y necesitan el
	 * permiso de ambas: se exigen **todos**, nunca cualquiera.
	 */
	permissions: string[];
	color: TColors;
	/** Acciones destructivas o irreversibles piden confirmación en la card. */
	isDestructive?: boolean;
}

export type TProcurementResource = 'supplier' | 'purchase_document' | 'stock_receipt';

/**
 * Por recurso y no global: el mismo nombre de acción exige permisos distintos
 * según el recurso (`update` pide `edit-procurement-supplier`,
 * `edit-purchase-document` o `edit-product`).
 */
export const PROCUREMENT_ACTION_DEFINITIONS: Record<
	TProcurementResource,
	Partial<Record<TProcurementAllowedAction, IAllowedActionDefinition>>
> = {
	supplier: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permissions: ['edit-procurement-supplier'],
			color: 'zinc',
		},
		deactivate: {
			label: 'Desactivar',
			icon: 'HeroNoSymbol',
			permissions: ['delete-procurement-supplier'],
			color: 'amber',
			isDestructive: true,
		},
		restore: {
			label: 'Restaurar',
			icon: 'HeroArrowPathRoundedSquare',
			permissions: ['restore-procurement-supplier'],
			color: 'blue',
		},
	},
	purchase_document: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permissions: ['edit-purchase-document'],
			color: 'zinc',
		},
		confirm: {
			label: 'Confirmar',
			icon: 'HeroCheckCircle',
			permissions: ['confirm-purchase-document'],
			color: 'emerald',
		},
		cancel: {
			label: 'Anular',
			icon: 'HeroXCircle',
			permissions: ['cancel-purchase-document'],
			color: 'red',
			isDestructive: true,
		},
		// Crear la recepción es una escritura de inventario: el contrato la enlaza
		// a `edit-product`, no al permiso del documento desde el que se lanza.
		create_receipt: {
			label: 'Crear recepción',
			icon: 'HeroInboxArrowDown',
			permissions: ['edit-product'],
			color: 'blue',
		},
		add_attachment: {
			label: 'Adjuntar',
			icon: 'HeroPaperClip',
			permissions: ['edit-purchase-document'],
			color: 'zinc',
		},
	},
	stock_receipt: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permissions: ['edit-product'],
			color: 'zinc',
		},
		post: {
			label: 'Ingresar al stock',
			icon: 'HeroArrowDownTray',
			permissions: ['edit-product'],
			color: 'emerald',
		},
		retry: {
			label: 'Reintentar',
			icon: 'HeroArrowPath',
			permissions: ['edit-product'],
			color: 'blue',
		},
		cancel: {
			label: 'Anular',
			icon: 'HeroXCircle',
			permissions: ['edit-product'],
			color: 'red',
			isDestructive: true,
		},
		reverse: {
			label: 'Revertir',
			icon: 'HeroArrowUturnLeft',
			permissions: ['edit-product'],
			color: 'red',
			isDestructive: true,
		},
		// Ambos permisos se exigen acá y no en cada pantalla, para que ninguna
		// olvide el segundo guard.
		link_purchase_document: {
			label: 'Vincular documento',
			icon: 'HeroLink',
			permissions: ['edit-product', 'view-purchase-document'],
			color: 'blue',
		},
	},
};

export interface IAllowedActionsToolbarProps {
	/** `allowed_actions` tal como llega del contrato. Siempre array. */
	allowedActions: TProcurementAllowedAction[];
	/** Recurso del que vienen esas acciones: fija el permiso de cada botón. */
	resource: TProcurementResource;
	onAction: (action: TProcurementAllowedAction) => void;
	/** Contexto geográfico para el guard. Sale de `useCurrentBranch`. */
	branchId?: number | null;
	subsidiaryId?: number | null;
	/** Acciones de escritura usan `access`, el criterio de CLAUDE.md §5. */
	scope?: AuthorizationScopeMode;
	/** Acciones en curso: deshabilita el botón sin sacarlo de la botonera. */
	pendingAction?: TProcurementAllowedAction | null;
	/** Deshabilita toda la botonera (recepción en `queued`, por ejemplo). */
	disabled?: boolean;
	size?: 'sm' | 'default';
	className?: string;
	/** Texto del estado vacío. `null` no renderiza nada. */
	emptyLabel?: string | null;
}

const AllowedActionsToolbar: FC<IAllowedActionsToolbarProps> = ({
	allowedActions,
	resource,
	onAction,
	branchId = null,
	subsidiaryId = null,
	scope = 'access',
	pendingAction = null,
	disabled = false,
	size = 'sm',
	className,
	emptyLabel = 'Sin acciones disponibles',
}) => {
	// Una acción desconocida o ajena al recurso no puede pintarse con un permiso
	// adivinado: se omite, y si no queda ninguna rige el estado vacío.
	const offeredActions = allowedActions.flatMap((action) => {
		const definition = PROCUREMENT_ACTION_DEFINITIONS[resource][action];

		return definition === undefined ? [] : [{ action, definition }];
	});

	if (offeredActions.length === 0) {
		// Sin acciones se dice, en vez de dejar un hueco que parezca error de carga.
		return emptyLabel === null ? null : (
			<p
				data-component-name='Procurement/AllowedActionsToolbar'
				className={classNames(
					'text-xs italic text-zinc-500 dark:text-zinc-400',
					className,
				)}>
				{emptyLabel}
			</p>
		);
	}

	return (
		<div
			data-component-name='Procurement/AllowedActionsToolbar'
			className={classNames('flex flex-wrap items-center gap-2', className)}>
			{offeredActions.map(({ action, definition }) => (
				<ProtectedButton
					key={action}
					permissions={definition.permissions}
					requireAll
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope={scope}
					fallbackMode='disabled'
					disabledTooltip={`No tienes autorización para ${definition.label.toLocaleLowerCase('es-CL')}`}
					variant={definition.isDestructive ? 'outline' : 'solid'}
					color={definition.color}
					icon={definition.icon}
					size={size}
					isDisable={disabled || pendingAction !== null}
					isLoading={pendingAction === action}
					onClick={() => onAction(action)}>
					{definition.label}
				</ProtectedButton>
			))}
		</div>
	);
};

export default AllowedActionsToolbar;
