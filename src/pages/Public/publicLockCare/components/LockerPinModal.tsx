import React, { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

interface ILockerPinModalProps {
	isOpen: boolean;
	pin: string | null;
	lockerNumber: string;
	onClose: () => void;
}

/**
 * Modal premium que muestra el PIN de acceso al casillero
 * después de un check-in exitoso. El usuario puede copiar el PIN
 * y tiene instrucciones claras de cómo usarlo.
 */
const LockerPinModal: React.FC<ILockerPinModalProps> = ({ isOpen, pin, lockerNumber, onClose }) => {
	const [copied, setCopied] = useState(false);

	// Resetear estado de copiado al abrir
	useEffect(() => {
		if (isOpen) setCopied(false);
	}, [isOpen]);

	const handleCopyPin = useCallback(async () => {
		if (!pin) return;
		try {
			await navigator.clipboard.writeText(pin);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			// Fallback para navegadores sin clipboard API
			const textarea = document.createElement('textarea');
			textarea.value = pin;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		}
	}, [pin]);

	if (!isOpen) return null;

	const displayPin = pin || '----';
	const hasPIN = !!pin;

	return (
		<div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
			{/* Overlay oscuro con blur */}
			<div
				className='absolute inset-0 bg-black/60 backdrop-blur-sm'
				onClick={onClose}
				aria-hidden='true'
			/>

			{/* Contenedor del Modal */}
			<div
				className='relative z-10 w-full max-w-md animate-[modalEnter_0.35s_ease-out] overflow-hidden rounded-3xl bg-white shadow-2xl'
				role='dialog'
				aria-modal='true'
				aria-label='PIN de acceso al casillero'>
				{/* Header con gradiente */}
				<div className='relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 pb-8 pt-6'>
					{/* Decoraciones de fondo */}
					<div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10' />
					<div className='absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10' />
					<div className='absolute bottom-2 right-12 h-8 w-8 rounded-full bg-white/15' />

					{/* Botón cerrar */}
					<button
						type='button'
						onClick={onClose}
						className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 transition-all hover:bg-white/30 hover:text-white'
						aria-label='Cerrar modal'>
						<Icon icon='HeroXMark' className='h-5 w-5' />
					</button>

					{/* Ícono y título */}
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner'>
							<Icon icon='HeroCheckCircle' className='h-7 w-7 text-white' />
						</div>
						<div>
							<p className='text-xs font-semibold uppercase tracking-wider text-emerald-100'>
								Registro Completado
							</p>
							<h2 className='text-xl font-bold text-white'>
								Casillero Nº {lockerNumber}
							</h2>
						</div>
					</div>
				</div>

				{/* Cuerpo del modal */}
				<div className='px-6 pb-6 pt-5'>
					{/* Bloque del PIN */}
					<div className='mb-5 rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 text-center'>
						<p className='mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500'>
							Tu PIN de Acceso
						</p>
						<div className='flex items-center justify-center gap-3'>
							<span className='font-mono text-5xl font-black tracking-[0.3em] text-emerald-700'>
								{displayPin}
							</span>
						</div>

						{hasPIN && (
							<button
								type='button'
								onClick={handleCopyPin}
								className='mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-200 active:scale-95'>
								<Icon
									icon={copied ? 'HeroCheckCircle' : 'HeroClipboardDocument'}
									className='h-4 w-4'
								/>
								{copied ? '¡Copiado!' : 'Copiar PIN'}
							</button>
						)}
					</div>

					{/* Advertencia del PIN o aviso de PIN pendiente */}
					{hasPIN ? (
						<div className='mb-5 flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-200'>
							<div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-4 w-4 text-amber-600'
								/>
							</div>
							<div>
								<p className='text-sm font-semibold text-amber-800'>
									¡Guarda este PIN!
								</p>
								<p className='mt-0.5 text-xs leading-relaxed text-amber-700'>
									Lo necesitarás para abrir el casillero. No lo compartas con
									nadie y tenlo siempre a mano.
								</p>
							</div>
						</div>
					) : (
						<div className='mb-5 flex items-start gap-3 rounded-xl bg-blue-50 p-3.5 ring-1 ring-blue-200'>
							<div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100'>
								<Icon
									icon='HeroInformationCircle'
									className='h-4 w-4 text-blue-600'
								/>
							</div>
							<div>
								<p className='text-sm font-semibold text-blue-800'>PIN pendiente</p>
								<p className='mt-0.5 text-xs leading-relaxed text-blue-700'>
									El PIN de acceso será enviado a tu correo electrónico. Revisa tu
									bandeja de entrada en los próximos minutos.
								</p>
							</div>
						</div>
					)}

					{/* Pasos rápidos */}
					<div className='space-y-3'>
						<p className='text-xs font-semibold uppercase tracking-wider text-zinc-400'>
							¿Qué hacer ahora?
						</p>

						<div className='flex items-start gap-3'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
								<Icon icon='HeroMapPin' className='h-4 w-4' />
							</div>
							<div>
								<p className='text-sm font-semibold text-zinc-800'>
									1. Ubica el Casillero Nº {lockerNumber}
								</p>
								<p className='text-xs text-zinc-500'>
									Es el que acabas de escanear.
								</p>
							</div>
						</div>

						<div className='flex items-start gap-3'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600'>
								<Icon icon='HeroKey' className='h-4 w-4' />
							</div>
							<div>
								<p className='text-sm font-semibold text-zinc-800'>
									2. Digita tu PIN en el teclado
								</p>
								<p className='text-xs text-zinc-500'>
									Ingresa el código para desbloquear la puerta.
								</p>
							</div>
						</div>

						<div className='flex items-start gap-3'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600'>
								<Icon icon='HeroArchiveBoxArrowDown' className='h-4 w-4' />
							</div>
							<div>
								<p className='text-sm font-semibold text-zinc-800'>
									3. Deposita y cierra firmemente
								</p>
								<p className='text-xs text-zinc-500'>
									Coloca tu equipo y cierra hasta escuchar el clic.
								</p>
							</div>
						</div>
					</div>

					{/* Botón principal */}
					<Button
						color='emerald'
						variant='solid'
						icon='HeroCheckCircle'
						className='mt-6 w-full justify-center rounded-xl py-3 font-semibold'
						onClick={onClose}>
						Entendido, ¡voy al casillero!
					</Button>
				</div>
			</div>

			{/* Animación CSS inline para el modal */}
			<style>{`
				@keyframes modalEnter {
					0% {
						opacity: 0;
						transform: scale(0.9) translateY(20px);
					}
					100% {
						opacity: 1;
						transform: scale(1) translateY(0);
					}
				}
			`}</style>
		</div>
	);
};

export default React.memo(LockerPinModal);
