// src/pages/recursosHumanos/configuracion/components/QRCodeDisplay.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateBranchConfig } from '@/store/slices/recursosHumanos/rhSlice';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useLiveClock } from '../../hooks/useLiveClock';

/* ======================================================
   QR DINÁMICO: se regenera 1h antes de la hora de entrada
   ====================================================== */

function shouldRegenerateQR(entryTime: string, qrCode: string, now: Date): boolean {
	if (!entryTime || !qrCode) return false;

	const [eH, eM] = entryTime.split(':').map(Number);
	const regenHour = eH - 1;
	const regenMinute = eM;

	const currentH = now.getHours();
	const currentM = now.getMinutes();

	if (currentH === regenHour && currentM === regenMinute) {
		const todayStr = now.toISOString().split('T')[0];
		return !qrCode.includes(todayStr);
	}

	return false;
}

function generateDailyQR(): string {
	const todayStr = new Date().toISOString().split('T')[0];
	const uuid = crypto.randomUUID();
	return `${uuid}-${todayStr}`;
}

/* ======================================================
   QR CODE IMAGE — Usa API gratuita de qrserver.com
   para generar QR codes reales y escaneables.
   ====================================================== */

interface RealQRCodeProps {
	value: string;
	size?: number;
}

const RealQRCode: React.FC<RealQRCodeProps> = ({ value, size = 220 }) => {
	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&format=svg&margin=8`;

	return (
		<img
			src={qrUrl}
			alt='QR Code de sucursal'
			width={size}
			height={size}
			className='rounded-md'
			style={{ imageRendering: 'pixelated' }}
		/>
	);
};

/* ======================================================
   COMPONENT
   ====================================================== */

const QRCodeDisplay: React.FC = () => {
	const dispatch = useAppDispatch();
	const config = useAppSelector((s) => s.recursosHumanos.config);
	const { now } = useLiveClock();

	const hasConfig = config.branchName && config.latitude && config.longitude;

	// Auto-regenerate QR
	useEffect(() => {
		if (!hasConfig || !config.qrCode) return;
		if (shouldRegenerateQR(config.entryTime, config.qrCode, now)) {
			dispatch(updateBranchConfig({ qrCode: generateDailyQR() }));
		}
	}, [now, config.entryTime, config.qrCode, hasConfig, dispatch]);

	const handleManualRegenerate = useCallback(() => {
		dispatch(updateBranchConfig({ qrCode: generateDailyQR() }));
	}, [dispatch]);

	const nextRegenTime = useMemo(() => {
		if (!config.entryTime) return null;
		const [eH, eM] = config.entryTime.split(':').map(Number);
		const regenH = eH - 1;
		return `${String(regenH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
	}, [config.entryTime]);

	const qrDate = useMemo(() => {
		if (!config.qrCode) return null;
		const match = config.qrCode.match(/\d{4}-\d{2}-\d{2}$/);
		return match ? match[0] : null;
	}, [config.qrCode]);

	const todayStr = now.toISOString().split('T')[0];
	const isQRFresh = qrDate === todayStr;

	if (!hasConfig) {
		return (
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>
							<span className='flex items-center gap-2'>
								<Icon icon='HeroQrCode' size='text-xl' className='text-zinc-500' />
								Código QR
							</span>
						</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='py-8 text-center'>
						<Icon
							icon='HeroQrCode'
							size='text-4xl'
							className='mx-auto mb-3 text-zinc-600'
						/>
						<p className='text-sm text-zinc-500'>
							Configura la sucursal para generar el QR
						</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>
						<span className='flex items-center gap-2'>
							<Icon icon='HeroQrCode' size='text-xl' className='text-blue-400' />
							QR Dinámico
						</span>
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					{isQRFresh ? (
						<span className='flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400'>
							<Icon icon='HeroCheckCircle' size='text-xs' />
							Activo hoy
						</span>
					) : (
						<span className='flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400'>
							<Icon icon='HeroExclamationTriangle' size='text-xs' />
							Pendiente actualización
						</span>
					)}
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='flex flex-col items-center gap-4'>
					{/* QR Code real y escaneable */}
					<div className='rounded-2xl border-2 border-zinc-600/50 bg-white p-3 shadow-lg shadow-blue-500/5'>
						<RealQRCode value={config.qrCode} size={200} />
					</div>

					{/* Branch name */}
					<div className='text-center'>
						<p className='text-sm font-semibold text-zinc-200'>{config.branchName}</p>
						{qrDate && (
							<p className='mt-0.5 text-xs text-zinc-500'>Generado: {qrDate}</p>
						)}
					</div>

					{/* Auto-regen info */}
					<div className='w-full rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2'>
						<div className='flex items-center gap-2 text-xs text-blue-400'>
							<Icon icon='HeroArrowPath' size='text-sm' />
							<span>
								Se regenera automáticamente a las{' '}
								<strong>{nextRegenTime ?? '--:--'}</strong> cada día
							</span>
						</div>
					</div>

					{/* Actions */}
					<div className='flex gap-2'>
						<Button
							variant='outline'
							color='amber'
							icon='HeroArrowPath'
							size='sm'
							onClick={handleManualRegenerate}>
							Regenerar ahora
						</Button>
					</div>

					<p className='px-2 text-center text-xs text-zinc-500'>
						Imprime este QR y colócalo en la entrada de la sucursal. Cambia diariamente
						para mayor seguridad.
					</p>
				</div>
			</CardBody>
		</Card>
	);
};

export default QRCodeDisplay;
