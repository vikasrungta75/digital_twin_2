import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/icon/Icon';
import { authPages } from '../../../menu';
import { store } from '../../../store/store';

interface LogoutProps {}

const Logout: FC<LogoutProps> = () => {
	const navigate = useNavigate();
	const { dispatch } = store;
	const { t } = useTranslation(['translation', 'menu']);

	return (
		<nav aria-label='aside-bottom-user-menu-2'>
			<div className='navigation'>
				<div
					role='presentation'
					className='navigation-item cursor-pointer'
					onClick={() => {
						dispatch.auth.deleteTokenAsync();
						navigate(`../${authPages.login.path}`);
					}}>
					<span className='navigation-link navigation-link-pill'>
						<span className='navigation-link-info'>
							<Icon icon='Logout' className='navigation-icon' />
							<span className='navigation-text'>{t('menu:Logout')}</span>
						</span>
					</span>
				</div>
			</div>
		</nav>
	);
};

export default Logout;
