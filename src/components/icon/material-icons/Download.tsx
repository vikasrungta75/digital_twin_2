import React, { SVGProps } from 'react';

const SvgDownload = (props: SVGProps<SVGSVGElement>) => {
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
		// 	<path d='M13 9V5h-2v6H9.83L12 13.17 14.17 11H13z' opacity={0.3} />
		// 	<path d='M15 9V3H9v6H5l7 7 7-7h-4zm-3 4.17L9.83 11H11V5h2v6h1.17L12 13.17zM5 18h14v2H5z' />
		// </svg>
		<svg xmlns="http://www.w3.org/2000/svg" width="49" height="51" viewBox="0 0 49 51" fill="none">
			<g filter="url(#filter0_dd_1_8077)">
				<rect x="8" y="4" width="33" height="35" rx="4" fill="#1F1E1E" />
				<g clip-path="url(#clip0_1_8077)">
					<path d="M23.1719 13H25.8281C26.2697 13 26.625 13.3553 26.625 13.7969V19.375H29.5369C30.1279 19.375 30.4234 20.0889 30.0051 20.5072L24.9549 25.5607C24.7059 25.8098 24.2975 25.8098 24.0484 25.5607L18.9916 20.5072C18.5732 20.0889 18.8687 19.375 19.4598 19.375H22.375V13.7969C22.375 13.3553 22.7303 13 23.1719 13ZM33 25.4844V29.2031C33 29.6447 32.6447 30 32.2031 30H16.7969C16.3553 30 16 29.6447 16 29.2031V25.4844C16 25.0428 16.3553 24.6875 16.7969 24.6875H21.6678L23.2947 26.3145C23.9621 26.9818 25.0379 26.9818 25.7053 26.3145L27.3322 24.6875H32.2031C32.6447 24.6875 33 25.0428 33 25.4844ZM28.8828 28.4062C28.8828 28.041 28.584 27.7422 28.2188 27.7422C27.8535 27.7422 27.5547 28.041 27.5547 28.4062C27.5547 28.7715 27.8535 29.0703 28.2188 29.0703C28.584 29.0703 28.8828 28.7715 28.8828 28.4062ZM31.0078 28.4062C31.0078 28.041 30.709 27.7422 30.3438 27.7422C29.9785 27.7422 29.6797 28.041 29.6797 28.4062C29.6797 28.7715 29.9785 29.0703 30.3438 29.0703C30.709 29.0703 31.0078 28.7715 31.0078 28.4062Z" fill="white" />
				</g>
			</g>
			<defs>
				<filter id="filter0_dd_1_8077" x="0" y="0" width="49" height="51" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="4" />
					<feGaussianBlur stdDeviation="4" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_8077" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="2" />
					<feGaussianBlur stdDeviation="1" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
					<feBlend mode="normal" in2="effect1_dropShadow_1_8077" result="effect2_dropShadow_1_8077" />
					<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_8077" result="shape" />
				</filter>
				<clipPath id="clip0_1_8077">
					<rect width="17" height="17" fill="white" transform="translate(16 13)" />
				</clipPath>
			</defs>
		</svg>
	);
}

export default SvgDownload;
