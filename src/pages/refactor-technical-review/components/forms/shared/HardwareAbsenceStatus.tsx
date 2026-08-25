import React from 'react';

interface HardwareAbsenceStatusProps {
	hasNoRam: boolean;
	hasNoStorage: boolean;
}

const HardwareAbsenceStatus: React.FC<HardwareAbsenceStatusProps> = ({
	hasNoRam,
	hasNoStorage,
}) => (
	<>
		{hasNoRam && <p className='text-sm font-medium'>RAM: No tiene</p>}
		{hasNoStorage && <p className='text-sm font-medium'>Almacenamiento: No tiene</p>}
	</>
);

export default HardwareAbsenceStatus;
