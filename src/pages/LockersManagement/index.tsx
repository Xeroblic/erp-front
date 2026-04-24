import React from 'react';
import { useLockersManagement } from './hooks/useLockersManagement';
import LockersManagementView from './LockersManagementView';

const LockersManagement: React.FC = () => {
	const hookData = useLockersManagement();

	return <LockersManagementView {...hookData} />;
};

export default LockersManagement;
