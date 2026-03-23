import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import contents from '../../routes/contentRoutes';

const ContentRoutes = () => {
	return (
		<Routes>
			{contents.map((page) => (
				// eslint-disable-next-line react/jsx-props-no-spreading
				<Route key={page.path} {...page} />
			))}
			{/* <Route path='*' element={<PAGE_404 />} /> */}
			<Route path='*' element={<Navigate to='/auth-pages/404' replace />} />
		</Routes>
	);
};

export default ContentRoutes;
