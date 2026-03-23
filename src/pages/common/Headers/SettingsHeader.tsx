import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button, { IButtonProps } from '../../../components/bootstrap/Button';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../components/bootstrap/Dropdown';
import Icon from '../../../components/icon/Icon';
import { authPages, settings } from '../../../menu';
import { RootState, store } from '../../../store/store';

interface ISettingsProps {
	styledBtn: IButtonProps;
}
const SettingsHeader: FC<ISettingsProps> = ({ styledBtn }) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { t } = useTranslation(['setup']);
	const permissions = useSelector((state: RootState) => state.auth?.permissions);

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				{/* eslint-disable-next-line react/jsx-props-no-spreading */}
				{/* <Button {...styledBtn} icon='Settings' aria-label='Quick menu' /> */}
				<Button>
					<Icon icon='Settings' size='2x' color='dark' />
				</Button>
			</DropdownToggle>
			<DropdownMenu isAlignmentEnd size='lg' className='overflow-hidden'>
				<DropdownItem onClick={() => navigate(`../${settings.settings.path}`)}>
					<div className='d-flex align-items-center text-align-center '>
						<Icon icon='Settings' size='3x' color='dark' />
						<span className='text-dark fw-semibold'>{t('Settings')}</span>
					</div>
				</DropdownItem>
				{/* <DropdownItem isDivider /> */}
				{/* {permissions?.sell_all_activity_log && (
					<>
						<DropdownItem onClick={() => navigate(`../${settings.activityLog.path}`)}>
							<div className='d-flex align-items-center text-align-center '>
								<Icon
									icon={settings.activityLog.icon}
									size='3x'
									color='secondary'
								/>
								<span className='text-dark fw-semibold'>
									{t(`${settings.activityLog.text}`)}
								</span>
							</div>
						</DropdownItem>
						<DropdownItem isDivider />
					</>
				)} */}
				{/* {permissions?.sell_all_super_admin_panel && (
					<>
						<DropdownItem
							onClick={() => navigate(`../${settings.superAdminPanel.path}`)}>
							<div className='d-flex align-items-center text-align-center '>
								<Icon
									icon={settings.superAdminPanel.icon}
									size='3x'
									color='secondary'
								/>
								<span className='text-dark fw-semibold'>
									{t(`${settings.superAdminPanel.text}`)}
								</span>
							</div>
						</DropdownItem>

						<DropdownItem isDivider />
					</>
				)} */}
				<DropdownItem onClick={() => navigate(`../${settings.profile.path}`)}>
					<div className='d-flex align-items-center '>
						<Icon icon='AccountCircle' size='3x' color='dark' />
						<span className='text-dark fw-semibold'>{t('Profile')}</span>
					</div>
				</DropdownItem>
				{/* <DropdownItem isDivider /> */}
				<DropdownItem
					onClick={() => {
						const state = store.getState();
						const user = state?.auth?.user;
						const userId = user?.user?.id || user?.user?.userId;
						if (userId) {
							localStorage.removeItem(`fleet_session_${userId}`);
							localStorage.removeItem(`fleet_session_token_${userId}`);
						}
						dispatch.auth.deleteTokenAsync();
						navigate(`../${authPages.login.path}`);
					}}>
					<div className='d-flex align-items-center '>
						<Icon icon='Logout' size='3x' color='dark' />
						<span className='text-dark fw-semibold ms-4'>{t('Logout')}</span>
					</div>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default SettingsHeader;
