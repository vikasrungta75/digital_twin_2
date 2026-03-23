import React, { FC, ReactNode, useContext } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Content from '../Content/Content';
import WrapperOverlay from './WrapperOverlay';
import HeaderRoutes from '../Header/HeaderRoutes';
import ThemeContext from '../../contexts/themeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface IWrapperContainerProps {
	children: ReactNode;
	className?: string;
}
export const WrapperContainer: FC<IWrapperContainerProps> = ({ children, className, ...props }) => {
	const { rightPanel } = useContext(ThemeContext);

	const { dir } = useSelector((state: RootState) => state.appStore);

	return (
		<div
			className={classNames(
				{ 'wrapper-RTL': dir === 'rtl' },
				{ wrapper: dir === 'ltr' },
				{ 'wrapper-right-panel-active': rightPanel },
				className,
			)}
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...props}>
			{children}
		</div>
	);
};
WrapperContainer.propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};
WrapperContainer.defaultProps = {
	className: undefined,
};

const Wrapper = () => {
	return (
		<>
			<WrapperContainer>
				<HeaderRoutes />
				<Content />
				{/* 	<FooterRoutes /> */}
			</WrapperContainer>
			<WrapperOverlay />
		</>
	);
};

export default Wrapper;
