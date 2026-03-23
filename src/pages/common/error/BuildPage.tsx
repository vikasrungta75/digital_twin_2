import React from 'react';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Logo from '../../../components/Logo';
import Page from '../../../layout/Page/Page';
import { useTranslation } from 'react-i18next';
import LogoKeeplin from '../../../components/LogoKeeplin';

const SummaryPage = () => {
	const { t } = useTranslation(['common']);

	const LogoComponent = process.env.REACT_APP_LOGO === 'Keeplin' ? LogoKeeplin : Logo;

	return (
		<PageWrapper title='React Admin Dashboard Template'>
			<Page>
				<div className='m-auto'>
					<h1 className='display-1 mb-4'>
						{t('Welcome to')} <LogoComponent height={90} />
					</h1>
					<p className='display-6 mb-4'> {t('Everything is under control.')}</p>
					<p className='h2 mb-5'>
						{t('Take a tea or a coffee.')}{' '}
						<span style={{ color: '#00d3cf' }}> {t('This page will come soon.')}</span>
					</p>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default SummaryPage;
