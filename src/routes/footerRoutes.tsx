import React from 'react';
import { authPages, settings } from '../menu';
import Footer from '../layout/Footer/Footer';

const footers = [
    { path: authPages.login.path, element: null, exact: true },
    { path: authPages.resetPassword.path, element: null, exact: true },
    { path: authPages.forgetPassword.path, element: null, exact: true },
    { path: authPages.page404.path, element: null, exact: true },
    { path: settings.profile.path, element: null, exact: true },
    { path: `${settings.profile.path}/edit`, element: null, exact: true },
    { path: settings.settings.path, element: null, exact: true },
    { path: settings.activityLog.path, element: null, exact: true },
    { path: settings.superAdminPanel.path, element: null, exact: true },
    { path: '*', element: <Footer /> },
];

export default footers;
