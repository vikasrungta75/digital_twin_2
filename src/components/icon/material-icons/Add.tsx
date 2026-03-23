import React, { SVGProps } from 'react';

const SvgAdd = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="13" height="15" viewBox="0 0 13 15" className='svg-icon' {...props} fill="none" style={{marginLeft:"4px"}}>
			<path d="M6.45752 1.49976V13.5003" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M1 7.50024H11.9152" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export default SvgAdd;