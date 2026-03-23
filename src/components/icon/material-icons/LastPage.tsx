import React, { SVGProps } from 'react';

const SvgLastPage = (props: SVGProps<SVGSVGElement>) => {
	return (
		// <svg
		// 	xmlns='http://www.w3.org/2000/svg'
		// 	height='1em'
		// 	viewBox='0 0 24 24'
		// 	width='1em'
		// 	fill='currentColor'
		// 	className='svg-icon'
		// 	{...props}>
		// 	<path d='M0 0h24v24H0V0z' fill='none' opacity={0.87} />
		// 	<path d='M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z' />
		// </svg>

		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28" fill="none" {...props}>
			<path d="M11 19.6104L6 14L11 8.38965" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M18 19.6104L13 14L18 8.38965" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export default SvgLastPage;
