import { useQuery } from '@tanstack/react-query';
import { generateRestAPI } from '../helpers/helpers';
import { getData } from './commonService';

export const useGetDriverNameFilterService = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_DRIVER_NAME_FILTER);

	return useQuery({
		queryKey: ['useGetDriverNameFilterService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetDriverNameFilterService'),
	});
};

export const useGetOtherDriverScoreService = (payloadOptions: any) => {
	const { startdate, enddate, vin } = payloadOptions;

	const payload = generateRestAPI(
		// [{ startdate }, { enddate }, { vin }],
		[{ startdate }, { enddate }],	
		process.env.REACT_APP_OTHER_DRIVE_SCORE,
	);

	return useQuery({
		queryKey: ['useGetOtherDriverScoreService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetOtherDriverScoreService'),
		enabled: vin.length !== 0,
	});
};
// export const useGetTopFiveDriverScoresService = (payloadOptions: any) => {
// 	const { startdate, enddate } = payloadOptions;

// 	const payload = generateRestAPI(
// 		[{ startdate }, { enddate }],
// 		process.env.REACT_APP_TOP_FIVE_DRIVER_SCORES,
// 	);

// 	return useQuery({
// 		queryKey: ['useGetTopFiveDriverScoresService', payload],
// 		staleTime: 300000,
// 		queryFn: () => getData(payload, 'useGetTopFiveDriverScoresService'),
// 	});
// };

export const useGetLeastFiveDriverScoresService = (payloadOptions: any) => {
	const { startdate, enddate } = payloadOptions;

	const payload = generateRestAPI(
		[{ startdate }, { enddate }],
		process.env.REACT_APP_LEAST_FIVE_DRIVER_SCORES,
	);

	return useQuery({
		queryKey: ['useGetLeastFiveDriverScoresService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetLeastFiveDriverScoresService'),
	});
};
export const useGetBehaviourScoreService = (payloadOptions: any) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { startdate, enddate, driver_name } = payloadOptions;

	const payload = generateRestAPI(
		[{ startdate }, { enddate }, { driver_name }],
		process.env.REACT_APP_BEHAVIOUR_COUNTS,
	);

	return useQuery({
		queryKey: ['useGetBehaviourScoreService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetBehaviourScoreService'),
	});
};
export const useGetDriverProfileService = (payloadOptions: any) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { driver_name } = payloadOptions;

	const payload = generateRestAPI([{ driver_name }], process.env.REACT_APP_DRIVER_PROFILE);

	return useQuery({
		queryKey: ['useGetDriverProfileService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetDriverProfileService'),
	});
};

export const useGetDriverSummaryService = (payloadOptions: any) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { startdate, enddate, driver_name } = payloadOptions;

	const payload = generateRestAPI(
		[{ startdate }, { enddate }, { driver_name }],
		process.env.REACT_APP_DRIVE_SUMMARY,
	);

	return useQuery({
		queryKey: ['useGetDriverProfileService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetDriverProfileService'),
	});
};

export const useGetDriverBehaviourSummaryService = (payloadOptions: any) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { startdate, enddate, driver_name } = payloadOptions;

	const payload = generateRestAPI(
		[{ startdate }, { enddate }, { driver_name }],
		process.env.REACT_APP_DRIVER_BEHAVIOUR_SUMMARY,
	);

	return useQuery({
		queryKey: ['useGetDriverBehaviourSummaryService', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'useGetDriverBehaviourSummaryService'),
	});
};