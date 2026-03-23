import classNames from 'classnames';
import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import useDarkMode from '../../../hooks/useDarkMode';
import Header, { HeaderLeft, HeaderRight } from '../../../layout/Header/Header';
import { RootState } from '../../../store/store';
import { IButtonProps } from '../../../components/bootstrap/Button';
import { useTranslation } from 'react-i18next';
import SettingsHeader from './SettingsHeader';
import Search from '../../../components/Search';
import ThemeContext from '../../../contexts/themeContext';
import { useLocation } from 'react-router-dom';
import GoBack from '../../../components/GoBack';

const DefaultHeader = () => {
  const location = useLocation();
  const { t } = useTranslation(['setup']);
  const { darkModeStatus } = useDarkMode();
  const { mobileDesign } = useContext(ThemeContext);

  const styledBtn: IButtonProps = {
    color: darkModeStatus ? 'dark' : 'light',
    hoverShadow: 'default',
    isLight: !darkModeStatus,
    size: 'lg',
  };

  const tabNames: { [key: string]: string } = {
    '/dt/about': 'Vehicle Digital Twin',
    '/dt/overview': 'Overview',
    '/dt/climate': 'Climate Analysis',
    '/dt/driving': 'Driving Analysis',
    '/dt/fuel': 'Fuel Analysis',
    '/dt/light': 'Light Analysis',
    '/dt/speed': 'Speed Analysis',
    '/dt/trip': 'Trip Analysis',
    '/dt/dtc': 'DTC Analysis',
    '/dt/intelligence': 'Intelligence',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/settings/activity': 'Activity Log',
    '/settings/super-admin-panel': 'Super Admin Panel',
  };

  const currentTab = tabNames[location.pathname] || 'Vehicle Digital Twin';

  const renderHeading = () => {
    if (location.pathname.startsWith('/settings/scheduled-reports')) {
      return (
        <>
          <GoBack className="me-2" /> {t('Report')}
        </>
      );
    }
    if (location.pathname.startsWith('/profile/edit')) {
      return (
        <>
          <GoBack className="me-2" /> {t('Profile')}
        </>
      );
    }
    return currentTab;
  };

  return (
    <Header>
      {mobileDesign ? (
        <HeaderLeft>
          <Search />
        </HeaderLeft>
      ) : (
        <>
          <HeaderLeft>
            <div className="d-flex align-items-center">
              <div
                className={classNames('fs-3', 'fw-bold', 'd-flex', 'align-items-center', {
                  'text-dark': !darkModeStatus,
                })}
              >
                {renderHeading()}
              </div>
            </div>
          </HeaderLeft>
          <HeaderRight>
            <div className="row g-3 custom-header-right">
              <Search />
              <div className="col-auto">
                <SettingsHeader styledBtn={styledBtn} />
              </div>
            </div>
          </HeaderRight>
        </>
      )}
    </Header>
  );
};

export default DefaultHeader;
