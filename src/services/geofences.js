import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { generateRestAPI } from '../helpers/helpers';
import { store } from '../store/store';
import { getData } from './commonService';

export const useGetGeofencesSettingsData = (payload) => {
	const dispatch = useDispatch();

	return useQuery({
		queryKey: ['getGeofences'],
		retryOnMount: true,
		queryFn: () => dispatch.geofences.getGeofencesAsync(payload),
	});
};


export const useGetPoiList = () => {
	const {
		user: {
			user: { id },
		},
		customProperties
	} = store.getState().auth;
	let organisationId = customProperties.organisationId ? customProperties.organisationId : '';


	const payload = generateRestAPI(
		[{
			fleet_id: customProperties.fleetId,
			organisation_id: organisationId
		}, { user_id: id },],
		process.env.REACT_APP_POI_MYFLEET,
	);

	return useQuery({
		queryKey: ['useGetOtherDriverScoreService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'get POI List'),
	});
};

export const useGetPoiListForTask = () => {
	const {
		user: {
			user: { id },
		},
		customProperties
	} = store.getState().auth;
	const payload = generateRestAPI(
		[{
			fleet_id: customProperties.fleetId,
		}, { user_id: id },],
		process.env.REACT_APP_POI_MYFLEET_TASK,
	);

	return useQuery({
		queryKey: ['useGetOtherDriverScoreService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'get POI List'),
	});
};