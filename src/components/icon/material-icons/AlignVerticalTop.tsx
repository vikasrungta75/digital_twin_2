import React, { SVGProps } from 'react';

const SvgAlignVerticalTop = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			height='1em'
			viewBox='0 0 24 24'
			width='1em'
			fill='currentColor'
			className='svg-icon'
			{...props}>
			<path fill='none' d='M0 0h24v24H0z' />
			<path d='M22 2v2H2V2h20zM7 22h3V6H7v16zm7-6h3V6h-3v10z' />
		</svg>
	);
}

export default SvgAlignVerticalTop;
