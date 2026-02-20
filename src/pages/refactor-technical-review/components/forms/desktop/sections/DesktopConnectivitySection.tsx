import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS } from '../../../constants/desktop/desktop.hints';
import { YesNoSelector } from '../../../ui/YesNoSelector';

const DesktopConnectivitySection: React.FC<FormSectionProps<DesktopFormData>> = ({
	readOnly,
	watch,
	setValue,
}) => {
	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
			{/* WiFi */}
			<div className='flex flex-col gap-2'>
				<YesNoSelector
					label={getDesktopLabel('has_wifi')}
					value={watch('has_wifi')}
					onChange={(val) => !readOnly && setValue('has_wifi', val)}
				/>
				<p className='text-center text-xs text-zinc-400'>{DESKTOP_HINTS.has_wifi}</p>
			</div>

			{/* Bluetooth */}
			<div className='flex flex-col gap-2'>
				<YesNoSelector
					label={getDesktopLabel('has_bluetooth')}
					value={watch('has_bluetooth')}
					onChange={(val) => !readOnly && setValue('has_bluetooth', val)}
				/>
				<p className='text-center text-xs text-zinc-400'>{DESKTOP_HINTS.has_bluetooth}</p>
			</div>

			{/* CD Drive */}
			<div className='flex flex-col gap-2'>
				<YesNoSelector
					label={getDesktopLabel('has_cd_drive')}
					value={watch('has_cd_drive')}
					onChange={(val) => !readOnly && setValue('has_cd_drive', val)}
				/>
				<p className='text-center text-xs text-zinc-400'>{DESKTOP_HINTS.has_cd_drive}</p>
			</div>
		</div>
	);
};

export default DesktopConnectivitySection;
