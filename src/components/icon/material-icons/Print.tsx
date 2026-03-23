import React, { SVGProps } from 'react';

const SvgPrint = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="49" height="51" viewBox="0 0 49 51" fill="none">
			<g filter="url(#filter0_dd_1_8073)">
				<rect x="8" y="4" width="33" height="35" rx="4" fill="#1F1E1E" />
				<path d="M30.1406 16.1562H18.9336C18.3628 16.1562 17.8153 16.383 17.4117 16.7867C17.008 17.1903 16.7812 17.7378 16.7812 18.3086V24.1719C16.7812 24.723 17.0002 25.2516 17.3899 25.6413C17.7796 26.0311 18.3082 26.25 18.8594 26.25H19.1562V27.7225C19.1562 28.1193 19.3139 28.4999 19.5945 28.7805C19.8751 29.0611 20.2557 29.2188 20.6525 29.2188H28.3475C28.7443 29.2188 29.1249 29.0611 29.4055 28.7805C29.6861 28.4999 29.8438 28.1193 29.8438 27.7225V26.25H30.1406C30.6918 26.25 31.2204 26.0311 31.6101 25.6413C31.9998 25.2516 32.2188 24.723 32.2188 24.1719V18.2344C32.2188 17.6832 31.9998 17.1546 31.6101 16.7649C31.2204 16.3752 30.6918 16.1562 30.1406 16.1562ZM28.6562 27.7225C28.656 27.8043 28.6233 27.8827 28.5655 27.9405C28.5077 27.9983 28.4293 28.031 28.3475 28.0312H20.6525C20.5707 28.031 20.4923 27.9983 20.4345 27.9405C20.3767 27.8827 20.344 27.8043 20.3438 27.7225V21.8088C20.344 21.727 20.3767 21.6486 20.4345 21.5908C20.4923 21.5329 20.5707 21.5003 20.6525 21.5H28.3475C28.4293 21.5003 28.5077 21.5329 28.5655 21.5908C28.6233 21.6486 28.656 21.727 28.6562 21.8088V27.7225ZM29.6211 19.7158C29.4394 19.7304 29.2577 19.6889 29.1003 19.597C28.943 19.505 28.8177 19.367 28.7412 19.2016C28.6648 19.0361 28.641 18.8512 28.6729 18.6718C28.7049 18.4924 28.7911 18.3271 28.92 18.1983C29.0488 18.0694 29.2141 17.9832 29.3935 17.9512C29.5729 17.9192 29.7578 17.9431 29.9233 18.0195C30.0887 18.0959 30.2267 18.2213 30.3187 18.3786C30.4106 18.536 30.4521 18.7177 30.4375 18.8994C30.4206 19.1102 30.3291 19.3082 30.1795 19.4578C30.0299 19.6074 29.832 19.6988 29.6211 19.7158Z" fill="white" />
				<path d="M27.7656 13.7812H21.2343C20.7348 13.782 20.2523 13.9623 19.8747 14.2893C19.4972 14.6164 19.2498 15.0682 19.1777 15.5625H29.8222C29.7501 15.0682 29.5028 14.6164 29.1252 14.2893C28.7476 13.9623 28.2651 13.782 27.7656 13.7812Z" fill="white" />
			</g>
			<defs>
				<filter id="filter0_dd_1_8073" x="0" y="0" width="49" height="51" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="4" />
					<feGaussianBlur stdDeviation="4" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_8073" />
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
					<feOffset dy="2" />
					<feGaussianBlur stdDeviation="1" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
					<feBlend mode="normal" in2="effect1_dropShadow_1_8073" result="effect2_dropShadow_1_8073" />
					<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_8073" result="shape" />
				</filter>
			</defs>
		</svg>
	);
}

export default SvgPrint;
