import React, { FC } from 'react';
import Alert from './bootstrap/Alert';
import Card, { CardBody } from './bootstrap/Card';
import Icon from './icon/Icon';

interface INoDataProps {
	// text: string;
	 text: string | JSX.Element;
	withCard?: boolean;
	children?: React.ReactNode; 
}
const NoData: FC<INoDataProps> = ({ text, withCard = true,children}): JSX.Element => {
	return withCard ? (
		<Card>
			<CardBody>
				<Alert color='info' className='flex-column w-100 align-items-start'>
				{children ? (
					children
				) : (
					<p className='w-100 fw-semibold d-flex flex-row align-items-center mb-0'>
						<Icon icon='Info' size='2x' className='me-2' /> {text}
					</p>
				)}
				</Alert>
			</CardBody>
		</Card>
	) : (
		<CardBody>
			<Alert color='white' className='flex-column w-100 align-items-start'>
			{children ? (
				children
			) : (
				<p className='w-100 fw-semibold d-flex flex-row align-items-center mb-0'>
					<Icon icon='' size='2x' className='me-2' /> {text}
				</p>
			)}
			</Alert>
		</CardBody>
	);
};

export default NoData;
