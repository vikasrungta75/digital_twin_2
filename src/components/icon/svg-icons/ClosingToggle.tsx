import React, { SVGProps } from 'react';

const SvgClosingToggle = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" {...props} style={{borderBottomColor:"green"}}>
        <path d="M9.14258 4.61865L4.77452 8.98671L9.14258 13.3548" stroke="#0E1726" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.2815 4.61865L9.91344 8.98671L14.2815 13.3548" stroke="#0E1726" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
);

export default SvgClosingToggle;
