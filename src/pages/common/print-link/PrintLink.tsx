import React, { FC } from 'react';
import Button from '../../../components/bootstrap/Button';

interface PrintLinkProps {
	filename: string;
	data: Object[];
}

const PrintLink: FC<PrintLinkProps> = ({ filename, data }) => {
	const handlePrint = async () => {
		
	};

	return (
		<Button
			onClick={handlePrint}
			style={{ textDecoration: 'none' }}
			icon='Print'
			size='lg'
			className={`mb-0 border-0 me-2`}
		/>
	);
};

export default PrintLink;
