import { useQuery } from '@tanstack/react-query';
import {  generateRestAPI } from '../helpers/helpers';
import { getData } from './commonService';
import { RootState, store } from '../store/store';
import { useSelector } from 'react-redux';

export const useGetActivityLogs = () => {
    const {
		user: {
			user: { id },
		},
	} = store.getState().auth;
	const payload = generateRestAPI(
		[{ user_id: id }],
		process.env.REACT_APP_ACTIVITY_LOGS,
	);

	return useQuery({
		queryKey: ['getActivityLogs', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Activity Logs', true),
	});
};
