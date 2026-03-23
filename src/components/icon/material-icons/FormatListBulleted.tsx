import React, { SVGProps } from 'react';

const SvgFormatListBulleted = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none" className='svg-icon' {...props} style={{marginRight:"10px"}}>
			<path d="M0 6.5H1.33333V4.5H0V6.5ZM0 10.5H1.33333V8.5H0V10.5ZM0 2.5H1.33333V0.5H0V2.5ZM2.66667 6.5H12V4.5H2.66667V6.5ZM2.66667 10.5H12V8.5H2.66667V10.5ZM2.66667 0.5V2.5H12V0.5H2.66667Z" fill="white" />
		</svg>
	);
}

export default SvgFormatListBulleted;
