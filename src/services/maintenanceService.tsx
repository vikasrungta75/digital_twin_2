
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { generateRestAPI } from '../helpers/helpers';
// import { store } from '../store/store';
// import { dataIngestion, getData } from './commonService';

// export const useGetMaintenanceTasks = (filters: {
// 	vin_filter: string;
// 	status_filter: string;
// 	sort: number;
// 	sortField: number;
// }) => {
// 	const {
// 		user: {
// 			user: { id },
// 		},
// 	} = store.getState().auth;

// 	const payload = generateRestAPI(
// 		[
// 			{ user_id: id },
// 			{ sortfield: filters.sortField },
// 			{ vin: filters.vin_filter === 'All' ? 'All Vins' : filters.vin_filter },
// 			{ status: filters.status_filter },
// 			{ sort: filters.sort },
// 		],
// 		process.env.REACT_APP_MAINTENANCE_TASKS,
// 	);

// 	return useQuery({
// 		queryKey: ['getMaintenanceTasks', payload],
// 		staleTime: 300000,
// 		queryFn: () => getData(payload, 'all maintenance tasks'),
// 	});
// };

// export const useCreateMaintenance = () => {
// 	const {
// 		user: {
// 			user: { id, emailID, userName },
// 		},
// 		customProperties,
// 	} = store.getState().auth;
// 	const fleetId = customProperties.fleetId;
// 	const organisationId = customProperties.organisationId;
//     const fleetIdParsed = /^\d+$/.test(fleetId) ? parseInt(fleetId, 10) : fleetId;
// 	const organisationIdParsed = /^\d+$/.test(organisationId) ? [2] : [organisationId];
// 	return useMutation((payload: { revision: any; action: string }) =>
// 		dataIngestion({
// 			...payload.revision,
// 			user_id: id,
// 			user_email: emailID,
// 			user_name: userName,
// 			fleet_id: fleetIdParsed,
// 			action: payload.action,
// 			organisation_id:organisationId,
// 		}),
// 	);
// };

// export const useDeleteUpdateMaintenance = () => {
// 	const {
// 		user: {
// 			user: { id },
// 		},
// 		customProperties,
// 	} = store.getState().auth;

// 	return useMutation((payload: { revision: any; action: string }) =>
// 		dataIngestion({
// 			...payload.revision,
// 			user_id: id,
// 			fleet_id: customProperties.fleetId,
// 			organisation_id:customProperties.organisationId,
// 			action: payload.action,
// 		}),
// 	);
// };

// export const useGetMaintenanceFinishedValues = (options: { vin: any }) => {
// 	const payload = generateRestAPI([{ vin: options.vin }], process.env.REACT_APP_FINISHED_VALUES);

// 	return useQuery({
// 		queryKey: ['GetMaintenanceFinishedValues', payload],
// 		staleTime: 300000,
// 		queryFn: () => getData(payload, 'Maintenance Finished Values'),
// 	});
// };

// export const useGetMaintenanceStatusFilter = () => {
// 	const payload = generateRestAPI([], process.env.REACT_APP_MAINTENANCE_STATUS_FILTER);

// 	return useQuery({
// 		queryKey: ['useGetMaintenanceFilter', payload],
// 		queryFn: () => getData(payload, 'maintenance filter', true),
// 		staleTime: 300000,
// 	});
// };

// export const useGetMaintenanceVin = () => {
// 	const {
// 		user: {
// 			user: { id },
// 		},
// 	} = store.getState().auth;
// 	const payload = generateRestAPI([{ user_id: id }], process.env.REACT_APP_VIN_BY_FLEET);

// 	return useQuery({
// 		queryKey: ['useGetMaintenanceVin', payload],
// 		queryFn: () => getData(payload, 'maintenanceVin'),
// 		staleTime: 300000,
// 	});
// };



import { useMutation, useQuery } from '@tanstack/react-query';
import { generateRestAPI } from '../helpers/helpers';
import { store } from '../store/store';
import { dataIngestion, getData } from './commonService';

export const useGetMaintenanceTasks = (filters: {
    vin_filter: string;
    status_filter: string;
    sort: number;
    sortField: number;
}, p0: { refetchOnMountOrArgChange: boolean; }) => {
	const {
		user: {
			user: { id },
		}, customProperties,
	} = store.getState().auth;
	const orgArray = customProperties.organisationId
		? customProperties.organisationId.split(",").map(Number)
		: [];

	const payload = generateRestAPI(
		[
			{ user_id: id },
			{ sortfield: filters.sortField },
			{ vin: filters.vin_filter === 'All' ? 'All Vins' : filters.vin_filter },
			{ status: filters.status_filter },
			{ sort: filters.sort },
			// { organisation_id: [1,2] }, 
			{ organisation_id: orgArray }
		],
		process.env.REACT_APP_MAINTENANCE_TASKS,
	);

	return useQuery({
		queryKey: ['getMaintenanceTasks', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'all maintenance tasks'),
	});
};

export const useCreateMaintenance = () => {
	const {
		user: {
			user: { id, emailID, userName },
		},
		customProperties,
	} = store.getState().auth;

	const fleetId = customProperties.fleetId;
	const organisationId = customProperties.organisationId;
	const fleetIdParsed = /^\d+$/.test(fleetId) ? [fleetId] : ["All Fleets"];
	const organisationIdParsed = [1, 2];

	return useMutation((payload: { revision: any; action: string }) =>
		dataIngestion({
			...payload.revision,
			user_id: id,
			user_email: emailID,
			user_name: userName,
			fleet_id: fleetIdParsed,
			action: payload.action,
			organisation_id: organisationIdParsed,
		}),
	);
};

export const useDeleteUpdateMaintenance = () => {
	const {
		user: {
			user: { id },
		},
		customProperties,
	} = store.getState().auth;

	return useMutation((payload: { revision: any; action: string }) =>
		dataIngestion({
			...payload.revision,
			user_id: id,
			fleet_id: customProperties.fleetId,
			organisation_id: [1, 2],
			action: payload.action,
		}),
	);
};

export const useGetMaintenanceFinishedValues = (options: { vin: any }) => {
	const payload = generateRestAPI([{ vin: options.vin }], process.env.REACT_APP_FINISHED_VALUES);

	return useQuery({
		queryKey: ['GetMaintenanceFinishedValues', payload],
		staleTime: 300000,
		queryFn: () => getData(payload, 'Maintenance Finished Values'),
	});
};

export const useGetMaintenanceStatusFilter = () => {
	const payload = generateRestAPI([], process.env.REACT_APP_MAINTENANCE_STATUS_FILTER);

	return useQuery({
		queryKey: ['useGetMaintenanceFilter', payload],
		queryFn: () => getData(payload, 'maintenance filter', true),
		staleTime: 300000,
	});
};

export const useGetMaintenanceVin = () => {
	const {
		user: {
			user: { id },
		},
	} = store.getState().auth;

	const payload = generateRestAPI([{ user_id: id }], process.env.REACT_APP_VIN_BY_FLEET);

	return useQuery({
		queryKey: ['useGetMaintenanceVin', payload],
		queryFn: () => getData(payload, 'maintenanceVin'),
		staleTime: 300000,
	});
};
