import React from 'react';
import Spinner from './bootstrap/Spinner';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const Loader = () => {
	const isLoading = useSelector((state: RootState) => state.loading.global);
	return (
		<div className={`loader-wrapper ${!isLoading && 'hidden'}`}>
			<Spinner className='spinner-center' color='secondary' size='5rem' />
		</div>
	);
};

export default Loader;
