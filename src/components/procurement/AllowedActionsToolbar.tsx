import React, { FC } from 'react';
import classNames from 'classnames';
import ProtectedButton from '@/components/ui/ProtectedButton';
import type { TColors } from '@/types/colors.type';
import type { TIcons } from '@/types/icons.type';
import type { AuthorizationScopeMode } from '@/types/authorization';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';

/**
 * Botonera derivada de `allowed_actions`.
 *
 * El backend decide qué acciones ofrece según **estado y autorización**, y la
 * lista siempre llega como array. Pero el contrato es explícito en que
 * `allowed_actions` **no sustituye la autorización**: cada botón sigue pasando
 * por `ProtectedButton` con su permiso y su contexto de sucursal, porque la
 * lista puede venir de una respuesta cacheada, de otro contexto o simplemente
 * quedar obsoleta entre la carga y el clic.
 *
 * Dicho al revés: `allowed_actions` decide qué se **ofrece**; el guard decide qué
 * se **permite**. Ambos, no uno.
 */

export interface IAllowedActionDefinition {
	label: string;
	icon: TIcons;
	/** Permiso funcional del contrato (sección 15) que exige el endpoint. */
	permission: string;
	color: TColors;
	/** Acciones destructivas o irreversibles piden confirmación en la card. */
	isDestructive?: boolean;
}

/** Recurso al que pertenece la botonera. Determina permiso y etiqueta. */
export type TProcurementResource = 'supplier' | 'purchase_document' | 'stock_receipt';

/**
 * Catálogo de acciones **por recurso**, no global: el mismo nombre de acción
 * exige permisos distintos según de qué recurso venga. `update` sobre un
 * proveedor pide `edit-procurement-supplier`, sobre un documento
 * `edit-purchase-document` y sobre una recepción `edit-product` (sección 15 del
 * contrato). Un registro único por nombre de acción le daría a la recepción el
 * permiso del documento y dejaría el botón visible para quien no puede usarlo.
 *
 * Un recurso solo declara las acciones que su sección del contrato le atribuye:
 * lo que no está acá es que el backend no lo ofrece para ese recurso.
 */
export const PROCUREMENT_ACTION_DEFINITIONS: Record<
	TProcurementResource,
	Partial<Record<TProcurementAllowedAction, IAllowedActionDefinition>>
> = {
	supplier: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permission: 'edit-procurement-supplier',
			color: 'zinc',
		},
		deactivate: {
			label: 'Desactivar',
			icon: 'HeroNoSymbol',
			permission: 'delete-procurement-supplier',
			color: 'amber',
			isDestructive: true,
		},
		restore: {
			label: 'Restaurar',
			icon: 'HeroArrowPathRoundedSquare',
			permission: 'restore-procurement-supplier',
			color: 'blue',
		},
	},
	purchase_document: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permission: 'edit-purchase-document',
			color: 'zinc',
		},
		confirm: {
			label: 'Confirmar',
			icon: 'HeroCheckCircle',
			permission: 'confirm-purchase-document',
			color: 'emerald',
		},
		cancel: {
			label: 'Anular',
			icon: 'HeroXCircle',
			permission: 'cancel-purchase-document',
			color: 'red',
			isDestructive: true,
		},
		// Crear la recepción es una escritura de inventario: el contrato la enlaza
		// a `edit-product`, no al permiso del documento desde el que se lanza.
		create_receipt: {
			label: 'Crear recepción',
			icon: 'HeroInboxArrowDown',
			permission: 'edit-product',
			color: 'blue',
		},
		add_attachment: {
			label: 'Adjuntar',
			icon: 'HeroPaperClip',
			permission: 'edit-purchase-document',
			color: 'zinc',
		},
	},
	stock_receipt: {
		update: {
			label: 'Editar',
			icon: 'HeroPencilSquare',
			permission: 'edit-product',
			color: 'zinc',
		},
		post: {
			label: 'Contabilizar',
			icon: 'HeroPaperAirplane',
			permission: 'edit-product',
			color: 'emerald',
		},
		retry: {
			label: 'Reintentar',
			icon: 'HeroArrowPath',
			permission: 'edit-product',
			color: 'blue',
		},
		cancel: {
			label: 'Anular',
			icon: 'HeroXCircle',
			permission: 'edit-product',
			color: 'red',
			isDestructive: true,
		},
		reverse: {
			label: 'Revertir',
			icon: 'HeroArrowUturnLeft',
			permission: 'edit-product',
			color: 'red',
			isDestructive: true,
		},
		// Vincular exige el contexto de ambas entidades: `edit-product` sobre el
		// stock y `view-purchase-document` sobre el documento que se asocia.
		link_purchase_document: {
			label: 'Vincular documento',
			icon: 'HeroLink',
			permission: 'edit-product',
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
	if (allowedActions.length === 0) {
		// Colección vacía es `[]`, no ausencia: el estado sin acciones se dice,
		// no se deja como un hueco que parezca un error de carga.
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
			{allowedActions.map((action) => {
				const definition = PROCUREMENT_ACTION_DEFINITIONS[resource][action];

				// Una acción que el backend agregue, o que no corresponda a este
				// recurso, no puede pintarse con un permiso adivinado: se omite.
				if (definition === undefined) return null;

				return (
					<ProtectedButton
						key={action}
						permission={definition.permission}
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
				);
			})}
		</div>
	);
};

export default AllowedActionsToolbar;
