import { useCallback, useEffect, useState } from 'react';

interface Size {
	width: number;
	height: number;
}

function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
	(node: T | null) => void,
	Size,
] {
	// Mutable values like 'ref.current' aren't valid dependencies
	// because mutating them doesn't re-render the component.
	// Instead, we use a state as a ref to be reactive.
	const [ref, setRef] = useState<T | null>(null);
	const [size, setSize] = useState<Size>({
		width: 0,
		height: 0,
	});
	const [node, setNode] = useState<T | null>(null);

	useEffect(() => {
		if (!node) return;

		const updateSize = () => {
			const rect = node.getBoundingClientRect();
			setSize({
				width: Math.round(rect.width),
				height: Math.round(rect.height),
			});
		};

		updateSize();

		const observer = new ResizeObserver(() => {
			updateSize();
		});

		observer.observe(node);

		return () => {
			observer.disconnect();
		};
	}, [node]);

	const handleRef = useCallback((nextNode: T | null) => {
		setRef(nextNode);
		setNode(nextNode);
	}, []);

	return [handleRef, size];
}

export default useElementSize;
