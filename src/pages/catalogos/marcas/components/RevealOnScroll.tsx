import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

interface RevealOnScrollProps {
	children: React.ReactNode;
	rootRef?: React.RefObject<HTMLElement | null>;
	delay?: number;
	className?: string;
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
	children,
	rootRef,
	delay = 0,
	className,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return undefined;

		const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
			root: rootRef?.current ?? null,
			threshold: 0.12,
			rootMargin: '0px 0px -8% 0px',
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, [rootRef]);

	return (
		<div
			ref={ref}
			style={{ transitionDelay: `${delay}ms` }}
			className={classNames(
				'transition-all duration-500 ease-out motion-reduce:transition-none',
				visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
				className,
			)}>
			{children}
		</div>
	);
};

export default RevealOnScroll;
