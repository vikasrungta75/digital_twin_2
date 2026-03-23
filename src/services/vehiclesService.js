import { generateRestAPI, processNumber } from '../helpers/helpers';
import { useQuery } from '@tanstack/react-query';
import { store } from '../store/store';
import { getData } from './commonService';
import { useDispatch } from 'react-redux';

export const useGetVehicleLocation = (options) => {
	const dispatch = useDispatch();
	const { urlEndPoint } = store.getState().vehicles;

	return useQuery({
		queryKey: ['useGetVehicleLocation'],
		queryFn: () => dispatch.vehicles.getVehicleLocationAsync(options),
		refetchOnWindowFocus: false,
		//	refetchInterval: 5000,
		enabled: urlEndPoint?.length !== 0,
		keepPreviousData: true,
	});
};
export const useGetVehicleLocationv1 = () => {
	const dispatch = useDispatch();
	const { urlEndPoint } = store.getState().vehicles;
	const { selectedTrajectHistory } = store.getState().appStoreNoPersist;
	return useQuery({
		queryKey: ['useGetVehicleLocationv1'],
		queryFn: () => dispatch.vehicles.getVehicleLocationv1Async(),
		refetchOnWindowFocus: false,
		refetchInterval: 5000,
		enabled: urlEndPoint?.length !== 0 && selectedTrajectHistory.length === 0,
		keepPreviousData: true,
	});
};

export const useGetVehicleStatus = (options) => {
	const dispatch = useDispatch();
	const { urlEndPoint } = store.getState().vehicles;

	return useQuery({
		queryKey: ['useGetVehicleStatus', options.status, options.fleet_name],
		queryFn: () => dispatch.vehicles.getVehicleStatusAsync(options),
		refetchOnWindowFocus: false,
		// refetchInterval: 5000,
		enabled: urlEndPoint?.length !== 0,
		keepPreviousData: true,
	});
};

export const useGetTripInfo = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { id } = options;

	const payload = generateRestAPI([{ id }, { units: 'km' }], process.env.REACT_APP_FM_TRIP_INFO);

	return useQuery({
		queryKey: ['tripInfo', payload],
		queryFn: () => getData(payload, 'useGetTripInfo'),
		enabled: false,
	});
};
export const useGetTripWithDTC = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { id } = options;
	const payload = generateRestAPI([{ id }], process.env.REACT_APP_FM_TIME_DTC);

	return useQuery({
		queryKey: ['tripDTC', payload],
		queryFn: () => getData(payload, 'useGetTripWithDTC'),
		enabled: false,
	});
};

export const useGetVehicleData = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_VEHICLE_FLEET);

	return useQuery({
		queryKey: ['getVehicle', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'all vehicles'),
	});
};

export const useVehicleRecords = (options) => {
	const { dateRangeFilter, fleetNameFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ fleet_id: fleetNameFilter },
		],
		process.env.REACT_APP_VEHCILE_DATA_REPORT,
	);

	return useQuery({
		queryKey: ['VehicleRecords', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'VehicleRecords'),
	});
};
export const useDailyVehicleUsage = (options) => {
	const { fleetNameFilter } = options;

	const payload = generateRestAPI(
		[{ fleet_id: fleetNameFilter }],
		process.env.REACT_APP_VEHCILE_DAILY_USAGE,
	);

	return useQuery({
		queryKey: ['DailyVehicleUsage', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'DailyVehicleUsage'),
	});
};
export const useFuelPerformance = (options) => {
	const { dateRangeFilter, fleetNameFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			{ fleet_id: fleetNameFilter },
		],
		process.env.REACT_APP_VEHCILE_FUEL_PERFORMANCE,
	);

	return useQuery({
		queryKey: ['FuelPerformance', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelPerformance'),
	});
};
export const useDailyDriveUsage = (options) => {
	const { dateRangeFilter, fleetNameFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ fleet_id: fleetNameFilter },
		],
		process.env.REACT_APP_VEHCILE_DAILY_DRIVE_USAGE,
	);

	return useQuery({
		queryKey: ['DailyDriveUsage', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'DailyDriveUsage'),
	});
};

export const useStoppedVehicle = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_VEHCILE_STOPS,
	);

	return useQuery({
		queryKey: ['VehicleStopped', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'VehicleStopped'),
	});
};

export const useTripReports = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_REPORT_TRIP,
	);

	return useQuery({
		queryKey: ['TripReports', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'TripReports'),
	});
};

export const useTripShiftReports = (options) => {
	const { dateRangeFilter, vinFilter, shift, timezone } = options;
	let resultProcess = processNumber(timezone);
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			{ sign: resultProcess.sign },
			{ time: resultProcess.totalInMillis },
			{ shift },
		],
		process.env.REACT_APP_REPORT_TRIP_SHIFT,
	);

	return useQuery({
		queryKey: ['shiftTrip', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'shiftTrip'),
	});
};

export const useGeofencesSummary = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_REPORT_GEOFENCES_SUMMARY,
	);

	return useQuery({
		queryKey: ['geofencesSummary', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'geofencesSummary'),
	});
};

export const useGeofencesDetails = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_REPORT_GEOFENCES_ZONE,
	);

	return useQuery({
		queryKey: ['geofencesDetails', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'geofencesDetails'),
	});
};

export const useEngineHours = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_REPORT_ENGINE_HOURS,
	);

	return useQuery({
		queryKey: ['engineHours', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'engineHours'),
	});
};
export const useTrackerDetach = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_TRACKER_DETACH,
	);

	return useQuery({
		queryKey: ['trackerDetach', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'trackerDetach'),
	});
};
export const useFuelVolume = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_FUEL_VOLUME,
	);

	return useQuery({
		queryKey: ['FuelVolume', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelVolume'),
	});
};
export const useFuelVolumeAnalysis = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_FUEL_VOLUME_ANALYSIS,
	);

	return useQuery({
		queryKey: ['FuelVolumeAnalysis', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelVolumeAnalysis'),
	});
};
export const useFleetFuelTank = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_FUEL_TANK,
	);

	return useQuery({
		queryKey: ['FleetFuelTank', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FleetFuelTank'),
	});
};
export const useWorkingHours = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_VEHCILE_WORKING_HOURS,
	);

	return useQuery({
		queryKey: ['workingHours', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'workingHours'),
	});
};

export const useDeviceOnOff = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_DEVICE_ON_OFF,
	);

	return useQuery({
		queryKey: ['DeviceOnOff', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'DeviceOnOff'),
	});
};

export const useConnectionLost = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_VEHCILE_CONNECTION_LOST,
	);

	return useQuery({
		queryKey: ['connectionLost', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'connectionLost'),
	});
};
export const useEcoDrive = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_ECO_DRIVE,
	);

	return useQuery({
		queryKey: ['EcoDrive', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'EcoDrive'),
	});
};

export const useSpeedViolations = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_VEHCILE_SPEED_VIOLATIONS,
	);

	return useQuery({
		queryKey: ['SpeedViolation', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'SpeedViolation'),
	});
};
export const useDriverChangeRotation = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_DRIVER_CHANGE_REPORT,
	);

	return useQuery({
		queryKey: ['Driver Change Rotation', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Driver Change Rotation'),
	});
};

export const usePOIReport = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_POI_REPORT);

	return useQuery({
		queryKey: ['POIReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'POI Report'),
	});
};

export const useGetTripInfoV1 = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { vin, startdate, enddate } = options;
	const payload = generateRestAPI(
		[{ vin }, { startdate }, { enddate }, { units: 'km' }],
		process.env.REACT_APP_TRIP_INFO_V1_1,
	);

	return useQuery({
		queryKey: ['tripInfov1', payload],
		queryFn: () => getData(payload, 'useGetTripInfoV1'),
		enabled: false,
	});
};

export const useGetTripWithDTCv1 = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { vin, startdate, enddate } = options;
	const payload = generateRestAPI(
		[{ vin }, { startdate }, { enddate }],
		process.env.REACT_APP_TRIP_TIME_DTC_V1_1,
	);

	return useQuery({
		queryKey: ['tripDTC', payload],
		queryFn: () => getData(payload, 'useGetTripWithDTC'),
		enabled: false,
	});
};
export const useGetTripTimeline = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { vin, startdate, enddate } = options;

	const payload = generateRestAPI(
		[{ vin }, { startdate }, { enddate }],
		process.env.REACT_APP_TIMELINE_STATUS,
	);

	return useQuery({
		queryKey: ['TripTimeline', payload],
		// staleTime: 300000,
		enabled: startdate !== null,
		queryFn: () => getData(payload, 'useGetTripTimeline'),
	});
};

export const useGetTripTimelineStore = (options) => {
	const dispatch = useDispatch();
	const { urlEndPoint } = store.getState().vehicles;
	return useQuery({
		queryKey: ['useGetTripTimelineStore'],
		queryFn: () => dispatch.vehicles.getVehicleTimeline(options),
		refetchOnWindowFocus: false,
		//	refetchInterval: 5000,
		enabled: urlEndPoint?.length !== 0,
		keepPreviousData: true,
	});
};
export const useCategoryRecord = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_CATEGORY_REPORT);

	return useQuery({
		queryKey: ['CategoryRecord', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'CategoryRecord', true),
	});
};

export const useTemperatureMnReports = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_TEMPERATURE_MN_REPORTS,
	);

	return useQuery({
		queryKey: ['FuelVolume', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelVolume'),
		// queryFn: async () => {
		// 	const result = await getData(payload, 'FuelVolume');
		// 	return result ?? [];
		// }
		
	});
};
export const useTemperatureReports = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_TEMPERATURE_REPORTS,
	);

	return useQuery({
		queryKey: ['FuelVolume', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelVolume'),
	});
};

export const useTemperatureChartReports = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
		],
		process.env.REACT_APP_TEMPERATURE_CHART_REPORTS,
	);

	return useQuery({
		queryKey: ['FuelVolume', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'FuelVolume'),
	});
};

export const useFuelAnalysisReport = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;
	const { customProperties } = store.getState().auth;
	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: customProperties.fleetId },
		],
		process.env.REACT_APP_FUEL_ANALYSIS_REPORTS,
	);

	return useQuery({
		queryKey: ['useFuelAnalysisReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Fuel Analysis Report'),
	});
};
export const useFuelAnalysisPerdayReport = (options) => {
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;
	const { customProperties } = store.getState().auth;
	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: customProperties.fleetId },
		],
		process.env.REACT_APP_FUEL_ANALYSIS_PERDAY_REPORTS,
	);

	return useQuery({
		queryKey: ['useFuelAnalysisPerdayReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Fuel Analysis PerdayReport'),
	});
};
export const useFuelTankStatsReport = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: 'All Fleets' },
		],
		process.env.REACT_APP_FUEL_TANK_STATS_REPORTS,
	);

	return useQuery({
		queryKey: ['useFuelTankStatsReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Fuel Tank Stats Report'),
	});
};
export const useDetailedFuelReport = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: 'All Fleets' },
		],
		process.env.REACT_APP_FUEL_DETAILED_REPORT,
	);

	return useQuery({
		queryKey: ['useDetailedFuelReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Detailed Fuel Report'),
	});
};

export const useFuelConsumptionDataReport = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: 'All Fleets' },
		],
		process.env.REACT_APP_FUEL_CONSUMPTION_DATA_REPORT,
	);

	return useQuery({
		queryKey: ['useFuelConsumptionDataReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Fuel Consumption Data'),
	});
};
export const useFuelConsumptionRatioReport = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: 'All Fleets' },
		],
		process.env.REACT_APP_FUEL_CONSUMPTION_RATIO_REPORT,
	);

	return useQuery({
		queryKey: ['useFuelConsumptionRatioReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Fuel Consumption Ratio'),
	});
};
export const useDriverActivityReport = (options) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { dateRangeFilter, vinFilter } = options;
	const { endTime, endDate, startDate, startTime } = dateRangeFilter;

	const payload = generateRestAPI(
		[
			{ startdate: startDate + ' ' + startTime },
			{ enddate: endDate + ' ' + endTime },
			{ vin: vinFilter },
			// { vin: vinFilter },
			{ fleet_id: 'All Fleets' },
		],
		process.env.REACT_APP_DRIVER_ACTIVITY_REPORT,
	);

	return useQuery({
		queryKey: ['useDriverActivityReport', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Driver activity report'),
	});
};
