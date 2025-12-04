import { MovementType } from '@/interface/inventory.interface';

export type NormalizedMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST' | 'RETURN' | 'OTHER';

export const normalizeMovementType = (type?: MovementType): NormalizedMovementType => {
	if (!type) return 'OTHER';
	if (type.startsWith('ADJUST')) return 'ADJUST';
	if (type.includes('TRANSFER')) return 'TRANSFER';
	if (type === 'RETURN') return 'RETURN';
	if (type === 'IN' || type === 'PRODUCE' || type === 'PRODUCTION') return 'IN';
	if (type === 'OUT' || type === 'CONSUME' || type === 'RESERVE' || type === 'RELEASE') {
		return 'OUT';
	}
	return 'OTHER';
};

export const getMovementTypeMeta = (type?: MovementType) => {
	const normalized = normalizeMovementType(type);

	const meta = {
		IN: { color: 'emerald', text: 'Entrada', icon: 'HeroArrowUp' },
		OUT: { color: 'red', text: 'Salida', icon: 'HeroArrowDown' },
		TRANSFER: { color: 'sky', text: 'Transferencia', icon: 'HeroArrowsRightLeft' },
		ADJUST: { color: 'amber', text: 'Ajuste', icon: 'HeroCog6Tooth' },
		RETURN: { color: 'violet', text: 'Retorno', icon: 'HeroArrowUturnLeft' },
		OTHER: { color: 'gray', text: 'Movimiento', icon: 'HeroQuestionMarkCircle' },
	} as const;

	return { ...meta[normalized], normalized };
};
