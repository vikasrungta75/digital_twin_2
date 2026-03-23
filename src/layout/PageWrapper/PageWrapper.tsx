import React, { useLayoutEffect, forwardRef, ReactElement, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ISubHeaderProps } from '../SubHeader/SubHeader';
import { IPageProps } from '../Page/Page';
import { useNavigate, useLocation } from 'react-router-dom';
import { authPages } from '../../menu';
import { store } from '../../store/store';
 
interface IPageWrapperProps {
    isProtected?: boolean;
    title?: string;
    description?: string;
    children:
        | ReactElement<ISubHeaderProps>[]
        | ReactElement<IPageProps>
        | ReactElement<IPageProps>[];
    className?: string;
}
const PageWrapper = forwardRef<HTMLDivElement, IPageWrapperProps>(
    ({ isProtected, title, description, className, children }, ref) => {
        useLayoutEffect(() => {
            // @ts-ignore
            document.getElementsByTagName('TITLE')[0].text = `${title ? `${title} | ` : ''}${
                process.env.REACT_APP_SITE_NAME
            }`;
            // @ts-ignore
            document
                ?.querySelector('meta[name="description"]')
                .setAttribute('content', description || process.env.REACT_APP_META_DESC || '');
        });
 
        const { auth } = store.getState();
 
        const navigate = useNavigate();
        const location = useLocation();
        const pathsWithoutProtection = [
            authPages.login.path,
            authPages.forgetPassword.path,
            authPages.resetPassword.path,
        ];
 
        useEffect(() => {
            if (
                !pathsWithoutProtection.includes(location.pathname) &&
                isProtected &&
                auth.token === ''
            ) {
                navigate(`../${authPages.login.path}`);
            }
            // if (isProtected) {
            //  if (isProtected && auth.token === '') {
 
            //  }
            // }
            return () => {};
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isProtected, auth.token, location]);
 
        return (
            <div ref={ref} className={classNames('page-wrapper', 'container-fluid', className)}>
                {children}
            </div>
        );
    },
);
PageWrapper.displayName = 'PageWrapper';
PageWrapper.propTypes = {
    isProtected: PropTypes.bool,
    title: PropTypes.string,
    description: PropTypes.string,
    // @ts-ignore
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};
// PageWrapper.defaultProps = {
//  isProtected: false,
//  title: undefined,
//  description: undefined,
//  className: undefined,
// };
 
export default PageWrapper;