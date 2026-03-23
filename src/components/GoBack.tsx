import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './bootstrap/Button';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface IGoBack {
	handleClick?: () => void;
	className?: string;
	style?: React.CSSProperties|string;
}

const GoBack: FC<IGoBack> = ({ handleClick, className }): JSX.Element => {
	const navigate = useNavigate();
	const { dir } = useSelector((state: RootState) => state.appStore);

	return (
		<div
			className={`d-flex justify-content-start ${
				dir === 'rtl' ? 'align-self-end' : ' align-self-start'
			} ${className}`}>
			<Button
				aria-label='Toggle Go Back'
				className='mobile-header-toggle'
				size='sm'
				color='dark'
				isLight
				icon='ArrowBackIos'
				onClick={() => (handleClick ? handleClick() : navigate(-1))}
				style={{ borderRadius: '14px' }}
			/>
		</div>
	);
};

export default GoBack;

