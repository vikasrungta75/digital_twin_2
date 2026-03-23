import React, { SVGProps } from 'react';

const SvgFirstPage = (props: SVGProps<SVGSVGElement>) => {
	return (

		// 	xmlns='http://www.w3.org/2000/svg'
		// 	height='1em'
		// 	viewBox='0 0 24 24'
		// 	width='1em'
		// 	fill='currentColor'
		// 	className='svg-icon'
		// 	{...props}>
		// 	<path d='M24 0v24H0V0h24z' fill='none' opacity={0.87} />
		// 	<path d='M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z' />
		// </svg>

		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28" fill="none" {...props}>
			<path d="M11 19.6104L6 14L11 8.38965" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M18 19.6104L13 14L18 8.38965" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export default SvgFirstPage;
