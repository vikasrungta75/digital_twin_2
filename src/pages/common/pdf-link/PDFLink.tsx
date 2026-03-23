import React, { FC, ReactNode, useRef } from 'react';

import PdfTemplate from '../../../components/templates/PdfTemplate';
import { PDFDownloadLink, Document, Page } from '@react-pdf/renderer';
import PdfTemplateWorkflow from '../../../components/templates/PdfTemplateWorkflow';

interface PDFLinkProps {
	style: { [key: string]: unknown };
	className: string;
	filename: string;
	data: Object[];
	children: ReactNode;
	template?: any;
}

const PDFLink: FC<PDFLinkProps> = ({ style, className, filename, data, children,template }) => {
	return (
		// <PDFDownloadLink
		// 	document={<PdfTemplate data={data} />}
		// 	fileName={`${filename}.pdf`}
		// 	style={style}
		// 	className={className}>
		// 	{children}
		// </PDFDownloadLink>
		<PDFDownloadLink
			document={
				template === 'workflow' ? (
					<PdfTemplateWorkflow data={data} /> // Use PdfTemplateWorkflow if 'template' equals 'workflow'
				) : (
					<PdfTemplate data={data} /> // Default template if 'template' is not 'workflow'
				)
			}
			fileName={`${filename}.pdf`}
			style={style}
			className={className}>
			{children}
		</PDFDownloadLink>
	);
};

export default PDFLink;
