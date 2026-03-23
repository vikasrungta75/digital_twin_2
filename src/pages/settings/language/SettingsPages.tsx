import React, { useContext, useState, useEffect } from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import { useTranslation } from 'react-i18next';
import ThemeContext from '../../../contexts/themeContext';
import GoBack from '../../../components/GoBack';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Spinner from '../../../components/bootstrap/Spinner';
import showNotification from '../../../components/extras/showNotification';
import { RootState, store } from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import Page from '../../../layout/Page/Page';
import LanguageSelect from './components/LanguageSelect';
import { useSelector } from 'react-redux';
import TimezoneSelect from './components/TimezoneSelect';
// import MapSelect from './components/MapSelect';
import { getBrowserDateUTCByText } from '../../../helpers/helpers';
import AssistanceButton from '../../common/assitance-button/AssistanceButton';
import CurrencySelect from './components/CurrencySelect';

const SettingsPage = () => {
	const { t } = useTranslation(['menu', 'profilePage', 'setup']);
	const { mobileDesign } = useContext(ThemeContext);
	const navigate = useNavigate();
	const { i18n } = useTranslation();
	const { dispatch } = store;
	const { UpdateUserLanguageAsync: isLanguageLoading } = useSelector(
		(state: RootState) => state.loading.effects.auth,
	);
	const { preferedTimeZone } = useSelector((state: RootState) => state.auth);

	const [languageSelected, setlanguageSelected] = useState(i18n.language);

	const [timezoneSelected, setTimezoneSelected] = useState(preferedTimeZone);

	const [currencyeSelected, setCurrencySelected] = useState('');

	useEffect(() => {
		if (preferedTimeZone) {
			setTimezoneSelected(preferedTimeZone);
		} else {
			setTimezoneSelected(getBrowserDateUTCByText());
		}
	}, [preferedTimeZone]);

	const changeSettings = async () => {
		const updatedTimezone = await dispatch.auth.updateTimeZone(timezoneSelected);
		const updatedLanguage = await dispatch.auth.UpdateUserLanguageAsync(
			languageSelected.toLocaleUpperCase(),
		);

		if (updatedLanguage) {
			i18n.changeLanguage(languageSelected);
			if (languageSelected === 'ar-AR') {
				dispatch.appStore.changeDir('rtl');
			} else {
				dispatch.appStore.changeDir('ltr');
			}
		}
		if (updatedTimezone && updatedLanguage) {
			showNotification('', t('Settings have been successfully updated'), 'success');
		}
	};
	return (
		<PageWrapper isProtected={true}>
			<Page className='mw-100 px-3'>
				<div className='d-flex'>
					{/* <div className='fs-2 pb-3 mb-4 fw-semibold text-secondary border-bottom border-secondary w-100'> */}
					<div className='fs-2 pb-3 mb-4 fw-semibold w-100 ' style={{ color: '#F00D69' }}>
						{t('Settings', { ns: 'menu' })}
						{/* {t(`${dashboardMenu.alertsNotifications.text}`)} */}
					</div>
					<div className='fs-2 pb-3 mb-4 fw-semibold text-secondary border-bottom border-secondary align-self-stretch ml-auto'>
						<AssistanceButton locationPathname={window.location.pathname} />
					</div>
				</div>
				{/* <div className='d-flex pb-3 mb-4 border-bottom border-secondary w-100'>
					<GoBack />
					<h1 className='fs-2 ms-4 fw-semibold text-secondary'>
						{t('Settings', { ns: 'menu' })}
					</h1>
				</div> */}
				<Card className={`mx-auto py-4 ${mobileDesign ? 'w-100' : 'w-50'}`}>
					<CardBody>
						<LanguageSelect
							languageSelected={languageSelected}
							setlanguageSelected={setlanguageSelected}
						/>
						{/* <CurrencySelect
							languageSelected={languageSelected}
							currencyeSelected={currencyeSelected}
							setCurrencySelected={setCurrencySelected}
						/> */}
						{/* <MapSelect /> */}
						<TimezoneSelect
							timezoneSelected={timezoneSelected}
							setTimezoneSelected={setTimezoneSelected}
						/>
					</CardBody>
				</Card>
				<div
					className={`d-flex mb-3 ${
						mobileDesign
							? 'flex-column'
							: 'flex-row-reverse justify-content-start w-50 mx-auto mx-5 gap-3'
					}`}>
					<Button
						// color='secondary'
						style={{ backgroundColor: '#1F1E1E', color: 'white' }} // add color if needed
						className={`py-3 w-100 ${mobileDesign ? 'mb-3' : 'ms-3'}`}
						isDisable={isLanguageLoading}
						onClick={() => {
							changeSettings();
						}}>
						{isLanguageLoading && <Spinner isSmall inButton />}
						{t('Save', { ns: 'profilePage' })}
					</Button>
					<Button
						color='secondary'
						isOutline
						className={`py-3 w-100 light-btn`}
						isDisable={isLanguageLoading}
						onClick={() => {
							navigate(-1);
						}}>
						{isLanguageLoading && <Spinner isSmall inButton />}
						{t('Cancel', { ns: 'profilePage' })}
					</Button>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default SettingsPage;
