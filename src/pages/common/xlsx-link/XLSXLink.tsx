import React, { FC, ReactNode } from 'react';
import { writeFileXLSX, utils } from 'xlsx';

interface XLSXLinkProps {
	style: { [key: string]: unknown };
	className?: string;
	filename: string;
	data: Object[];
	children: ReactNode;
	isDisable?: boolean
}



const XLSXLink: FC<XLSXLinkProps> = ({ style, className, filename, data, children, isDisable }) => {
	
	
	const exportExcel = () => {
		const worksheet = utils.json_to_sheet(data);
		

		const wb = utils.book_new();
		utils.book_append_sheet(wb, worksheet, 'Data');
		writeFileXLSX(wb, `${filename}.xlsx`);
	};

	return (
		<button
			disabled={isDisable}
			onClick={(e) => {
				// e.preventDefault();
				exportExcel();
			}}
			style={style}
			className={className}>
			{children}
		</button>
	);
};

export default XLSXLink;
