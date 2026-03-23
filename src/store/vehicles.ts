import { createModel } from '@rematch/core';
import type { RootModel } from '.';
import showNotification from '../components/extras/showNotification';
import { dateFormatter, generateRestAPI } from '../helpers/helpers';
import { getData, getUrlEndPoint } from '../services/commonService';
import {
	ITripOverviewOfFleetUtilisation,
	ITripOverviewOfTotalCountBVDistance,
	ITripOverviewOfTotalFuelEngine,
	IVinByFleet,
	IvehicleLocation,
	IvehicleStatus,
	initialKpiOverview,
	initialValuesVehicleDetails,
	initialVehicleLocation,
	intialVehicleStatus,
} from './../type/vehicles-type';
import { store } from './store';
const initialValue = {
	success: false,
	urlEndPoint: '',
	allVehicles: [],
	vehicleSpecifications: initialValuesVehicleDetails,
	isVehicleLocationLoading: true,
	vehicleLocation: initialVehicleLocation,
	vehicleLocationv1: initialVehicleLocation,
	vehiclesStatus: intialVehicleStatus as { [key: string]: string },
	groupNameFilterStatus: [] as { _id: string; fleet_id: string }[],
	tripRoute: [],
	tripRouteV1_1: [],
	message: '',
	showAllVehiclesMap: true,
	trafficButton: false,
	tripHistoryOfFleet: [],
	tripOverviewKPI: initialKpiOverview,
	vinByFleet: [{ vin_no: '' }],
	driverNameFilter: [],
	timeLine: [],
};
export const vehicles = createModel<RootModel>()({
	state: { ...initialValue },
	reducers: {
		responseStatus(state, res) {
			return {
				...state,
				success: res.success,
				message: res.errorMessage || res.message,
				messageCode: res.messageCode,
				vehicleLocation: res.vehicleLocation,
				isVehicleLocationLoading: res.isVehicleLocationLoading,
			};
		},
		setUrlEndPoint(state, res) {
			return {
				...state,
				urlEndPoint: res.url,
				success: res.success,
			};
		},
		setVehicles(state, res) {
			return {
				...state,
				success: res.success,
				allVehicles: res.vehicles,
			};
		},
		setVehiclesLocation(state, res) {
			return {
				...state,
				isVehicleLocationLoading: res.isVehicleLocationLoading,
				success: res.success,
				vehicleLocation: res.vehicleLocation,
			};
		},
		setVehiclesLocationv1(state, res) {
			return {
				...state,
				isVehicleLocationLoading: res.isVehicleLocationLoading,
				success: res.success,
				vehicleLocationv1: res.vehicleLocationv1,
			};
		},
		setGroupNameFilterStatus(state, res) {
			return {
				...state,
				success: res.success,
				groupNameFilterStatus: res.getGroupNameFilter,
				// vehicleLocation: res.vehicleLocation,
			};
		},
		setTripRouter(state, res) {
			return {
				...state,
				success: res.success,
				tripRoute: res.tripRoute,
			};
		},
		setTripRouterV1_1(state, res) {
			return {
				...state,
				success: res.success,
				tripRouteV1_1: res.tripRouteV1_1,
			};
		},

		setVehiclesStatus(state, res) {
			return {
				...state,
				success: res.success,
				vehiclesStatus: res.vehiclesStatus[0],
			};
		},
		setVehicle(state, res) {
			return {
				...state,
				success: res.success,
				vehicleSpecifications: res.vehicleSpecifications,
			};
		},
		setTripHistoryOfFleet(state, res) {
			return {
				...state,
				tripHistoryOfFleet: res,
			};
		},
		setTripOverviewKPI(state, res) {
			return {
				...state,
				tripOverviewKPI: res,
			};
		},
		setTimeline(state, res) {
			return {
				...state,
				timeLine: res,
			};
		},
		setDriverNameFilter(state, res) {
			return {
				...state,
				driverNameFilter: res,
			};
		},
		setVinByFleetName(state, res) {
			return {
				...state,
				vinByFleet: res,
			};
		},
		clearStore() {
			return { ...initialValue };
		},
		cleanVehicle(state) {
			return { ...state, vehicleSpecifications: initialValue.vehicleSpecifications };
		},

		setShowAll(state, res) {
			return {
				...state,
				showAllVehiclesMap: res,
			};
		},
		setStateTrafficButton(state, res) {
			return {
				...state,
				trafficButton: res,
			};
		},
	},
	effects: (dispatch) => ({
		async getEndPointUrlAsync(_: void, rootState) {
			const {
				token,
				user: {
					user: { id, spaceKey },
				},
			} = rootState.auth;
			const payload = {
				spacekey: spaceKey,
				userid: id,
				token,
				data: `{"dcType":[{"type":"mongo"}]}`,
			};
			const getUrlEndPointResponse = await getUrlEndPoint(payload);
			if (getUrlEndPointResponse?.data.length) {
				this.setUrlEndPoint({ url: getUrlEndPointResponse.data[0].url, success: true });
				return { url: getUrlEndPointResponse.data[0].url, success: true };
			} else {
				this.responseStatus({ success: false, url: undefined });
				showNotification(
					'',
					'Oups! Something went wrong while fetching URL End Point. Please try again.',
					'danger',
				);
			}
		},
		async getAllVehiclesAsync(_: void) {
			const payload = generateRestAPI([{ vin: 'All' }], process.env.REACT_APP_VEHICLE_FLEET);
			const getAllVehiclesResponse = await getData(payload, 'all vehicles');
			if (getAllVehiclesResponse?.length) {
				this.setVehicles({ success: true, vehicles: getAllVehiclesResponse });
			} else {
				this.responseStatus({
					success: false,
					message: 'No vehicles available',
				});
			}
		},
		async getVehicleSpecificationAsync(vehicleId: number) {
			const { customProperties } = store.getState().auth;
			let fleetId = customProperties.fleetId ? customProperties.fleetId : 'All Fleets';
			// let fleetName = customProperties.fleetName ? customProperties.fleetName : 'All Fleets';

			const payload = generateRestAPI(
				[{ vin: vehicleId }],
				process.env.REACT_APP_VEHICLE_SPECIFICATION,
			);
			const getVehicleSpecificationResponse = await getData(
				payload,
				"vehicle's specifications",
			);
			if (getVehicleSpecificationResponse?.length) {
				this.setVehicle({
					success: true,
					vehicleSpecifications: getVehicleSpecificationResponse[0],
				});
			} else {
				this.responseStatus({
					success: false,
					vehicleSpecifications: undefined,
					message: "No vehicle's details available",
				});
			}
		},
		async getVehicleLocationAsync(payloadFilter: any, rootState) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { fleet_name, trouble } = payloadFilter;

			const { statusFilter } = rootState.appStoreNoPersist;
			const payload = generateRestAPI(
				[{ fleet_id: fleet_name }, { status: statusFilter.toString() }, { trouble }],
				process.env.REACT_APP_VEHCILE_LOCATION,
			);
			this.setVehiclesLocation({
				isVehicleLocationLoading: true,
			});
			const getLocationVehicleResponse: IvehicleLocation[] = await getData(
				payload,
				"vehicle's location",
			);

			if (getLocationVehicleResponse?.length) {
				this.setVehiclesLocation({
					success: true,
					vehicleLocation: getLocationVehicleResponse,
					isVehicleLocationLoading: false,
				});
			} else {
				this.responseStatus({
					success: false,
					vehicleLocation: [],
					message: "No vehicle's details available",
					isVehicleLocationLoading: false,
				});
			}
			return getLocationVehicleResponse;
		},
		async getVehicleLocationv1Async(_: void, rootState) {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { token } = rootState.auth;
			const { urlEndPoint } = rootState.vehicles;
			const { statusFilter } = rootState.appStoreNoPersist;
			const { sortFilter } = rootState.appStoreNoPersist;
			const { customProperties } = store.getState().auth; 
 			const payload = generateRestAPI(
				[
					{ vin:customProperties.vin ? customProperties.vin :'All Vins' },
					{ fleet_id:customProperties.fleetId ? customProperties.fleetId :'All Fleets' },
					{ status: statusFilter.toString() },
					{ sortfield: sortFilter.sortfield },
					{ sort: sortFilter.sort },
					// { status_sort: sortFilter.statusSort },
				],
				process.env.REACT_APP_VEHICLE_LOCATIONv1,
			);

			this.setVehiclesLocationv1({
				isVehicleLocationLoading: true,
			});
			const getLocationVehicleResponse: IvehicleLocation[] = await getData(
				payload,
				"vehicle's location",
			);

			if (getLocationVehicleResponse?.length) {
				this.setVehiclesLocationv1({
					success: true,
					vehicleLocationv1: getLocationVehicleResponse,
					isVehicleLocationLoading: false,
				});
			} else {
				this.responseStatus({
					success: false,
					vehicleLocationv1: [],
					message: "No vehicle's details available",
					isVehicleLocationLoading: false,
				});
			}
			return getLocationVehicleResponse;
		},

		async getVehicleStatusAsync(payloadFilter, rootState) {
			const { fleet_name: fleetName } = payloadFilter;
			const payload = generateRestAPI(
				[{ fleet_id: fleetName }],
				process.env.REACT_APP_VEHCILE_STATUS,
			);
			const getVehicleStatusResponse: IvehicleStatus[] = await getData(
				payload,
				"vehicles' status",
			);
			if (getVehicleStatusResponse) {
				this.setVehiclesStatus({
					success: true,
					vehiclesStatus: getVehicleStatusResponse,
				});
			} else {
				this.setVehiclesStatus({
					success: false,
					vehiclesStatus: undefined,
				});
			}
			return getVehicleStatusResponse[0];
		},
		async getGroupNameFilterAsync(_: void, rootState) {
			const payload = generateRestAPI([], process.env.REACT_APP_FM_FLEET_FILTER);
			const getGroupNameFilterResponse = await getData(payload, "fleets' name");
			if (getGroupNameFilterResponse) {
				this.setGroupNameFilterStatus({
					success: true,
					getGroupNameFilter: getGroupNameFilterResponse,
				});
			} else {
				this.setGroupNameFilterStatus({
					success: false,
					getGroupNameFilter: [],
				});
			}
		},

		changeShowAllVehicle(payload: boolean, rootstate) {
			this.setShowAll(payload);
		},
		changeTrafficButtonState(payload: boolean, rootstate) {
			this.setStateTrafficButton(payload);
		},
		async getTripRoadRouteAsync(id: string, rootState) {
			const { urlEndPoint } = rootState.vehicles;
			const { token } = rootState.auth;
			const payload = generateRestAPI([{ id }], process.env.REACT_APP_TRIP_ROUTE);
			const getTripRouteResponse = await getData(payload, 'road trip');
			if (getTripRouteResponse) {
				this.setTripRouter({
					success: true,
					tripRoute: getTripRouteResponse,
				});
			} else {
				this.setTripRouter({
					success: false,
					tripRoute: [],
				});
			}
		},
		async getTripRoadRouteV1_1Async(PayloadTripRoad: any, rootState) {
			const { vin, startdate, enddate } = PayloadTripRoad;

			const payload = generateRestAPI(
				[{ vin }, { startdate }, { enddate }],
				process.env.REACT_APP_TRIP_ROUTE_V1_1,
			);
			const getTripRouteResponse = await getData(payload, 'road trip 1.1');
			if (getTripRouteResponse) {
				this.setTripRouterV1_1({
					success: true,
					tripRouteV1_1: getTripRouteResponse,
				});
			} else {
				this.setTripRouterV1_1({
					success: false,
					tripRouteV1_1: [],
				});
			}
		},
		async getTripRoadRouteV2_1Async(PayloadTripRoad: any, rootState) {
			const { vin, startdate, enddate } = PayloadTripRoad;
 			const { customProperties } = store.getState().auth;
			let fleetId = customProperties.fleetId ? customProperties.fleetId : 'All Fleets';
			const payload = generateRestAPI(
				[{ vin }, { startdate }, { enddate },{ fleet_id:fleetId}],
				process.env.REACT_APP_TRIP_ROUTE_V2_1,
			);
			const getTripRouteResponse = await getData(payload, 'road trip 2.1');
			if (getTripRouteResponse) {
				this.setTripRouterV1_1({
					success: true,
					tripRouteV1_1: getTripRouteResponse,
				});
			} else {
				this.setTripRouterV1_1({
					success: false,
					tripRouteV1_1: [],
				});
			}
		},
		async getTripRoadRouteV2_2Async(PayloadTripRoad: any, rootState) {
			  // eslint-disable-next-line @typescript-eslint/naming-convention 
			const { trip_id } = PayloadTripRoad;
			const { customProperties, } = store.getState().auth;
			const payload = generateRestAPI(
				[{ trip_id } ],
				process.env.REACT_APP_TRIP_ROUTE_V2_2,
			);
			const getTripRouteResponse = await getData(payload, 'road trip 2.2');
			if (getTripRouteResponse) {
				return getTripRouteResponse
			} else {
				this.setTripRouterV1_1({
					success: false,
					tripRouteV1_1: [],
				});
			}
		},

		async getTripHistoryOfFleet(payloadFilter: any, rootState) {
			const { fleetName, startdate, enddate, vin } = payloadFilter;
			if (vin === undefined) return delete payloadFilter.vin;

			const payload = generateRestAPI(
				[{ fleet_id: fleetName }, { startdate }, { enddate }, { vin }],
				process.env.REACT_APP_TRIP_HISTORY,
			);
			const getTripHistoryOfFleetResponse: IvehicleLocation[] = await getData(
				payload,
				'trip history of fleet',
			);

			if (Array.isArray(getTripHistoryOfFleetResponse)) {
				this.setTripHistoryOfFleet(getTripHistoryOfFleetResponse);
			} else {
				this.setTripHistoryOfFleet([]);
			}
			return getTripHistoryOfFleetResponse;
		},
		/* async getTripOverviewKPI(payloadFilter: any, rootState) {
			const { fleetName, startdate, enddate, units, vin } = payloadFilter;
			if (vin === undefined) return delete payloadFilter.vin;

			const payloadTotalCount = generateRestAPI(
				[{ fleet_name: fleetName }, { startdate }, { enddate }, { units }, { vin }],
				process.env.REACT_APP_TRIP_OVERVIEW_OF_TOTAL_COUNT,
			);
			const payloadFuelEngine = generateRestAPI(
				[{ fleet_name: fleetName }, { startdate }, { enddate }, { vin }],
				process.env.REACT_APP_TRIP_OVERVIEW_OF_FUEL_ENGINE,
			);

			let payloadUtilization;
			dispatch.vehicles.getVehicleStatusAsync({ fleet_name: fleetName }).then((res) => {
				payloadUtilization = generateRestAPI(
					[
						{ fleet_name: fleetName },
						{ startdate },
						{ enddate },
						{
							noofvehicle: res?.total_vehicles || 0,
						},
					],
					process.env.REACT_APP_TRIP_OVERVIEW_OF_FLEET_UTILISATION,
				);
			});

			let kpiResponses = {};

			const getTripOverviewOfTotalCountBVDistanceResponse: ITripOverviewOfTotalCountBVDistance[] =
				await getData(payloadTotalCount, 'total count BV Distance');

			const getTripOverviewOfTotalFuelEngineResponse: ITripOverviewOfTotalFuelEngine[] =
				await getData(payloadFuelEngine, 'total fuel engine');

			const getTripOverviewOfFleetUtilisationResponse: ITripOverviewOfFleetUtilisation[] =
				await getData(payloadUtilization, 'fleet utilisation');

			if (
				getTripOverviewOfTotalCountBVDistanceResponse &&
				getTripOverviewOfTotalFuelEngineResponse &&
				getTripOverviewOfFleetUtilisationResponse
			) {
				kpiResponses = {
					...initialKpiOverview,
					...getTripOverviewOfTotalCountBVDistanceResponse[0],
					...getTripOverviewOfTotalFuelEngineResponse[0],
					...getTripOverviewOfFleetUtilisationResponse[0],
				};

				this.setTripOverviewKPI(kpiResponses);
			} else {
				this.setTripOverviewKPI(initialKpiOverview);
			}

			return kpiResponses;
		}, */

		async getVinByFleet(payloadFilter: { fleetname?: string }, rootState) {
			const fleetname = payloadFilter.fleetname ?? "All Fleets";
			const payload = generateRestAPI([  { fleet_id:fleetname },], process.env.REACT_APP_VIN_BY_FLEET);
			const getVinByFleetnameResponse: IVinByFleet[] = await getData(
				payload,
				'Vin by fleet',
				// true
			);

			if (Array.isArray(getVinByFleetnameResponse)) {
				this.setVinByFleetName(getVinByFleetnameResponse);
			} else {
				this.setVinByFleetName([]);
			}
			return getVinByFleetnameResponse;
		},
		async getVehicleTimeline(payloadFilter: string, rootState) {
			const currentDate = new Date();
			const startOfDay = new Date(currentDate);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date(currentDate);
			endOfDay.setHours(23, 59, 59);

			const formattedStartDate = dateFormatter(startOfDay, 'YYYY-MM-DD HH:mm:ss');
			const formattedEndDate = dateFormatter(endOfDay, 'YYYY-MM-DD HH:mm:ss');

			const payload = generateRestAPI(
				[
					{ vin: payloadFilter },
					{ startdate: formattedStartDate },
					{ enddate: formattedEndDate },
				],
				process.env.REACT_APP_TIMELINE_STATUS,
			);
			const getTimelineResponse: any = await getData(payload, 'Timeline Response');

			if (Array.isArray(getTimelineResponse)) {
				this.setVinByFleetName(getTimelineResponse);
			} else {
				this.setVinByFleetName([]);
			}
			return getTimelineResponse;
		},
	}),
});
