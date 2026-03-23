import React, { SVGProps } from 'react';

const SvgFace = (props: SVGProps<SVGSVGElement>) => {
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
		// 		d='M17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12C12.06 6.44 14.6 8 17.5 8zM8.08 5.03a8.046 8.046 0 00-3.66 4.44 8.046 8.046 0 003.66-4.44z'
		// 		opacity={0.3}
		// 	/>
		// 	<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c2.9 0 5.44 1.56 6.84 3.88-.43.07-.88.12-1.34.12-2.9 0-5.44-1.56-6.84-3.88.43-.07.88-.12 1.34-.12zM8.08 5.03a8.046 8.046 0 01-3.66 4.44 8.046 8.046 0 013.66-4.44zM12 20c-4.41 0-8-3.59-8-8 0-.05.01-.1.01-.15 2.6-.98 4.68-2.99 5.74-5.55a9.942 9.942 0 009.92 3.46c.21.71.33 1.46.33 2.24 0 4.41-3.59 8-8 8z' />
		// 	<circle cx={9} cy={13} r={1.25} />
		// 	<circle cx={15} cy={13} r={1.25} />
		// </svg>

		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
			<path d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M8.00037 13.2893C10.9216 13.2893 13.2898 10.9212 13.2898 7.99989C13.2898 5.07861 10.9216 2.71045 8.00037 2.71045C5.0791 2.71045 2.71094 5.07861 2.71094 7.99989C2.71094 10.9212 5.0791 13.2893 8.00037 13.2893Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M12.8304 5.8457C12.8304 5.8457 9.72363 6.29306 9.72363 8.00009C9.72363 9.70712 11.7738 11.7055 11.7738 11.7055" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M3.88965 4.6709C3.88965 4.6709 5.0051 5.28366 8.00006 5.28366C10.995 5.28366 12.1105 4.6709 12.1105 4.6709" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M4.22554 11.7055C4.22554 11.7055 6.27574 9.70712 6.27574 8.00009C6.27574 6.29306 3.16895 5.8457 3.16895 5.8457" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M10.119 12.8478C10.119 12.8478 9.1148 10.229 7.99993 10.229C6.88506 10.229 5.88086 12.8478 5.88086 12.8478" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M8.00028 8.48739C8.31757 8.48739 8.57479 8.23017 8.57479 7.91288C8.57479 7.59559 8.31757 7.33838 8.00028 7.33838C7.683 7.33838 7.42578 7.59559 7.42578 7.91288C7.42578 8.23017 7.683 8.48739 8.00028 8.48739Z" stroke="white" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export default SvgFace;
