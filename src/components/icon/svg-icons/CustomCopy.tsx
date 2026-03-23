import React, { SVGProps } from 'react';

const CustomCopy = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={19}
    height={24}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16.417 19.25H6.333V6.417h10.084m0-1.833H6.333A1.833 1.833 0 0 0 4.5 6.417V19.25a1.833 1.833 0 0 0 1.833 1.834h10.084a1.833 1.833 0 0 0 1.833-1.834V6.417a1.833 1.833 0 0 0-1.833-1.833ZM13.667.917h-11A1.833 1.833 0 0 0 .833 2.75v12.834h1.834V2.75h11V.917Z"
      fill="#000"
    />
  </svg>
)

export default CustomCopy
