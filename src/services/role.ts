import { useQuery } from '@tanstack/react-query';
import {  generateRestAPI } from '../helpers/helpers';
import { getData } from './commonService';
import { RootState } from '../store/store';
import { useSelector } from 'react-redux';

export const useGetUsersRole = () => {
	const customProperties = useSelector((state:RootState) => state.auth.customProperties)
	const payload = generateRestAPI(
		[{ custom_role: customProperties.role }],
		process.env.REACT_APP_USSERS_ROLE_FILTER,
	);

	return useQuery({
		queryKey: ['getUsersRoleList', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Users Role List', true),
	});
};
