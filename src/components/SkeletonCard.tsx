/**
 * SkeletonCard.tsx — Shimmer placeholder for loading states
 * FIX UX-06: Replaces blank charts/cards during Overview's 14+ parallel API calls.
 *
 * Usage:
 *   {isLoading ? <SkeletonCard height={200} /> : <MyChart data={data} />}
 *
 * Or for a grid of cards:
 *   {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
 */
import React, { FC } from 'react';

interface SkeletonCardProps {
	/** Height of the skeleton in px (default: 160) */
	height?: number;
	/** Width — defaults to 100% */
	width?: string | number;
	/** Border radius in px (default: 10) */
	radius?: number;
	/** Show an inner title bar skeleton (default: true) */
	showTitle?: boolean;
	className?: string;
}

const shimmerKeyframes = `
@keyframes ravity-shimmer {
  0%   { background-position: -800px 0; }
  100% { background-position:  800px 0; }
}`;

let _styleInjected = false;
const injectStyle = () => {
	if (_styleInjected || typeof document === 'undefined') return;
	const el = document.createElement('style');
	el.textContent = shimmerKeyframes;
	document.head.appendChild(el);
	_styleInjected = true;
};

const SkeletonCard: FC<SkeletonCardProps> = ({
	height = 160,
	width = '100%',
	radius = 10,
	showTitle = true,
	className,
}) => {
	injectStyle();

	const shimmerStyle: React.CSSProperties = {
		background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
		backgroundSize: '800px 100%',
		animation: 'ravity-shimmer 1.4s infinite linear',
		borderRadius: radius,
	};

	return (
		<div
			className={className}
			style={{
				width,
				height,
				background: '#ffffff',
				border: '1px solid #e8e8e8',
				borderRadius: radius,
				padding: 16,
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: 12,
			}}
			aria-busy='true'
			aria-label='Loading…'>
			{showTitle && (
				<div style={{ ...shimmerStyle, height: 16, width: '45%', borderRadius: 6 }} />
			)}
			<div style={{ ...shimmerStyle, flex: 1, borderRadius: radius - 2 }} />
		</div>
	);
};

export default SkeletonCard;
