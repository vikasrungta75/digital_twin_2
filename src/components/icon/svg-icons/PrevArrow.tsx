import React, { SVGProps } from 'react';

const SvgPrevArrow = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 10 16" fill="none" {...props}>
            <path d="M8.33268 14.6678L1.66602 8.00114L8.33268 1.33447" stroke="#1E1F20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill='black' />
        </svg>
    );
}

export default SvgPrevArrow;

