import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../store/store';

export const useNotifications = () => {
	const dispatch = useDispatch();
	const { pathname } = useLocation();
	const { urlEndPoint } = useSelector((state: RootState) => state.vehicles);

	return useQuery({
		queryKey: ['getNotifications'],
		queryFn: () => dispatch.notifications.getAllNotifications(),
		refetchOnWindowFocus: pathname === '/notifications' ? false : true,
		refetchInterval: pathname === '/notifications' ? undefined : 60000,
		enabled: urlEndPoint?.length !== 0,
	});
};
