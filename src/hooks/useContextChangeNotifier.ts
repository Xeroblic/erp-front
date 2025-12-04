import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/store';

interface ContextChangeNotification {
	type: 'company' | 'subsidiary' | 'branch';
	oldValue: string | null;
	newValue: string | null;
	timestamp: number;
}

const useContextChangeNotifier = () => {
	const user = useAppSelector((state) => state.auth.user);
	const [previousContext, setPreviousContext] = useState<{
		company?: string;
		subsidiary?: string;
		branch?: string;
	}>({});

	useEffect(() => {
		if (!user) return;

		const currentContext = {
			company: user.company?.name,
			subsidiary: user.subsidiary?.name,
			branch: user.branch?.name,
		};

		// Verificar cambios de empresa
		if (previousContext.company && previousContext.company !== currentContext.company) {
			toast.info(`📋 Empresa cambiada: ${currentContext.company || 'Sin empresa'}`, {
				position: 'top-right',
				autoClose: 4000,
			});
		}

		// Verificar cambios de subsidiaria
		if (
			previousContext.subsidiary &&
			previousContext.subsidiary !== currentContext.subsidiary
		) {
			toast.info(
				`🏢 Subsidiaria cambiada: ${currentContext.subsidiary || 'Sin subsidiaria'}`,
				{
					position: 'top-right',
					autoClose: 4000,
				},
			);
		}

		// Verificar cambios de sucursal
		if (previousContext.branch && previousContext.branch !== currentContext.branch) {
			toast.info(`🏪 Sucursal cambiada: ${currentContext.branch || 'Sin sucursal'}`, {
				position: 'top-right',
				autoClose: 4000,
			});
		}

		setPreviousContext(currentContext);
	}, [user, previousContext]);

	return null; // Este hook no retorna nada, solo maneja notificaciones
};

export default useContextChangeNotifier;
