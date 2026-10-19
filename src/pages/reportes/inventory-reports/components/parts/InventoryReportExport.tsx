import React from 'react';
import ProtectedButton from '@/components/ui/ProtectedButton';
import type { ReportFormat } from '@/interface/reports.interface';
import type { TIcons } from '@/types/icons.type';

interface IInventoryReportExportProps {
	subsidiaryId: number;
	exporting: ReportFormat | null;
	/** Sin reporte cargado no hay nada que exportar. */
	disabled: boolean;
	onExport: (format: ReportFormat) => void;
}

const FORMATS: { format: ReportFormat; label: string; icon: TIcons }[] = [
	{ format: 'pdf', label: 'PDF', icon: 'HeroDocumentText' },
	{ format: 'xlsx', label: 'Excel', icon: 'HeroTableCells' },
];

/**
 * Exporta el reporte activo con los filtros de la tabla. `GET …/export`
 * exige `export-reports` además de ver la filial: sin ese permiso los botones
 * no se muestran.
 */
const InventoryReportExport: React.FC<IInventoryReportExportProps> = ({
	subsidiaryId,
	exporting,
	disabled,
	onExport,
}) => (
	<div className='flex items-center gap-2'>
		{FORMATS.map(({ format, label, icon }) => (
			<ProtectedButton
				key={format}
				permission='export-reports'
				subsidiaryId={subsidiaryId}
				scope='visible'
				variant='outline'
				icon={icon}
				isLoading={exporting === format}
				isDisable={disabled || exporting !== null}
				aria-label={`Exportar reporte en ${label}`}
				onClick={() => onExport(format)}>
				{label}
			</ProtectedButton>
		))}
	</div>
);

export default InventoryReportExport;
