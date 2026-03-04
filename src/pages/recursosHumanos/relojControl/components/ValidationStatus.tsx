// src/pages/recursosHumanos/relojControl/components/ValidationStatus.tsx
import React from 'react';
import Icon from '@/components/icon/Icon';
import type { IRHValidationResult } from '@/interface/rh.interface';

interface ValidationStatusProps {
	validations: IRHValidationResult | null;
	isValidating: boolean;
}

interface StatusItemProps {
	label: string;
	passed: boolean | null;
	message: string;
	isLoading?: boolean;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, passed, message, isLoading }) => {
	const getColor = () => {
		if (isLoading) return 'text-amber-400';
		if (passed === null) return 'text-zinc-500';
		return passed ? 'text-emerald-400' : 'text-red-400';
	};

	const getIcon = () => {
		if (isLoading) return 'HeroArrowPath';
		if (passed === null) return 'HeroMinusCircle';
		return passed ? 'HeroCheckCircle' : 'HeroXCircle';
	};

	const getBg = () => {
		if (isLoading) return 'bg-amber-500/10 border-amber-500/20';
		if (passed === null) return 'bg-zinc-800/50 border-zinc-700';
		return passed
			? 'bg-emerald-500/10 border-emerald-500/20'
			: 'bg-red-500/10 border-red-500/20';
	};

	return (
		<div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${getBg()}`}>
			<Icon
				icon={getIcon()}
				size='text-xl'
				className={`${getColor()} ${isLoading ? 'animate-spin' : ''}`}
			/>
			<div className='flex-1'>
				<p className='text-sm font-medium text-zinc-200'>{label}</p>
				<p className={`text-xs ${getColor()}`}>{message}</p>
			</div>
		</div>
	);
};

const ValidationStatus: React.FC<ValidationStatusProps> = ({ validations, isValidating }) => {
	if (!validations && !isValidating) return null;

	return (
		<div className='flex flex-col gap-2'>
			<h3 className='mb-1 text-sm font-semibold text-zinc-300'>Estado de Validaciones</h3>

			{/* Geolocalización */}
			<StatusItem
				label='Ubicación'
				passed={validations?.geolocation?.passed ?? null}
				message={
					isValidating && !validations?.geolocation
						? 'Obteniendo ubicación...'
						: (validations?.geolocation?.message ?? 'Pendiente')
				}
				isLoading={isValidating && !validations?.geolocation}
			/>

			{/* Red */}
			<StatusItem
				label='Red'
				passed={validations?.network?.passed ?? null}
				message={
					isValidating && !validations?.network
						? 'Validando red...'
						: (validations?.network?.message ?? 'Pendiente')
				}
				isLoading={isValidating && !validations?.network}
			/>

			{/* Horario */}
			<StatusItem
				label='Horario'
				passed={validations?.schedule?.passed ?? null}
				message={
					validations?.schedule?.reason ||
					(validations?.schedule?.passed ? 'Dentro del horario' : 'Pendiente')
				}
			/>

			{/* QR */}
			{validations?.qr && (
				<StatusItem
					label='Código QR'
					passed={validations.qr.passed}
					message={validations.qr.message}
				/>
			)}
		</div>
	);
};

export default ValidationStatus;
