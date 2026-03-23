import React from 'react';
import { authPages } from '../menu';
import DefaultHeader from '../pages/common/Headers/DefaultHeader';

const headers = [
	{ path: authPages.login.path, element: null, exact: true },
	{ path: authPages.resetPassword.path, element: null, exact: true },
	{ path: authPages.forgetPassword.path, element: null, exact: true },
	{ path: authPages.page404.path, element: null, exact: true },
	{
		path: `*`,
		element: <DefaultHeader />,
	},
];

export default headers;
