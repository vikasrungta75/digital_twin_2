import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { ThemeProvider } from 'react-jss';
import { ReactNotifications } from 'react-notifications-component';
import { useFullscreen } from 'react-use';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from 'react-toast-notifications';
import ThemeContext from '../contexts/themeContext';
import Aside from '../layout/Aside/Aside';
import Wrapper from '../layout/Wrapper/Wrapper';
import Portal from '../layout/Portal/Portal';
import { authPages } from '../menu';
import { Toast, ToastContainer } from '../components/bootstrap/Toasts';
import useDarkMode from '../hooks/useDarkMode';
import COLORS from '../common/data/enumColors';
import { getOS } from '../helpers/helpers';
import { http, httpwithtoken } from '../services/http';
import { useDispatch, useSelector } from 'react-redux';
import showNotification from '../components/extras/showNotification';
import { useTranslation } from 'react-i18next';
import { RootState, store } from '../store/store';
import LoginPage from '../pages/auth/login/Login';
import { DtProvider } from '../contexts/digitalTwinContext';

const App = () => {
    getOS();
    const dispatch = useDispatch();
    let navigate = useNavigate();
    const { t } = useTranslation(['notification']);
    const RefToAvoidRepetation = useRef(0);
    const { dir } = useSelector((state: RootState) => state.appStore);
    const location = useLocation();

    const { themeStatus, darkModeStatus } = useDarkMode();
    const theme = {
        theme: themeStatus,
        primary: COLORS.PRIMARY.code,
        secondary: COLORS.SECONDARY.code,
        success: COLORS.SUCCESS.code,
        info: COLORS.INFO.code,
        warning: COLORS.WARNING.code,
        danger: COLORS.DANGER.code,
        dark: COLORS.DARK.code,
        light: COLORS.LIGHT.code,
    };

    useEffect(() => {
        if (darkModeStatus) {
            document.documentElement.setAttribute('theme', 'dark');
        }
        return () => { document.documentElement.removeAttribute('theme'); };
    }, [darkModeStatus]);

    React.useEffect(() => { document.body.dir = dir; }, [dir]);

    // @ts-ignore
    const { fullScreenStatus, setFullScreenStatus } = useContext(ThemeContext);
    const ref = useRef(null);
    useFullscreen(ref, fullScreenStatus, { onClose: () => setFullScreenStatus(false) });

    useLayoutEffect(() => {
        if (process.env.REACT_APP_MODERN_DESGIN === 'true') {
            document.body.classList.add('modern-design');
        } else {
            document.body.classList.remove('modern-design');
        }
    });

    const withOutAsidePages = [
        authPages.login.path,
        authPages.forgetPassword.path,
        authPages.resetPassword.path,
        authPages.page404.path,
    ];
    const withOutAsidePagesTwo = [
        authPages.login.path,
        authPages.forgetPassword.path,
        authPages.page404.path,
    ];

    useEffect(() => {
        const currentPagePath = location.pathname.substring(1);
        const locationRoute = location;
        const isResetPasswordPage = locationRoute.hash.includes('#/reset-password?token');
        const isCurrentPageInList = withOutAsidePagesTwo.includes(currentPagePath);
        if (store.getState().auth.user.user === undefined) {
            if (!isResetPasswordPage && !isCurrentPageInList) {
                navigate('/', { state: location.pathname });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.getState().auth.user.user]);

    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then((response) => response.json())
            .then((data) => dispatch.appStore.updateIpAddress(data.ip))
            .catch((error) => console.log(error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkValidityOfToken = async () => {
        await dispatch.auth.GetValiditOfTokenAsync().then((res: any) => {
            if (!res && (localStorage.getItem('token')?.length !== 0 || localStorage.getItem('token') !== null)) {
                dispatch.auth.deleteTokenAsync();
                showNotification(`${t('Error connection')}`, `${t('Session expired, kindly log in again.')}`, 'danger');
                navigate('/dt/about', { state: location.pathname });
            }
        });
    };

    httpwithtoken.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.response?.status === 304 && RefToAvoidRepetation.current === 0) {
                RefToAvoidRepetation.current = 1;
                checkValidityOfToken();
            }
            return Promise.reject(error);
        },
    );
    http.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.response?.status === 304 && RefToAvoidRepetation.current === 0) {
                RefToAvoidRepetation.current = 1;
                checkValidityOfToken();
            }
            return Promise.reject(error);
        },
    );

    return (
        <ThemeProvider theme={theme}>
            <ToastProvider components={{ ToastContainer, Toast }}>
                <DtProvider>
                    <Routes>
                        <Route path='/' element={<LoginPage />} />
                        {withOutAsidePages.map((path) => (
                            <Route key={path} path={path} />
                        ))}
                        <Route path='*' element={<Aside />} />
                    </Routes>
                    <Wrapper />
                    <Portal id='portal-notification'>
                        <ReactNotifications />
                    </Portal>
                </DtProvider>
            </ToastProvider>
        </ThemeProvider>
    );
};

export default App;
