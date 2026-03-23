import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { settings } from '../../menu';
import Icon from '../../components/icon/Icon';
import useNavigationItemHandle from '../../hooks/useNavigationItemHandle';
import { RootState } from '../../store/store';
import Logout from '../../pages/auth/logout/Logout';
import { useSelector } from 'react-redux';
import ThemeContext from '../../contexts/themeContext';

const User = () => {
	const { user } = useSelector((state: RootState) => state.auth.user);
	const { mobileDesign } = useContext(ThemeContext);

	const navigate = useNavigate();
	const handleItem = useNavigationItemHandle();

	const { t } = useTranslation(['translation', 'menu']);

	return (
		<>
			<nav aria-label='aside-bottom-user-menu'>
				<div className='navigation'>
					<div
						role='presentation'
						className='navigation-item cursor-pointer'
						onClick={() => {
							navigate(
								`../${settings.profile.path}`,
								// @ts-ignore
								handleItem(),
							);
						}}>
						<span className='navigation-link navigation-link-pill'>
							<span className='navigation-link-info'>
								<Icon icon='AccountCircle' className='navigation-icon' />
								<span className='navigation-text'>{t('menu:Profile')}</span>
							</span>
						</span>
					</div>
				</div>
			</nav>
			{!mobileDesign && (
				<nav aria-label='aside-bottom-user-menu'>
					<div className='navigation'>
						<div
							role='presentation'
							className='navigation-item cursor-pointer'
							onClick={() => {
								navigate(`../${settings.settings.path}`);
							}}>
							<span className='navigation-link navigation-link-pill'>
								<span className='navigation-link-info'>
									<Icon icon='Settings' className='navigation-icon' />
									<span className='navigation-text'>{t('menu:Settings')}</span>
								</span>
							</span>
						</div>
					</div>
				</nav>
			)}
			<Logout />
		</>
	);
};

export default User;
