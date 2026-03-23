import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '../../components/icon/Icon';
// import Logo from '../../components/Logo';
import LogoKeeplin from '../../components/LogoKeeplin';
import Logo from '../../components/Logo';

interface IBrandProps {
	asideStatus: boolean;
	setAsideStatus(...args: unknown[]): unknown;
}
const Brand: FC<IBrandProps> = ({ asideStatus, setAsideStatus }) => {
	const LogoComponent = process.env.REACT_APP_LOGO === 'Keeplin' ? LogoKeeplin : Logo;

	return (
		// <div className='brand'>
		// 	<div className='brand-logo'>
		// 		<h1 className='brand-title '>
		// 			<Link to='/' aria-label='Logo'>
		// 				<LogoComponent isWhite width={88} />
		// 			</Link>
		// 		</h1>
		// 	</div>
		// 	<button
		// 		type='button'
		// 		className='btn brand-aside-toggle'
		// 		aria-label='Toggle Aside'
		// 		onClick={() => setAsideStatus(!asideStatus)}>
		// 		<Icon icon='FirstPage' className='brand-aside-toggle-close' />
		// 		<Icon icon='LastPage' className='brand-aside-toggle-open' />
		// 	</button>
		// </div>
		<div className="brand">
			<div className="brand-logo">
				<h1 className="brand-title">
					<Link to="/" aria-label="Logo">
						<LogoComponent isWhite width={88} />
					</Link>
				</h1>
			</div>
			<button
				type="button"
				className="btn brand-aside-toggle"
				aria-label="Toggle Aside"
				onClick={() => setAsideStatus(!asideStatus)}
			>
				<Icon icon={asideStatus ? 'FirstPage' : 'LastPage'} className="brand-aside-toggle-icon" />
			</button>
		</div>
	);
};
Brand.propTypes = {
	asideStatus: PropTypes.bool.isRequired,
	setAsideStatus: PropTypes.func.isRequired,
};

export default Brand;
