import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import { generateRestAPI, getDefaultFleetFilter } from '../helpers/helpers';
import { dataIngestion, getData } from '../services/commonService';
import moment from 'moment';

const initialValues = {
	tasks: [],
	TaskEdit: [],
	taskNoDeliver: [{ name: 'Number of deliveries', data: [] }],
	taskNoDeliverInTime: [{ name: 'Number of deliveries in time', data: [] }],
	numberOfCanceledDeliveries: [{ name: 'Number of canceled deliveries', data: [] }],
	TotalDeliveryTime: [{ name: 'Total delivery time', data: [] }],
	totalDelayTime: [{ name: 'Total delay time', data: [] }],
	totalOfEachStatus: [{ name: 'Total of each status', data: [] }],
	numberOfDelaysEvent: [{ name: 'Number of delays', data: [] }],
	averageDelayPerTask: [{ name: 'Average delay per task', data: [] }],
};

export const tasks = createModel<RootModel>()({
	state: { ...initialValues },
	reducers: {
		setTasks(state, res) {
			return {
				...state,
				tasks: res,
			};
		},
		setTaskEdit(state, res) {
			return {
				...state,
				TaskEdit: res,
			};
		},
		//******************************************** */
		setTask_no_deliver(state, res) {
			return {
				...state,
				taskNoDeliver: res,
			};
		},
		setTaskNoDeliverIntime(state, res) {
			return {
				...state,
				taskNoDeliverInTime: res,
			};
		},

		setNumberOfCanceledDeliveries(state, res) {
			return {
				...state,
				numberOfCanceledDeliveries: res,
			};
		},
		setTotalDeliveryTime(state, res) {
			return {
				...state,
				TotalDeliveryTime: res,
			};
		},
		setTotalDelayTime(state, res) {
			return {
				...state,
				totalDelayTime: res,
			};
		},
		setTotalOfEachStatus(state, res) {
			return {
				...state,
				totalOfEachStatus: res,
			};
		},

		setNumberOfDelaysEvent(state, res) {
			return {
				...state,
				numberOfDelaysEvent: res,
			};
		},
		setAverageDelayPerTask(state, res) {
			return {
				...state,
				averageDelayPerTask: res,
			};
		},

		//******************************************** */
	},

	effects: (dispatch) => ({
		async getTasksAsync(payload, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;

			// Parse organisationId safely into a number array
			const organisationId: number[] = (() => {
				const org = customProperties.organisationId;

				if (!org) return [];

				if (Array.isArray(org)) {
					// eslint-disable-next-line @typescript-eslint/no-shadow
					return org.map((id) => Number(id));
				}

				if (typeof org === 'string') {
					return org.includes(',')
						? // eslint-disable-next-line @typescript-eslint/no-shadow
						  org.split(',').map((id) => Number(id.trim()))
						: [Number(org)];
				}

				if (typeof org === 'number') {
					return [org];
				}

				return [];
			})();

			const credentials = generateRestAPI(
				[
					{ fleet_id: customProperties.fleetId },
					// { organisation_id: organisationId },
					// eslint-disable-next-line @typescript-eslint/no-shadow
					...organisationId.map((id) => ({ organisation_id: id })),
					//  { organisation_id: 1 },
					{ user_id: id },
					{ vin: payload?.vin || 'All Vins' },
					// { name_order:payload.Name  },
					// { status_order:payload.status  },
					{ started: payload.status },
				],
				process.env.REACT_APP_POI_MYFLEET_TASK,
			);

			const getTasksResponse: any[] = await getData(credentials, 'tasks');

			if (Array.isArray(getTasksResponse)) {
				this.setTasks(getTasksResponse);
			} else {
				this.setTasks([]);
			}
			return getTasksResponse;
		},
		async getOneTaskAsync(payload, rootState) {
			const {
				user: {
					user: { id },
				},
				customProperties,
			} = rootState.auth;

			const credentials = generateRestAPI(
				[{ poi_id: payload?.poi_id || '' }],
				process.env.REACT_APP_POI_MYFLEET_TASK_GET_ONE,
			);

			const getTasksResponse: any[] = await getData(credentials, 'tasks');

			if (Array.isArray(getTasksResponse)) {
				this.setTaskEdit(getTasksResponse);
			} else {
				this.setTaskEdit([]);
			}
			return getTasksResponse;
		},

		async addTask(payload: any, rootState) {
			const {
				user: {
					user: { id, emailID, userName },
				},
				customProperties,
			} = rootState.auth;

			const organisationId: number[] = (() => {
				const org = customProperties.organisationId;

				if (!org) return []; // undefined or null

				if (Array.isArray(org)) {
					// Already an array
					// eslint-disable-next-line @typescript-eslint/no-shadow
					return org.map((id) => Number(id));
				}

				if (typeof org === 'string') {
					// Comma-separated string
					return org.includes(',')
						? // eslint-disable-next-line @typescript-eslint/no-shadow
						  org.split(',').map((id) => Number(id))
						: [Number(org)];
				}

				if (typeof org === 'number') {
					// Single number
					return [org];
				}

				return []; // fallback
			})();

			const payloadTask = {
				...payload,
				user_id: id,
				user_email: emailID,
				user_name: userName,
				fleet_id: customProperties.fleetId,
				role: customProperties.role,
				organisation_id: organisationId,
			};

			const addTaskResponse = await dataIngestion(payloadTask);
			if (addTaskResponse.success) {
				return true;
			} else {
				return false;
			}
		},

		async deleteGeofenceAsync(payload: { poiId: string }, rootState) {
			const { poiId } = payload;
			
			const {
				user: {
					user: { id, emailID, fullName },
				},
				customProperties,
			} = rootState.auth;
		

			const organisationId: number[] = (() => {
				const org = customProperties.organisationId;

				if (!org) return []; // undefined or null

				if (Array.isArray(org)) {
					// eslint-disable-next-line @typescript-eslint/no-shadow
					return org.map((id) => Number(id));
				}

				if (typeof org === 'string') {
					return org.includes(',')
						? // eslint-disable-next-line @typescript-eslint/no-shadow
						  org.split(',').map((id) => Number(id))
						: [Number(org)];
				}

				if (typeof org === 'number') {
					return [org];
				}

				return []; // fallback
			})();

			const credentials = {
				task_unique_id: poiId,
				fleet_id: customProperties.fleetId,
				user_id: id,
				user_email: emailID,
				user_name: fullName,
				action: 'Delete poi task',
				organisation_id: organisationId,
			};
			
			const deleteGeofenceResponse = await dataIngestion(credentials);
			if (deleteGeofenceResponse.success) {
				return true;
			} else {
				return false;
			}
		},

		async getTaskNoDeliver(date) {
			const { startDate, endDate, vinFilter } = date;
			// const { startDate, endDate, vinFilter,AllDrivers } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				// [{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter },{driver_name:AllDrivers}],
				process.env.REACT_APP_VC_POI_TASK_NO_DELIVER,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				this.setTask_no_deliver(getTaskNoDeliverResponse);
			} else {
				this.setTask_no_deliver(initialValues.taskNoDeliver);
			}
			return getTaskNoDeliverResponse;
		},

		async getTaskNoDeliverInTime(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_NO_DELIVER_INTIME,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				this.setTaskNoDeliverIntime(getTaskNoDeliverResponse);
			} else {
				this.setTaskNoDeliverIntime(initialValues.taskNoDeliverInTime);
			}
			return getTaskNoDeliverResponse;
		},
		async getTaskNoDeliverCanceledDeliveries(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_NO_CANCEL_DELIVER,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				this.setNumberOfCanceledDeliveries(getTaskNoDeliverResponse);
			} else {
				this.setNumberOfCanceledDeliveries(initialValues.numberOfCanceledDeliveries);
			}
			return getTaskNoDeliverResponse;
		},
		async getTotalDeliveryTime(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_TOTAL_DELIVER_TIME,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				this.setTotalDeliveryTime(getTaskNoDeliverResponse);
			} else {
				this.setTotalDeliveryTime(initialValues.TotalDeliveryTime);
			}
			return getTaskNoDeliverResponse;
		},
		async gettotalDelayTime(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_DELAYPERTASK,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				const updatedResponse = getTaskNoDeliverResponse.map((item) => ({
					...item,
					name: 'Total Delay Time',
				}));

				this.setTotalDelayTime(updatedResponse);
			} else {
				this.setTotalDelayTime(initialValues.totalDelayTime);
			}
			return getTaskNoDeliverResponse;
		},
		async getTotalOfEachStatus(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_STATUS_COUNT,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'TotalOfEachStatus');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				this.setTotalOfEachStatus(getTaskNoDeliverResponse);
			} else {
				this.setTotalOfEachStatus(initialValues.totalOfEachStatus);
			}
			return getTaskNoDeliverResponse;
		},

		async getNumberOfDelaysEvent(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_NOOFDELAYEDEVENT,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				// 👇 just update the name, keep rest of structure same
				const updatedResponse = getTaskNoDeliverResponse.map((item) => ({
					...item,
					name: 'Number of delays',
				}));

				this.setNumberOfDelaysEvent(updatedResponse);
			} else {
				this.setNumberOfDelaysEvent(initialValues.numberOfDelaysEvent);
			}
			return getTaskNoDeliverResponse;
		},

		// async getAverageDelayPerTask(date) {
		// 	const { startDate, endDate, vinFilter } = date;

		// 	const payload = generateRestAPI(
		// 		[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
		// 		process.env.REACT_APP_VC_POI_TASK_AVERAGE_DELAY,
		// 	);
		// 	const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
		// 	if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
		// 		const mappedData = getTaskNoDeliverResponse.flatMap((item) =>
		// 			item.data.map((d: any) => [new Date(d.date).getTime(), Number(d.avg_delay)]),
		// 		);

		// 		this.setAverageDelayPerTask([
		// 			{
		// 				name: 'Average delay per task',
		// 				data: mappedData,
		// 			},
		// 		]);
		// 	} else {
		// 		this.setAverageDelayPerTask(initialValues.averageDelayPerTask);
		// 	}
		// 	return getTaskNoDeliverResponse;
		// },

		// async getAverageDelayPerTask(date) {
		// 	const { startDate, endDate,vinFilter } = date;

		// 	const payload = generateRestAPI(
		// 		[{ startdate: startDate }, { enddate: endDate }, { vin:vinFilter }, ],
		// 		process.env.REACT_APP_VC_POI_TASK_AVERAGE_DELAY,
		// 	);
		// 	const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
		// 	if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
		// 		this.setAverageDelayPerTask(getTaskNoDeliverResponse);
		// 	} else {
		// 		this.setAverageDelayPerTask(initialValues.averageDelayPerTask);
		// 	}
		// 	return getTaskNoDeliverResponse;
		// },
		async getAverageDelayPerTask(date) {
			const { startDate, endDate, vinFilter } = date;

			const payload = generateRestAPI(
				[{ startdate: startDate }, { enddate: endDate }, { vin: vinFilter }],
				process.env.REACT_APP_VC_POI_TASK_AVERAGE_DELAY,
			);
			const getTaskNoDeliverResponse: any[] = await getData(payload, 'drainage');
			if (Array.isArray(getTaskNoDeliverResponse) && getTaskNoDeliverResponse.length > 0) {
				const updatedResponse = getTaskNoDeliverResponse.map((item) => ({
					...item,
					name: 'Average Delay Per Task',
				}));
				this.setAverageDelayPerTask(updatedResponse);
			} else {
				this.setAverageDelayPerTask(initialValues.averageDelayPerTask);
			}
			return getTaskNoDeliverResponse;
		},
	}),
});
