import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

export const useGetAlertsSettingsData = () => {
	const dispatch = useDispatch();

	return useQuery({
		queryKey: ['getAlertsSettings'],
		retryOnMount: true,
		queryFn: () => dispatch.alertsNotifications.getAlarmsSettings(),
	});
};
