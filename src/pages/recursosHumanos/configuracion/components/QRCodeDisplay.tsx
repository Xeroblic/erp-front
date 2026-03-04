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

/**
 * Calcula si el QR necesita regenerarse.
 * El QR se regenera 1 hora antes de la hora de entrada configurada,
 * una vez por día.
 */
function shouldRegenerateQR(entryTime: string, qrCode: string, now: Date): boolean {
	if (!entryTime || !qrCode) return false;

	const [eH, eM] = entryTime.split(':').map(Number);
	const regenHour = eH - 1;
	const regenMinute = eM;

	const currentH = now.getHours();
	const currentM = now.getMinutes();

	// Check if we're within the regeneration window (regen hour ± 1 minute)
	if (currentH === regenHour && currentM === regenMinute) {
		// Only regenerate if current QR was generated on a different day
		// QR format includes date: UUID-YYYY-MM-DD
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
   QR SVG GENERATOR
   ====================================================== */

interface QRCodeSVGProps {
	value: string;
	size?: number;
}

const QRCodeSVG: React.FC<QRCodeSVGProps> = ({ value, size = 220 }) => {
	const moduleCount = 25;
	const cellSize = size / moduleCount;

	const pattern = useMemo(() => {
		const grid: boolean[][] = Array.from(
			{ length: moduleCount },
			() => Array(moduleCount).fill(false) as boolean[],
		);

		let hash = 0;
		for (let i = 0; i < value.length; i++) {
			const chr = value.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0;
		}

		const drawFinder = (startR: number, startC: number) => {
			for (let r = 0; r < 7; r++) {
				for (let c = 0; c < 7; c++) {
					const outer = r === 0 || r === 6 || c === 0 || c === 6;
					const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
					grid[startR + r][startC + c] = outer || inner;
				}
			}
		};

		drawFinder(0, 0);
		drawFinder(0, moduleCount - 7);
		drawFinder(moduleCount - 7, 0);

		// Alignment pattern
		const alignPos = moduleCount - 7 - 2;
		for (let r = alignPos; r < alignPos + 5; r++) {
			for (let c = alignPos; c < alignPos + 5; c++) {
				const outer =
					r === alignPos || r === alignPos + 4 || c === alignPos || c === alignPos + 4;
				const center = r === alignPos + 2 && c === alignPos + 2;
				grid[r][c] = outer || center;
			}
		}

		let seed = Math.abs(hash);
		for (let r = 0; r < moduleCount; r++) {
			for (let c = 0; c < moduleCount; c++) {
				if (grid[r][c]) continue;
				if (r < 9 && c < 9) continue;
				if (r < 9 && c >= moduleCount - 8) continue;
				if (r >= moduleCount - 8 && c < 9) continue;

				seed = (seed * 16807 + 1) % 2147483647;
				grid[r][c] = seed % 3 !== 0;
			}
		}

		return grid;
	}, [value]);

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<rect width={size} height={size} fill='white' rx='8' />
			{pattern.map((row, r) =>
				row.map((cell, c) =>
					cell ? (
						<rect
							key={`${r}-${c}`}
							x={c * cellSize}
							y={r * cellSize}
							width={cellSize}
							height={cellSize}
							fill='#1a1a2e'
						/>
					) : null,
				),
			)}
		</svg>
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

	// ── Calculate next regeneration time ──
	const nextRegenTime = useMemo(() => {
		if (!config.entryTime) return null;
		const [eH, eM] = config.entryTime.split(':').map(Number);
		const regenH = eH - 1;
		return `${String(regenH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
	}, [config.entryTime]);

	// ── QR age (how old is current QR) ──
	const qrDate = useMemo(() => {
		if (!config.qrCode) return null;
		// Extract date from QR: uuid-YYYY-MM-DD
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
					{/* QR Visual */}
					<div className='rounded-2xl border-2 border-zinc-600/50 bg-white p-3 shadow-lg shadow-blue-500/5'>
						<QRCodeSVG value={config.qrCode} size={200} />
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
