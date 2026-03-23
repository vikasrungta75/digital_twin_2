import React, { SVGProps } from 'react';

const SvgSchool = (props: SVGProps<SVGSVGElement>) => {
	return (
		// <svg
		// 	xmlns='http://www.w3.org/2000/svg'
		// 	height='1em'
		// 	viewBox='0 0 24 24'
		// 	width='1em'
		// 	fill='currentColor'
		// 	className='svg-icon'
		// 	{...props}>
		// 	<path d='M0 0h24v24H0V0z' fill='none' />
		// 	<path
		// 		d='M7 12.27v3.72l5 2.73 5-2.73v-3.72L12 15zM5.18 9L12 12.72 18.82 9 12 5.28z'
		// 		opacity={0.3}
		// 	/>
		// 	<path d='M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm5 12.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72zm-5-3.27L5.18 9 12 5.28 18.82 9 12 12.72z' />
		// </svg>

		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
			<path d="M11.2 3.5H10.5V2.8C10.5 1.26 9.24 0 7.7 0H6.3C4.76 0 3.5 1.26 3.5 2.8V3.5H2.8C1.26 3.5 0 4.76 0 6.3V11.2C0 12.74 1.26 14 2.8 14H11.2C12.74 14 14 12.74 14 11.2V6.3C14 4.76 12.74 3.5 11.2 3.5ZM5.6 2.8C5.6 2.38 5.88 2.1 6.3 2.1H7.7C8.12 2.1 8.4 2.38 8.4 2.8V3.5H5.6V2.8ZM7.7 11.9H6.3C5.88 11.9 5.6 11.62 5.6 11.2C5.6 10.78 5.88 10.5 6.3 10.5H7.7C8.12 10.5 8.4 10.78 8.4 11.2C8.4 11.62 8.12 11.9 7.7 11.9Z" fill="white" />
		</svg>
	);
}

export default SvgSchool;
