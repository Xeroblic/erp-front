// src/pages/recursosHumanos/relojControl/components/QRScanner.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface QRScannerProps {
	onScan: (code: string) => void;
	onCancel: () => void;
	isActive: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onCancel, isActive }) => {
	const scannerRef = useRef<HTMLDivElement>(null);
	const html5QrCodeRef = useRef<unknown>(null);
	const scannerRunningRef = useRef(false);
	const hasScannedRef = useRef(false);
	const [manualCode, setManualCode] = useState('');
	const [scannerAvailable, setScannerAvailable] = useState<boolean | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);

	// ── Stop scanner safely ──────────────────────────
	const stopScanner = useCallback(async () => {
		const scanner = html5QrCodeRef.current as {
			stop?: () => Promise<void>;
			clear?: () => void;
			getState?: () => number;
		} | null;

		if (!scanner) return;

		try {
			// html5-qrcode states: NOT_STARTED=1, SCANNING=2, PAUSED=3
			const state = scanner.getState?.();
			if (state === 2 || state === 3) {
				await scanner.stop?.();
			}
		} catch {
			// Ignore "not running" errors
		}

		try {
			scanner.clear?.();
		} catch {
			// Ignore clear errors
		}

		scannerRunningRef.current = false;
		html5QrCodeRef.current = null;
	}, []);

	// ── Handle successful scan ───────────────────────
	const handleScanSuccess = useCallback(
		async (decodedText: string) => {
			if (hasScannedRef.current) return; // Prevent double-scan
			hasScannedRef.current = true;

			// Stop scanner FIRST, then callback
			await stopScanner();
			onScan(decodedText);
		},
		[onScan, stopScanner],
	);

	// ── Handle cancel ────────────────────────────────
	const handleCancel = useCallback(async () => {
		await stopScanner();
		onCancel();
	}, [onCancel, stopScanner]);

	// ── Init scanner ─────────────────────────────────
	useEffect(() => {
		if (!isActive) return;

		hasScannedRef.current = false;
		let mounted = true;

		const initScanner = async () => {
			try {
				const { Html5Qrcode } = await import('html5-qrcode');
				if (!mounted || !scannerRef.current) return;

				const scannerId = 'rh-qr-reader';
				scannerRef.current.id = scannerId;

				const scanner = new Html5Qrcode(scannerId);
				html5QrCodeRef.current = scanner;

				await scanner.start(
					{ facingMode: 'environment' },
					{
						fps: 10,
						qrbox: { width: 250, height: 250 },
						aspectRatio: 1,
					},
					(decodedText: string) => {
						void handleScanSuccess(decodedText);
					},
					() => {
						// No QR found in frame — ignore
					},
				);

				if (mounted) {
					scannerRunningRef.current = true;
					setScannerAvailable(true);
				}
			} catch (err) {
				if (!mounted) return;
				setScannerAvailable(false);

				const msg = err instanceof Error ? err.message : 'Error al iniciar cámara';
				if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
					setCameraError(
						'Permiso de cámara denegado. Habilítalo en la configuración del navegador.',
					);
				} else if (msg.includes('NotFoundError') || msg.includes('device')) {
					setCameraError('No se encontró cámara en este dispositivo.');
				} else {
					setCameraError(msg);
				}
			}
		};

		initScanner();

		return () => {
			mounted = false;
			void stopScanner();
		};
	}, [isActive, handleScanSuccess, stopScanner]);

	if (!isActive) return null;

	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>
						<span className='flex items-center gap-2'>
							<Icon icon='HeroQrCode' size='text-xl' className='text-blue-400' />
							Escanear QR de Sucursal
						</span>
					</CardTitle>
				</CardHeaderChild>
				<CardHeaderChild>
					<Button variant='outline' color='zinc' size='sm' onClick={handleCancel}>
						Cancelar
					</Button>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='flex flex-col items-center gap-4'>
					<div
						ref={scannerRef}
						className='w-full max-w-sm overflow-hidden rounded-xl border-2 border-dashed border-blue-500/30'
						style={{ minHeight: scannerAvailable === false ? '0' : '300px' }}
					/>

					{scannerAvailable === null && (
						<div className='flex items-center gap-2 text-sm text-amber-400'>
							<Icon icon='HeroArrowPath' size='text-lg' className='animate-spin' />
							Iniciando cámara...
						</div>
					)}

					{scannerAvailable === false && (
						<div className='w-full max-w-sm'>
							{cameraError && (
								<div className='mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3'>
									<p className='text-sm text-amber-400'>{cameraError}</p>
								</div>
							)}
							<p className='mb-2 text-sm text-zinc-400'>
								Ingresa el código QR manualmente:
							</p>
							<div className='flex gap-2'>
								<input
									type='text'
									value={manualCode}
									onChange={(e) => setManualCode(e.target.value)}
									placeholder='Pega el código QR aquí'
									className='flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500'
								/>
								<Button
									variant='solid'
									color='blue'
									size='sm'
									onClick={() => {
										if (manualCode.trim()) {
											hasScannedRef.current = true;
											onScan(manualCode.trim());
										}
									}}
									isDisable={!manualCode.trim()}>
									Verificar
								</Button>
							</div>
						</div>
					)}

					<p className='text-center text-xs text-zinc-500'>
						Apunta la cámara al código QR ubicado en la sucursal
					</p>
				</div>
			</CardBody>
		</Card>
	);
};

export default QRScanner;
