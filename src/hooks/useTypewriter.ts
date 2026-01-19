import { useEffect, useMemo, useRef, useState } from 'react';

type TypewriterOptions = {
	typingSpeedMs?: number;
	deletingSpeedMs?: number;
	startDelayMs?: number;
	pauseAfterTypedMs?: number;
	pauseAfterDeletedMs?: number;
	loop?: boolean;
	withDelete?: boolean;
	humanize?: boolean;
};

export type TypewriterResult = {
	text: string;
	isTyping: boolean;
	isDeleting: boolean;
	isDone: boolean;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function nextDelay(char: string, base: number, humanize: boolean) {
	if (!humanize) return base;

	if (char === ' ') return base + 25;
	if (char === ',' || char === ';') return base + 140;
	if (char === '.' || char === '!' || char === '?' || char === ':') return base + 220;
	if (char === '\n') return base + 260;

	const jitter = Math.round((Math.random() - 0.5) * 18);
	return clamp(base + jitter, 10, 500);
}

export function useTypewriter(fullText: string, opts: TypewriterOptions = {}): TypewriterResult {
	const {
		typingSpeedMs = 32,
		deletingSpeedMs = 18,
		startDelayMs = 250,
		pauseAfterTypedMs = 900,
		pauseAfterDeletedMs = 250,
		loop = false,
		withDelete = false,
		humanize = true,
	} = opts;

	const [index, setIndex] = useState(0);
	const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'done'>('typing');
	const prevTextRef = useRef(fullText);

	useEffect(() => {
		let timer: number | undefined;

		// Handle reset from fullText change
		if (prevTextRef.current !== fullText) {
			prevTextRef.current = fullText;
			// Schedule reset asynchronously to avoid setState in effect
			timer = window.setTimeout(() => {
				setIndex(0);
				setPhase('typing');
			}, 0);
			return () => {
				if (timer) window.clearTimeout(timer);
			};
		}

		if (phase === 'done') return;

		const isInitial = phase === 'typing' && index === 0;

		if (phase === 'typing') {
			if (index >= fullText.length) {
				if (withDelete) {
					timer = window.setTimeout(() => setPhase('pausing'), pauseAfterTypedMs);
				} else if (loop) {
					timer = window.setTimeout(() => {
						setIndex(0);
						setPhase('typing');
					}, pauseAfterTypedMs);
				} else {
					timer = window.setTimeout(() => setPhase('done'), 0);
				}
				return () => {
					if (timer) window.clearTimeout(timer);
				};
			}

			const nextChar = fullText[index] ?? '';
			const delay = isInitial ? startDelayMs : nextDelay(nextChar, typingSpeedMs, humanize);

			timer = window.setTimeout(() => setIndex((v) => v + 1), delay);
			return () => {
				if (timer) window.clearTimeout(timer);
			};
		}

		if (phase === 'pausing') {
			timer = window.setTimeout(() => setPhase('deleting'), pauseAfterTypedMs);
			return () => {
				if (timer) window.clearTimeout(timer);
			};
		}

		if (phase === 'deleting') {
			if (index <= 0) {
				if (loop || withDelete) {
					timer = window.setTimeout(() => setPhase('typing'), pauseAfterDeletedMs);
				} else {
					timer = window.setTimeout(() => setPhase('done'), 0);
				}
				return () => {
					if (timer) window.clearTimeout(timer);
				};
			}

			const prevChar = fullText[index - 1] ?? '';
			const delay = nextDelay(prevChar, deletingSpeedMs, humanize);

			timer = window.setTimeout(() => setIndex((v) => v - 1), delay);
			return () => {
				if (timer) window.clearTimeout(timer);
			};
		}

		return;
	}, [
		fullText,
		index,
		phase,
		typingSpeedMs,
		deletingSpeedMs,
		startDelayMs,
		pauseAfterTypedMs,
		pauseAfterDeletedMs,
		loop,
		withDelete,
		humanize,
	]);

	const text = useMemo(() => fullText.slice(0, index), [fullText, index]);

	return {
		text,
		isTyping: phase === 'typing',
		isDeleting: phase === 'deleting',
		isDone: phase === 'done',
	};
}
