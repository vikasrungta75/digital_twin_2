import React, { SVGProps } from 'react';

const DashboardDownArrow = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M17 13L12 18L7 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M17 6L12 11L7 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>

);

export default DashboardDownArrow;