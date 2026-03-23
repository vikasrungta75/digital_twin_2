import classNames from 'classnames';
import React, { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/bootstrap/Button';
import Card, { CardBody } from '../../components/bootstrap/Card';
import Icon from '../../components/icon/Icon';
import Logo from '../../components/Logo';
import Page from '../../layout/Page/Page';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import { authPages } from '../../menu';
import { RootState } from '../../store/store';
import { useTranslation } from 'react-i18next';
import { LocationStateInterface } from './login/Login';
import LogoKeeplin from '../../components/LogoKeeplin';
import ValcodeLogo from '../../assets/svg/logo3.svg';
 
interface ConfirmPageProps {
    title?: string;
    withRedirectButton: boolean;
    textButton?: string;
    redirectTo?: string;
}
 
const ConfirmPage: FC<ConfirmPageProps> = ({
    title,
    withRedirectButton,
    textButton,
    redirectTo = '/',
}): JSX.Element => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { message } = useSelector((state: RootState) => state?.auth);
    const { t } = useTranslation(['authPage']);
 
    let location = useLocation();
    const state = location.state as LocationStateInterface;
 
    useEffect(() => {
        if (!withRedirectButton) {
            setTimeout(() => {
                navigate(`../${authPages.login.path}`);
                dispatch.auth.deleteTokenAsync();
            }, 3000);
        }
    }, [dispatch.auth, navigate, withRedirectButton]);
    const LogoComponent = process.env.REACT_APP_LOGO === 'Keeplin' ? LogoKeeplin : Logo;
 
    return (
        <PageWrapper isProtected={false} title='Login' className={classNames('page-wrapper-login')}>
            <div className='text-start position-absolute top-0 start-0 end-0 pt-2 ms-4'>
                <img src={ValcodeLogo} width='100' alt='Valcode Logo' className='responsive-img' />
            </div>
            <Page>
                <div className='row h-100  align-items-end justify-content-end position-absolute top-0 start-0 end-0'>
                    <div className='col-xl-5 col-lg-6 col-md-8 no-shadow'>
                        <Card className='no-shadow no-border rounded-0 ' data-tour='login-page'>
                            <CardBody className='no-shadow no-border d-flex flex-column justify-content-start'>
                                <div className='row g-4  m-auto position-absolute top-20 start-0 end-10'>
                                    <div className='text-center h1 fw-bold custom-text-color'>
                                        {t(`${title}`) || `${t('Congratulations')}`}
                                    </div>
                                    {withRedirectButton ? (
                                        <div className='text-center custom-text-color- mt-0 mb-4'>
                                            {message || state?.message}
                                        </div>
                                    ) : (
                                        <>
                                            <div className='text-center custom-text-color- mt-0 mb-4'>
                                                {t('You password has been updated')}
                                                <br />
                                                {t('Now you will be redirect to login.')}
                                            </div>
                                        </>
                                    )}
                                    <div className='text-center my-1 '>
                                        <Icon
                                            icon='CustomSuccess'
                                            size='lg'
                                            forceFamily='custom'
                                            color='secondary'
                                        />
                                    </div>
                                    {/* <div className='col-12'>
                                        <Button className='w-100 py-3 custom-btn-color'>
                                            Reset New Password
                                        </Button>
                                    </div> */}
                                    {withRedirectButton && (
                                        <div className='col-12'>
                                            <Button
                                                className='w-100 py-3 custom-button'
                                                onClick={() => {
                                                    navigate(redirectTo);
                                                }}>
                                                {textButton}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </Page>
        </PageWrapper>
    );
};
 
export default ConfirmPage;