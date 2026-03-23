import React, { SVGProps } from 'react';

const ProfileArrow = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="11" viewBox="0 0 6 11" fill="none" {...props}
        style={{ paddingLeft: "-5px", marginTop: "3px", marginLeft: "5px" }}>
        <path d="M1 9.5L5 5.5L1 1.5" stroke="#4C80FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
);

export default ProfileArrow;
