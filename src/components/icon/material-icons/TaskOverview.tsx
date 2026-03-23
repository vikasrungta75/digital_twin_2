import React, { SVGProps } from 'react';

const SvgTaskoverview = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 16" fill="none" {...props}>
        	<path d="M13 15H7V8.5V4.6C7 4.26863 7.26863 4 7.6 4H12.4C12.7314 4 13 4.26863 13 4.6V10.5V15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        	<path d="M13 1H7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        	<path d="M18.4 15H13V11.1C13 10.7686 13.2686 10.5 13.6 10.5H18.4C18.7314 10.5 19 10.7686 19 11.1V14.4C19 14.7314 18.7314 15 18.4 15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        	<path d="M7 15V9.1C7 8.7686 6.73137 8.5 6.4 8.5H1.6C1.26863 8.5 1 8.7686 1 9.1V14.4C1 14.7314 1.26863 15 1.6 15H7Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        
    );
}

export default SvgTaskoverview;